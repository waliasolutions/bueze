import { supabase } from '@/integrations/supabase/client';

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
 * Get user role (handwerker, admin, super_admin, or user)
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
    
    return 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
};
