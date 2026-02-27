import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import PageLoader from '@/components/PageLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Route-level auth guard that prevents unauthenticated access.
 * Redirects to /auth if no session exists.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setIsAuthenticated(!!session);
        setIsChecking(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setIsAuthenticated(!!session);
        setIsChecking(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isChecking) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location.pathname + location.search }} replace />;
  }

  return <>{children}</>;
}
