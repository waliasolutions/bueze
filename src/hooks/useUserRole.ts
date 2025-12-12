import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'super_admin' | 'handwerker' | 'client' | 'user' | null;

// Role priority order (highest to lowest)
const ROLE_PRIORITY: UserRole[] = ['super_admin', 'admin', 'handwerker', 'client', 'user'];

interface UseUserRoleResult {
  role: UserRole;
  allRoles: UserRole[];
  isAdmin: boolean;
  isHandwerker: boolean;
  isClient: boolean;
  hasAdminRole: boolean;
  hasHandwerkerRole: boolean;
  loading: boolean;
  userId: string | null;
}

// Cache for role data to prevent repeated queries
const roleCache = new Map<string, { roles: UserRole[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useUserRole(): UseUserRoleResult {
  const [allRoles, setAllRoles] = useState<UserRole[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchRoles = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          if (isMounted) {
            setAllRoles([]);
            setUserId(null);
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setUserId(user.id);
        }

        // Check cache first
        const cached = roleCache.get(user.id);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          if (isMounted) {
            setAllRoles(cached.roles);
            setLoading(false);
          }
          return;
        }

        // Fetch all roles from database (handles multiple roles)
        const { data: rolesData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user roles:', error);
        }

        // Extract roles array
        const fetchedRoles: UserRole[] = rolesData?.map(r => r.role as UserRole) || ['user'];
        
        // Update cache
        roleCache.set(user.id, { roles: fetchedRoles, timestamp: Date.now() });

        if (isMounted) {
          setAllRoles(fetchedRoles.length > 0 ? fetchedRoles : ['user']);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in useUserRole:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRoles();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setAllRoles([]);
        setUserId(null);
        roleCache.clear();
      } else if (session?.user && isMounted) {
        // Clear cache for this user and refetch
        roleCache.delete(session.user.id);
        fetchRoles();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Get the highest priority role
  const primaryRole = ROLE_PRIORITY.find(r => allRoles.includes(r)) || (allRoles.length > 0 ? allRoles[0] : null);
  
  // Check for specific role types
  const hasAdminRole = allRoles.includes('admin') || allRoles.includes('super_admin');
  const hasHandwerkerRole = allRoles.includes('handwerker');

  return {
    role: primaryRole,
    allRoles,
    isAdmin: hasAdminRole,
    isHandwerker: hasHandwerkerRole,
    isClient: primaryRole === 'client' || primaryRole === 'user',
    hasAdminRole,
    hasHandwerkerRole,
    loading,
    userId,
  };
}

// Utility to clear the role cache (useful for logout)
export function clearRoleCache() {
  roleCache.clear();
}
