import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const MobileStickyFooter = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only show on homepage
    if (location.pathname !== '/') {
      setIsVisible(false);
      return;
    }

    const handleScroll = () => {
      // Show after scrolling 500px
      setIsVisible(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial scroll position

    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  // Don't render anything if not on homepage
  if (location.pathname !== '/') return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="bg-white/95 backdrop-blur-sm border-t border-line-200 shadow-lg px-4 py-3">
        <Button
          onClick={() => navigate('/submit-lead')}
          className="w-full gap-2 shadow-md"
          size="lg"
        >
          <Plus className="h-5 w-5" />
          Auftrag erstellen
        </Button>
      </div>
    </div>
  );
};