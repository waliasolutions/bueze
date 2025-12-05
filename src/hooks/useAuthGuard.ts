/**
 * Auth Guard Hook - Single Source of Truth for Protected Routes
 * Use this hook to protect pages that require authentication and specific roles
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { AppRole } from '@/types/entities';

interface AuthGuardOptions {
  /** Required role(s) to access the page */
  requiredRoles?: AppRole[];
  /** Redirect path when not authenticated */
  redirectTo?: string;
  /** Redirect path when role check fails */
  unauthorizedRedirect?: string;
  /** Allow any authenticated user (ignore role check) */
  allowAnyAuthenticated?: boolean;
}

interface AuthGuardResult {
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  isAuthorized: boolean;
  error: string | null;
  /** Refetch user and role */
  refetch: () => Promise<void>;
}

const DEFAULT_OPTIONS: AuthGuardOptions = {
  redirectTo: '/auth',
  unauthorizedRedirect: '/',
  allowAnyAuthenticated: false,
};

export const useAuthGuard = (options: AuthGuardOptions = {}): AuthGuardResult => {
  const navigate = useNavigate();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      
      if (!currentUser) {
        setUser(null);
        setRole(null);
        setIsAuthorized(false);
        navigate(opts.redirectTo!);
        return;
      }

      setUser(currentUser);

      // If any authenticated user is allowed, skip role check
      if (opts.allowAnyAuthenticated) {
        setIsAuthorized(true);
        setLoading(false);
        return;
      }

      // Fetch user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (roleError && roleError.code !== 'PGRST116') {
        console.error('Error fetching role:', roleError);
      }

      const userRole = (roleData?.role as AppRole) || 'user';
      setRole(userRole);

      // Check if user has required role
      if (opts.requiredRoles && opts.requiredRoles.length > 0) {
        const hasRequiredRole = opts.requiredRoles.includes(userRole);
        
        if (!hasRequiredRole) {
          setIsAuthorized(false);
          navigate(opts.unauthorizedRedirect!);
          return;
        }
      }

      setIsAuthorized(true);
    } catch (err) {
      console.error('Auth guard error:', err);
      setError(err instanceof Error ? err.message : 'Authentication error');
      setIsAuthorized(false);
      navigate(opts.redirectTo!);
    } finally {
      setLoading(false);
    }
  }, [navigate, opts.redirectTo, opts.unauthorizedRedirect, opts.requiredRoles, opts.allowAnyAuthenticated]);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      if (isMounted) {
        await checkAuth();
      }
    };

    initAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isMounted && (event === 'SIGNED_OUT' || !session)) {
          setUser(null);
          setRole(null);
          setIsAuthorized(false);
          navigate(opts.redirectTo!);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [checkAuth, navigate, opts.redirectTo]);

  return {
    user,
    role,
    loading,
    isAuthorized,
    error,
    refetch: checkAuth,
  };
};

/**
 * Hook for admin-only pages
 */
export const useAdminGuard = () => {
  return useAuthGuard({
    requiredRoles: ['admin', 'super_admin'],
    unauthorizedRedirect: '/',
  });
};

/**
 * Hook for handwerker-only pages
 */
export const useHandwerkerGuard = () => {
  return useAuthGuard({
    requiredRoles: ['handwerker'],
    unauthorizedRedirect: '/handwerker-onboarding',
  });
};

/**
 * Hook for client-only pages
 */
export const useClientGuard = () => {
  return useAuthGuard({
    requiredRoles: ['client', 'user'],
    unauthorizedRedirect: '/',
  });
};
