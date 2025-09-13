import React from 'react';
import LoadingSpinner from './ui/LoadingSpinner';

interface PageLoadingProps {
  message?: string;
  className?: string;
}

const PageLoading: React.FC<PageLoadingProps> = ({ 
  message = 'Loading your content...', 
  className = '' 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-background ${className}`}>
      <div className="text-center space-y-6">
        <div className="relative">
          <LoadingSpinner size="lg" className="text-primary" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">Zex-Content</h2>
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default PageLoading;