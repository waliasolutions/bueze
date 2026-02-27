/**
 * Admin Auth Context - Single Source of Truth for Admin Authentication
 * Prevents re-checking auth on every admin page navigation
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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

// Session-level cache for admin auth
const adminAuthCache = {
  userId: null as string | null,
  isAdmin: false,
  checkedAt: 0,
  TTL: 30 * 1000, // 30 seconds — keep short to catch role revocations quickly
};

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const isMounted = useRef(true);
  
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    role: null,
    isAuthorized: false,
    isChecking: true,
    hasChecked: false,
    error: null,
  });

  const checkAdminAuth = useCallback(async () => {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        if (isMounted.current) {
          setState({
            user: null,
            role: null,
            isAuthorized: false,
            isChecking: false,
            hasChecked: true,
            error: authError?.message || 'Not authenticated',
          });
          navigate('/auth');
        }
        return;
      }

      // Check cache first
      const now = Date.now();
      if (
        adminAuthCache.userId === user.id &&
        adminAuthCache.isAdmin &&
        now - adminAuthCache.checkedAt < adminAuthCache.TTL
      ) {
        if (isMounted.current) {
          setState({
            user,
            role: 'admin',
            isAuthorized: true,
            isChecking: false,
            hasChecked: true,
            error: null,
          });
        }
        return;
      }

      // Check admin role in database
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'super_admin'])
        .maybeSingle();

      if (roleError) {
        throw roleError;
      }

      const isAdmin = !!roleData;
      
      // Update cache
      adminAuthCache.userId = user.id;
      adminAuthCache.isAdmin = isAdmin;
      adminAuthCache.checkedAt = now;

      if (!isAdmin) {
        if (isMounted.current) {
          setState({
            user,
            role: null,
            isAuthorized: false,
            isChecking: false,
            hasChecked: true,
            error: 'Unauthorized',
          });
          navigate('/');
        }
        return;
      }

      if (isMounted.current) {
        setState({
          user,
          role: roleData.role as AppRole,
          isAuthorized: true,
          isChecking: false,
          hasChecked: true,
          error: null,
        });
      }
    } catch (err) {
      console.error('Admin auth check error:', err);
      if (isMounted.current) {
        setState({
          user: null,
          role: null,
          isAuthorized: false,
          isChecking: false,
          hasChecked: true,
          error: err instanceof Error ? err.message : 'Auth error',
        });
        navigate('/auth');
      }
    }
  }, [navigate]);

  useEffect(() => {
    isMounted.current = true;
    
    // Only check if we haven't checked yet
    if (!state.hasChecked) {
      checkAdminAuth();
    }

    // Listen for sign out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        // Clear cache
        adminAuthCache.userId = null;
        adminAuthCache.isAdmin = false;
        adminAuthCache.checkedAt = 0;
        
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
  }, [checkAdminAuth, state.hasChecked, navigate]);

  const value: AdminAuthContextValue = {
    ...state,
    refetch: checkAdminAuth,
  };

  // Don't render children until auth check completes — prevents flash of admin content
  if (state.isChecking || !state.hasChecked) {
    return (
      <AdminAuthContext.Provider value={value}>
        {null}
      </AdminAuthContext.Provider>
    );
  }

  if (!state.isAuthorized) {
    return null;
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}

// Clear cache on logout (call this from logout handlers)
export function clearAdminAuthCache() {
  adminAuthCache.userId = null;
  adminAuthCache.isAdmin = false;
  adminAuthCache.checkedAt = 0;
}
