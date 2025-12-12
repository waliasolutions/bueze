import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'super_admin' | 'handwerker' | 'client' | 'user' | null;

interface UseUserRoleResult {
  role: UserRole;
  isAdmin: boolean;
  isHandwerker: boolean;
  isClient: boolean;
  loading: boolean;
  userId: string | null;
}

// Cache for role data to prevent repeated queries
const roleCache = new Map<string, { role: UserRole; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useUserRole(): UseUserRoleResult {
  const [role, setRole] = useState<UserRole>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          if (isMounted) {
            setRole(null);
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
            setRole(cached.role);
            setLoading(false);
          }
          return;
        }

        // Fetch role from database
        const { data: roleData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
        }

        const fetchedRole = (roleData?.role as UserRole) || 'user';
        
        // Update cache
        roleCache.set(user.id, { role: fetchedRole, timestamp: Date.now() });

        if (isMounted) {
          setRole(fetchedRole);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in useUserRole:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRole();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setRole(null);
        setUserId(null);
        roleCache.clear();
      } else if (session?.user && isMounted) {
        // Clear cache for this user and refetch
        roleCache.delete(session.user.id);
        fetchRole();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    role,
    isAdmin: role === 'admin' || role === 'super_admin',
    isHandwerker: role === 'handwerker',
    isClient: role === 'client' || role === 'user',
    loading,
    userId,
  };
}

// Utility to clear the role cache (useful for logout)
export function clearRoleCache() {
  roleCache.clear();
}
