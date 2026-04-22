import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';

type Action = 'list' | 'setup';

interface RecoveryUser {
  userId: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  roles: string[];
}

function splitFullName(fullName: string | null | undefined) {
  const trimmed = fullName?.trim() || '';
  if (!trimmed) {
    return { firstName: null, lastName: null };
  }

  const [firstName, ...rest] = trimmed.split(/\s+/);
  return {
    firstName: firstName || null,
    lastName: rest.join(' ') || null,
  };
}

async function requireAdmin(req: Request, supabase: ReturnType<typeof createSupabaseAdmin>) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Unauthorized');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['admin', 'super_admin'])
    .maybeSingle();

  if (roleError || !roleData) {
    throw new Error('Unauthorized');
  }

  return user;
}

async function listMissingUsers(supabase: ReturnType<typeof createSupabaseAdmin>) {
  const authUsers: Array<{ id: string; email: string; created_at: string; last_sign_in_at: string | null }> = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = data?.users ?? [];
    if (users.length === 0) break;

    users.forEach((user) => {
      if (user.email) {
        authUsers.push({
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at ?? null,
        });
      }
    });

    if (users.length < perPage) break;
    page += 1;
  }

  const userIds = authUsers.map((user) => user.id);
  if (userIds.length === 0) {
    return [] as RecoveryUser[];
  }

  const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }, { data: handwerkerProfiles, error: handwerkerProfilesError }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, phone').in('id', userIds),
    supabase.from('user_roles').select('user_id, role').in('user_id', userIds),
    supabase.from('handwerker_profiles').select('user_id').in('user_id', userIds),
  ]);

  if (profilesError) throw profilesError;
  if (rolesError) throw rolesError;
  if (handwerkerProfilesError) throw handwerkerProfilesError;

  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const rolesMap = new Map<string, string[]>();
  (roles || []).forEach((roleRow) => {
    const existing = rolesMap.get(roleRow.user_id) || [];
    existing.push(roleRow.role);
    rolesMap.set(roleRow.user_id, existing);
  });

  const handwerkerProfileIds = new Set((handwerkerProfiles || []).map((profile) => profile.user_id).filter(Boolean));
  const adminRoles = new Set(['admin', 'super_admin', 'department_admin']);

  return authUsers
    .filter((user) => !handwerkerProfileIds.has(user.id))
    .filter((user) => !(rolesMap.get(user.id) || []).some((role) => adminRoles.has(role)))
    .map((user) => {
      const profile = profileMap.get(user.id);
      return {
        userId: user.id,
        email: user.email,
        fullName: profile?.full_name ?? null,
        phone: profile?.phone ?? null,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
        roles: rolesMap.get(user.id) || [],
      } satisfies RecoveryUser;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

async function setupMissingProfile(supabase: ReturnType<typeof createSupabaseAdmin>, userId: string) {
  const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
  if (authError || !authData?.user?.email) {
    throw new Error('Auth-Benutzer konnte nicht geladen werden.');
  }

  const { data: existingHandwerkerProfile, error: existingHandwerkerError } = await supabase
    .from('handwerker_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingHandwerkerError) throw existingHandwerkerError;
  if (existingHandwerkerProfile) {
    return {
      profileId: existingHandwerkerProfile.id,
      message: 'Für diesen Benutzer existiert bereits ein Handwerker-Profil.',
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, phone, email')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) {
    throw new Error('Öffentliches Profil fehlt. Bitte zuerst das profiles-Profil prüfen.');
  }

  const { firstName, lastName } = splitFullName(profile.full_name);

  const { data: insertedProfile, error: insertError } = await supabase
    .from('handwerker_profiles')
    .insert({
      user_id: userId,
      first_name: firstName,
      last_name: lastName,
      email: authData.user.email,
      phone_number: profile.phone ?? null,
      verification_status: 'pending',
      is_verified: false,
      categories: [],
      service_areas: [],
    })
    .select('id')
    .single();

  if (insertError) throw insertError;

  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role: 'handwerker' }, { onConflict: 'user_id,role' });

  if (roleError) throw roleError;

  return {
    profileId: insertedProfile.id,
    message: `Handwerker-Profil für ${authData.user.email} wurde erstellt.`,
  };
}

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseAdmin();
    await requireAdmin(req, supabase);

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const action = body.action as Action | undefined;

    if (action === 'setup') {
      if (!body.userId || typeof body.userId !== 'string') {
        return errorResponse('userId ist erforderlich.', 400);
      }

      const result = await setupMissingProfile(supabase, body.userId);
      return successResponse({ success: true, ...result });
    }

    if (action && action !== 'list') {
      return errorResponse('Ungültige Aktion.', 400);
    }

    const users = await listMissingUsers(supabase);
    return successResponse({ success: true, users });
  } catch (error) {
    console.error('admin-handwerker-recovery error:', error);
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    const status = message === 'Unauthorized' ? 401 : 500;
    return errorResponse(message, status);
  }
});