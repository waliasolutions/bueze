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

    const fetchRoles = async (userId: string) => {
      try {
        // Check cache first
        const cached = roleCache.get(userId);
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
          .eq('user_id', userId);

        if (error) {
          console.error('Error fetching user roles:', error);
        }

        // Extract roles array
        const fetchedRoles: AppRole[] = rolesData?.map(r => r.role as AppRole) || ['user'];
        
        // Log warning if no roles found - defensive coding
        if (!rolesData || rolesData.length === 0) {
          console.warn('[useUserRole] No roles found for user:', userId, '- defaulting to user role');
        }
        
        // Update cache
        roleCache.set(userId, { roles: fetchedRoles, timestamp: Date.now() });

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

    // Initialize: Check for existing session first
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        if (isMounted) {
          setUserId(session.user.id);
        }
        await fetchRoles(session.user.id);
      } else {
        if (isMounted) {
          setAllRoles([]);
          setUserId(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes - NO async callback to prevent deadlock
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Synchronous state updates only
        setAllRoles([]);
        setUserId(null);
        roleCache.clear();
        setLoading(false);
      } else if (session?.user && isMounted) {
        // Synchronous state update
        setUserId(session.user.id);
        // Defer async role fetching with setTimeout to avoid deadlock
        setTimeout(() => {
          if (isMounted) {
            roleCache.delete(session.user.id);
            fetchRoles(session.user.id);
          }
        }, 0);
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
