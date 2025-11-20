import React from 'react';
import { useLocation } from 'react-router-dom';

export const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  React.useEffect(() => {
    // Scroll to top immediately on ANY location change (pathname or hash)
    // Must happen BEFORE any rendering or transition effects
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  React.useLayoutEffect(() => {
    // Trigger fade transition AFTER scroll
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  return (
    <div
      className={`transition-opacity duration-150 ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {children}
    </div>
  );
};

export const TopLoadingBar = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-primary/20">
      <div 
        className="h-full bg-primary animate-in slide-in-from-left-full duration-300"
        style={{
          animation: 'slideProgress 300ms ease-out forwards'
        }}
      />
      <style>{`
        @keyframes slideProgress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};
