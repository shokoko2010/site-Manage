import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingCardProps {
  lines?: number;
  className?: string;
}

const LoadingCard: React.FC<LoadingCardProps> = ({ lines = 3, className = '' }) => {
  return (
    <div className={`modern-card p-6 space-y-4 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="modern-skeleton h-4 w-3/4"></div>
          {index === 0 && <div className="modern-skeleton h-3 w-1/2"></div>}
        </div>
      ))}
    </div>
  );
};

interface LoadingGridProps {
  items?: number;
  className?: string;
}

const LoadingGrid: React.FC<LoadingGridProps> = ({ items = 6, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <LoadingCard key={index} lines={2} />
      ))}
    </div>
  );
};

interface LoadingListProps {
  items?: number;
  className?: string;
}

const LoadingList: React.FC<LoadingListProps> = ({ items = 5, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-3 modern-card">
          <div className="modern-skeleton w-10 h-10 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="modern-skeleton h-4 w-3/4"></div>
            <div className="modern-skeleton h-3 w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

interface LoadingPageProps {
  message?: string;
  className?: string;
}

const LoadingPage: React.FC<LoadingPageProps> = ({ 
  message = 'Loading...', 
  className = '' 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-8 ${className}`}>
      <LoadingSpinner size="lg" className="mb-4" />
      <p className="text-muted-foreground text-lg">{message}</p>
    </div>
  );
};

export { LoadingCard, LoadingGrid, LoadingList, LoadingPage };
export default LoadingSpinner;