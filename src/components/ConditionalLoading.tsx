import React from 'react';
import LoadingSpinner from './ui/LoadingSpinner';

interface ConditionalLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

const ConditionalLoading: React.FC<ConditionalLoadingProps> = ({ 
  isLoading, 
  children, 
  fallback,
  className = '' 
}) => {
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        {fallback || <LoadingSpinner />}
      </div>
    );
  }

  return <>{children}</>;
};

export default ConditionalLoading;