import { supabase } from '@/integrations/supabase/client';

/**
 * ============================================
 * BÜEZE ROLE SYSTEM DOCUMENTATION
 * ============================================
 * 
 * IMPORTANT: For React components, use the useUserRole hook instead
 * of these helper functions. The hook provides cached role checking
 * and prevents duplicate database queries.
 * 
 * These helper functions are intended for:
 * - Server-side / Edge function contexts
 * - Non-React utility functions
 * - One-off checks outside of component lifecycle
 * 
 * For component role checks, import: 
 *   import { useUserRole } from '@/hooks/useUserRole';
 * 
 * This software uses THREE primary roles:
 * 
 * 1. admin / super_admin
 *    - Platform administrators who manage the system
 *    - Can approve/reject handwerker registrations
 *    - Can view all data and manage users
 * 
 * 2. handwerker
 *    - Craftsmen/tradespeople who respond to leads
 *    - Can browse and submit proposals for leads
 *    - Must be verified by admin before accessing leads
 * 
 * 3. user / client
 *    - Homeowners/clients who submit project leads
 *    - Can create leads and review proposals
 *    - 'user' is legacy name, 'client' is preferred
 * 
 * Note: Other roles (e.g., department_admin) exist in the 
 * database but belong to other software projects sharing 
 * this Supabase instance. They are NOT used by Büeze.
 * ============================================
 */

/**
 * Unified Handwerker Detection
 * Checks if a user has a handwerker profile
 */
export const isHandwerker = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('handwerker_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking handwerker status:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Exception checking handwerker status:', error);
    return false;
  }
};

/**
 * Check if user has admin or super_admin role
 */
export const isAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'super_admin'])
      .maybeSingle();
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Exception checking admin status:', error);
    return false;
  }
};

/**
 * Enhanced logout that clears all session data
 */
export const enhancedLogout = async (): Promise<void> => {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear all handwerker-related localStorage
    localStorage.removeItem('handwerker-onboarding-draft');
    
    // Clear any other session-specific data
    sessionStorage.clear();
    
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
};

/**
 * Check if user has client role (homeowner who submits leads)
 * Accepts both 'user' (legacy) and 'client' roles
 */
export const isClient = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['user', 'client'])
      .maybeSingle();
    
    if (error) {
      console.error('Error checking client status:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Exception checking client status:', error);
    return false;
  }
};

/**
 * Get user role (handwerker, admin, super_admin, user/client)
 */
export const getUserRole = async (userId: string): Promise<string> => {
  try {
    // Check admin role first
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (roleData && (roleData.role === 'admin' || roleData.role === 'super_admin')) {
      return roleData.role;
    }
    
    // Check if handwerker
    const isHw = await isHandwerker(userId);
    if (isHw) {
      return 'handwerker';
    }
    
    // Return 'client' if user has that role, otherwise default to 'user'
    if (roleData && roleData.role === 'client') {
      return 'client';
    }
    
    return 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
};
