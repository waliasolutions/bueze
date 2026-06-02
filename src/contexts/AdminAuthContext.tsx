/**
 * Admin Auth Context - Single Source of Truth for Admin Authentication
 * Consumes useUserRole so admin checks share the deduped role cache and
 * never issue a parallel /user_roles request on login.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole, clearRoleCache } from '@/hooks/useUserRole';
import type { User } from '@supabase/supabase-js';
import type { AppRole } from '@/types/entities';

interface AdminAuthState {
  user: User | null;
  role: AppRole | null;
  isAuthorized: boolean;
  isChecking: boolean;
  hasChecked: boolean;
  error: string | null;
}

interface AdminAuthContextValue extends AdminAuthState {
  refetch: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const isMounted = useRef(true);

  const { role, isAdmin, isSuperAdmin, loading: roleLoading, userId } = useUserRole();

  const [state, setState] = useState<AdminAuthState>({
    user: null,
    role: null,
    isAuthorized: false,
    isChecking: true,
    hasChecked: false,
    error: null,
  });

  const syncUser = useCallback(async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!isMounted.current) return;
    if (error || !user) {
      setState({
        user: null,
        role: null,
        isAuthorized: false,
        isChecking: false,
        hasChecked: true,
        error: error?.message || 'Not authenticated',
      });
      navigate('/auth');
    } else {
      setState((s) => ({ ...s, user, isChecking: roleLoading, hasChecked: !roleLoading }));
    }
  }, [navigate, roleLoading]);

  useEffect(() => {
    isMounted.current = true;
    syncUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        clearRoleCache();
        if (isMounted.current) {
          setState({
            user: null,
            role: null,
            isAuthorized: false,
            isChecking: false,
            hasChecked: true,
            error: null,
          });
          navigate('/auth');
        }
      }
    });
    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, [syncUser, navigate]);

  // React to role resolution
  useEffect(() => {
    if (!isMounted.current) return;
    if (roleLoading) {
      setState((s) => ({ ...s, isChecking: true }));
      return;
    }
    if (!userId) return; // syncUser will handle the unauth path
    const authorized = isAdmin || isSuperAdmin;
    setState((s) => ({
      ...s,
      role: (role as AppRole) ?? null,
      isAuthorized: authorized,
      isChecking: false,
      hasChecked: true,
      error: authorized ? null : 'Unauthorized',
    }));
    if (!authorized) navigate('/');
  }, [roleLoading, userId, role, isAdmin, isSuperAdmin, navigate]);

  const value: AdminAuthContextValue = { ...state, refetch: syncUser };

  if (state.isChecking || !state.hasChecked) {
    return <AdminAuthContext.Provider value={value}>{null}</AdminAuthContext.Provider>;
  }
  if (!state.isAuthorized) return null;

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}

export function clearAdminAuthCache() {
  clearRoleCache();
}
