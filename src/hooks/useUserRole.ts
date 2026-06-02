import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isAdminRole, getPrimaryRole, type AppRole } from '@/config/roles';

type UserRole = AppRole | null;

interface UseUserRoleResult {
  role: UserRole;
  allRoles: AppRole[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isHandwerker: boolean;
  isClient: boolean;
  hasAdminRole: boolean;
  hasSuperAdminRole: boolean;
  hasHandwerkerRole: boolean;
  loading: boolean;
  userId: string | null;
}

// ---- Module-level SSOT cache + in-flight dedup ------------------------------
// All hook instances share the same cache and the same in-flight promise per
// userId, so a single login does not trigger N parallel /user_roles requests.
const roleCache = new Map<string, { roles: AppRole[]; timestamp: number }>();
const inFlight = new Map<string, Promise<AppRole[]>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadRoles(userId: string): Promise<AppRole[]> {
  const cached = roleCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.roles;
  }

  const existing = inFlight.get(userId);
  if (existing) return existing;

  const promise = (async () => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) {
      // Transient (network/throttle) — do NOT poison the cache and do NOT
      // overwrite previously known roles. Re-throw so callers keep last state.
      console.error('Error fetching user roles:', error);
      throw error;
    }

    const fetched: AppRole[] = (data ?? []).map((r) => r.role as AppRole);
    if (fetched.length === 0) {
      console.warn('[useUserRole] No roles found for user:', userId, '- defaulting to user role');
    }
    const roles = fetched.length > 0 ? fetched : (['user'] as AppRole[]);
    roleCache.set(userId, { roles, timestamp: Date.now() });
    return roles;
  })().finally(() => {
    inFlight.delete(userId);
  });

  inFlight.set(userId, promise);
  return promise;
}

export function useUserRole(): UseUserRoleResult {
  const [allRoles, setAllRoles] = useState<AppRole[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let currentUserId: string | null = null;

    const applyRoles = async (uid: string) => {
      try {
        const roles = await loadRoles(uid);
        if (isMounted) {
          setAllRoles(roles);
          setLoading(false);
        }
      } catch {
        // Transient error: keep whatever roles we already had. If we had none,
        // stay in loading=false but don't flip to ['user'] — a subsequent
        // event (or next mount) will retry via loadRoles.
        if (isMounted) setLoading(false);
      }
    };

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        currentUserId = session.user.id;
        if (isMounted) setUserId(session.user.id);
        await applyRoles(session.user.id);
      } else if (isMounted) {
        setAllRoles([]);
        setUserId(null);
        setLoading(false);
      }
    };

    init();

    // Only react to identity-changing events. TOKEN_REFRESHED / USER_UPDATED /
    // INITIAL_SESSION do not change the user id and would otherwise cause a
    // refetch storm right after login.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        currentUserId = null;
        roleCache.clear();
        inFlight.clear();
        if (isMounted) {
          setAllRoles([]);
          setUserId(null);
          setLoading(false);
        }
        return;
      }

      if (event !== 'SIGNED_IN') return;
      const newUid = session?.user?.id ?? null;
      if (!newUid || newUid === currentUserId) return; // same user, ignore

      currentUserId = newUid;
      if (isMounted) setUserId(newUid);
      // Defer the supabase query out of the auth callback (deadlock-safe).
      setTimeout(() => {
        if (isMounted) applyRoles(newUid);
      }, 0);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const primaryRole = getPrimaryRole(allRoles) || (allRoles.length > 0 ? allRoles[0] : null);
  const hasAdminRole = allRoles.some((r) => isAdminRole(r));
  const hasSuperAdminRole = allRoles.includes('super_admin');
  const hasHandwerkerRole = allRoles.includes('handwerker');

  return {
    role: primaryRole,
    allRoles,
    isAdmin: hasAdminRole,
    isSuperAdmin: hasSuperAdminRole,
    isHandwerker: hasHandwerkerRole,
    isClient: primaryRole === 'client' || primaryRole === 'user',
    hasAdminRole,
    hasSuperAdminRole,
    hasHandwerkerRole,
    loading,
    userId,
  };
}

export function clearRoleCache() {
  roleCache.clear();
  inFlight.clear();
}
