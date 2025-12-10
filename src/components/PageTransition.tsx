import React from 'react';
import { useLocation } from 'react-router-dom';

// Simplified PageTransition - no opacity flicker, just renders children
export const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const TopLoadingBar = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-primary/20">
      <div 
        className="h-full bg-primary"
        style={{
          animation: 'slideProgress 200ms ease-out forwards'
        }}
      />
      <style>{`
        @keyframes slideProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};
