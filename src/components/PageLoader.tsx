import React from 'react';
import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
}

const PageLoader: React.FC<PageLoaderProps> = ({ message = 'Laden...' }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
};

export default PageLoader;
