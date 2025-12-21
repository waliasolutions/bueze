import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ROLE_CONFIG, isAdminRole, getPrimaryRole, type AppRole } from '@/config/roles';

// Use AppRole from roles.ts as SSOT
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

// Cache for role data to prevent repeated queries
const roleCache = new Map<string, { roles: AppRole[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useUserRole(): UseUserRoleResult {
  const [allRoles, setAllRoles] = useState<AppRole[]>([]);
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
        const fetchedRoles: AppRole[] = rolesData?.map(r => r.role as AppRole) || ['user'];
        
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

  // Get the highest priority role using SSOT getPrimaryRole
  const primaryRole = getPrimaryRole(allRoles) || (allRoles.length > 0 ? allRoles[0] : null);
  
  // Check for specific role types using SSOT isAdminRole
  const hasAdminRole = allRoles.some(r => isAdminRole(r));
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

// Utility to clear the role cache (useful for logout)
export function clearRoleCache() {
  roleCache.clear();
}
