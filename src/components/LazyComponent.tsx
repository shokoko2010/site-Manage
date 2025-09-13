import React, { Suspense } from 'react';
import LoadingSpinner from './ui/LoadingSpinner';

interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

const LazyComponent: React.FC<LazyComponentProps> = ({ 
  children, 
  fallback, 
  className = '' 
}) => {
  const defaultFallback = (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <LoadingSpinner size="lg" />
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

export default LazyComponent;