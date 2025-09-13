import React from 'react';
import { Skeleton } from './skeleton';
import LoadingSpinner from './LoadingSpinner';

// Content Card Skeleton
interface ContentCardSkeletonProps {
  className?: string;
  showImage?: boolean;
  lines?: number;
}

const ContentCardSkeleton: React.FC<ContentCardSkeletonProps> = ({ 
  className = '', 
  showImage = true,
  lines = 3 
}) => {
  return (
    <div className={`modern-card p-6 space-y-4 ${className}`}>
      {showImage && (
        <Skeleton className="h-48 w-full rounded-lg" />
      )}
      <div className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, index) => (
            <Skeleton 
              key={index} 
              className={`h-4 ${index === lines - 1 ? 'w-1/2' : 'w-full'}`} 
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
};

// Site Card Skeleton
interface SiteCardSkeletonProps {
  className?: string;
}

const SiteCardSkeleton: React.FC<SiteCardSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`modern-card p-6 space-y-4 ${className}`}>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center space-y-1">
          <Skeleton className="h-6 w-8 mx-auto" />
          <Skeleton className="h-3 w-12 mx-auto" />
        </div>
        <div className="text-center space-y-1">
          <Skeleton className="h-6 w-8 mx-auto" />
          <Skeleton className="h-3 w-12 mx-auto" />
        </div>
        <div className="text-center space-y-1">
          <Skeleton className="h-6 w-8 mx-auto" />
          <Skeleton className="h-3 w-12 mx-auto" />
        </div>
      </div>
      <div className="flex space-x-2">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
    </div>
  );
};

// List Item Skeleton
interface ListItemSkeletonProps {
  className?: string;
  showAvatar?: boolean;
  lines?: number;
}

const ListItemSkeleton: React.FC<ListItemSkeletonProps> = ({ 
  className = '', 
  showAvatar = true,
  lines = 2 
}) => {
  return (
    <div className={`flex items-center space-x-4 p-4 modern-card ${className}`}>
      {showAvatar && (
        <Skeleton className="h-10 w-10 rounded-full" />
      )}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        {Array.from({ length: lines - 1 }).map((_, index) => (
          <Skeleton key={index} className="h-3 w-1/2" />
        ))}
      </div>
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
};

// Table Skeleton
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ 
  rows = 5, 
  columns = 4,
  className = '' 
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex space-x-4 p-4 border-b">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} className="h-6 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex space-x-4 p-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={`cell-${rowIndex}-${colIndex}`} 
                className="h-4 flex-1" 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Form Skeleton
interface FormSkeletonProps {
  fields?: number;
  className?: string;
}

const FormSkeleton: React.FC<FormSkeletonProps> = ({ 
  fields = 4,
  className = '' 
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
          {index === fields - 1 && (
            <Skeleton className="h-3 w-48" />
          )}
        </div>
      ))}
      <div className="flex space-x-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
};

// Dashboard Stats Skeleton
interface DashboardStatsSkeletonProps {
  className?: string;
}

const DashboardStatsSkeleton: React.FC<DashboardStatsSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="modern-card p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-12" />
            </div>
            <Skeleton className="h-12 w-12 rounded-lg" />
          </div>
          <div className="mt-4">
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Content Grid Skeleton
interface ContentGridSkeletonProps {
  items?: number;
  className?: string;
}

const ContentGridSkeleton: React.FC<ContentGridSkeletonProps> = ({ 
  items = 6,
  className = '' 
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <ContentCardSkeleton key={index} lines={2} />
      ))}
    </div>
  );
};

// Page Loading Overlay
interface PageLoadingOverlayProps {
  message?: string;
  className?: string;
}

const PageLoadingOverlay: React.FC<PageLoadingOverlayProps> = ({ 
  message = 'Loading...', 
  className = '' 
}) => {
  return (
    <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        <LoadingSpinner size="lg" className="text-primary" />
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
};

// Inline Loading Spinner
interface InlineLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const InlineLoading: React.FC<InlineLoadingProps> = ({ 
  message = 'Loading...', 
  size = 'sm',
  className = '' 
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <LoadingSpinner size={size} />
      <span className="text-muted-foreground text-sm">{message}</span>
    </div>
  );
};

// Button Loading State
interface ButtonLoadingProps {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

const ButtonLoading: React.FC<ButtonLoadingProps> = ({ 
  loading = false, 
  children, 
  className = '' 
}) => {
  return (
    <button 
      className={`modern-button-primary relative ${className}`}
      disabled={loading}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" className="text-white" />
        </div>
      )}
      <span className={loading ? 'invisible' : ''}>{children}</span>
    </button>
  );
};

// Export all components
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

// Re-export for convenience
export { LoadingSpinner, Skeleton };
export default LoadingSpinner;