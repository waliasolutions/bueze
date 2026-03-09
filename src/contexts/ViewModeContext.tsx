import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

export type ViewMode = 'admin' | 'client' | 'handwerker';

interface ViewModeContextValue {
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
  isImpersonating: boolean;
}

const SESSION_KEY = 'bueze_admin_view_mode';

const ViewModeContext = createContext<ViewModeContextValue | undefined>(undefined);

/**
 * Derives the default ViewMode from the user's primary database role.
 */
function deriveDefaultView(isAdmin: boolean, isHandwerker: boolean): ViewMode {
  if (isAdmin) return 'admin';
  if (isHandwerker) return 'handwerker';
  return 'client';
}

export const ViewModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, isHandwerker, userId, loading } = useUserRole();
  const prevUserIdRef = useRef<string | null>(null);

  // Compute default from real role
  const defaultView = deriveDefaultView(isAdmin, isHandwerker);

  // Start with neutral default — sessionStorage is only applied AFTER role loading
  // confirms the user is admin (prevents stale 'handwerker' flash on login)
  const [activeView, setActiveViewState] = useState<ViewMode>('client');

  // When role loading finishes or userId changes, re-derive
  useEffect(() => {
    if (loading) return;

    // Emergency exit: userId changed (different user logged in)
    if (prevUserIdRef.current !== null && prevUserIdRef.current !== userId) {
      sessionStorage.removeItem(SESSION_KEY);
      setActiveViewState(defaultView);
    }
    prevUserIdRef.current = userId;

    // Non-admin users: always mirror real role, ignore sessionStorage
    if (!isAdmin) {
      sessionStorage.removeItem(SESSION_KEY);
      setActiveViewState(defaultView);
      return;
    }

    // Admin user: restore from sessionStorage or use default
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored && (stored === 'admin' || stored === 'client' || stored === 'handwerker')) {
      setActiveViewState(stored as ViewMode);
    } else {
      setActiveViewState('admin');
    }
  }, [loading, isAdmin, isHandwerker, userId]);

  // Emergency exit: clear on sign-out
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') {
        // Clear stale view on both sign-out and sign-in (handles user switches)
        sessionStorage.removeItem(SESSION_KEY);
        setActiveViewState('client'); // neutral default
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const setActiveView = useCallback((view: ViewMode) => {
    // Only admins can switch views
    if (!isAdmin) return;
    setActiveViewState(view);
    sessionStorage.setItem(SESSION_KEY, view);

    // Audit log: record view mode switch
    if (userId) {
      supabase
        .from('admin_audit_log')
        .insert({
          admin_user_id: userId,
          action: 'view_mode_switch',
          details: { from: activeView, to: view },
        })
        .then(({ error }) => {
          if (error) console.error('Audit log insert failed:', error);
        });
    }
  }, [isAdmin, userId, activeView]);

  const isImpersonating = isAdmin && activeView !== 'admin';

  return (
    <ViewModeContext.Provider value={{ activeView, setActiveView, isImpersonating }}>
      {children}
    </ViewModeContext.Provider>
  );
};

export function useViewMode(): ViewModeContextValue {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}
