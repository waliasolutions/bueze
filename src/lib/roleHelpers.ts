import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

/**
 * Check if a user has a specific role
 * Use this for non-hook contexts (utility functions, edge functions)
 */
export async function checkUserHasRole(userId: string, role: AppRole): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', role)
    .maybeSingle();

  if (error) {
    console.error('Error checking user role:', error);
    return false;
  }

  return !!data;
}

/**
 * Check if a user has admin or super_admin role
 */
export async function checkUserIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['admin', 'super_admin'])
    .maybeSingle();

  if (error) {
    console.error('Error checking admin role:', error);
    return false;
  }

  return !!data;
}

/**
 * Upsert a user role (insert or update if exists)
 */
export async function upsertUserRole(userId: string, role: AppRole): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('user_roles')
    .upsert(
      { user_id: userId, role },
      { onConflict: 'user_id,role' }
    );

  if (error) {
    console.error('Error upserting user role:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get all roles for a user
 */
export async function getUserRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }

  return data?.map(r => r.role) || [];
}

/**
 * Remove a role from a user
 */
export async function removeUserRole(userId: string, role: AppRole): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role', role);

  if (error) {
    console.error('Error removing user role:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
