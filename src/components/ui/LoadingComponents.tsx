import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import {
  ContentCardSkeleton,
  SiteCardSkeleton,
  ListItemSkeleton,
  TableSkeleton,
  FormSkeleton,
  DashboardStatsSkeleton,
  ContentGridSkeleton,
  PageLoadingOverlay,
  InlineLoading,
  ButtonLoading
} from './loading-skeletons';

// Re-export all components for backward compatibility
export {
  ContentCardSkeleton,
  SiteCardSkeleton,
  ListItemSkeleton,
  TableSkeleton,
  FormSkeleton,
  DashboardStatsSkeleton,
  ContentGridSkeleton,
  PageLoadingOverlay,
  InlineLoading,
  ButtonLoading
};

// Legacy components for backward compatibility
interface LoadingCardProps {
  lines?: number;
  className?: string;
}

const LoadingCard: React.FC<LoadingCardProps> = ({ lines = 3, className = '' }) => {
  return <ContentCardSkeleton className={className} lines={lines} showImage={false} />;
};

interface LoadingGridProps {
  items?: number;
  className?: string;
}

const LoadingGrid: React.FC<LoadingGridProps> = ({ items = 6, className = '' }) => {
  return <ContentGridSkeleton className={className} items={items} />;
};

interface LoadingListProps {
  items?: number;
  className?: string;
}

const LoadingList: React.FC<LoadingListProps> = ({ items = 5, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <ListItemSkeleton key={index} lines={2} />
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