"use client";

import React from 'react';
import { Button } from './ui/patterns';
import { cn } from '@/lib/utils';

// Consistent Action Button Pattern
interface ActionButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'touch';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  className?: string;
  href?: string;
  target?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  className = '',
  href,
  target,
}) => {
  const buttonContent = (
    <>
      {loading && (
        <div className="animate-spin rounded-full border-2 border-solid border-current border-r-transparent h-4 w-4 mr-2" />
      )}
      {icon && iconPosition === 'left' && !loading && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && !loading && (
        <span className="ml-2">{icon}</span>
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={target}
        className={cn(
          'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-modern focus-ring disabled:pointer-events-none disabled:opacity-50',
          fullWidth && 'w-full',
          variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90',
          variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
          variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
          variant === 'outline' && 'border border-border bg-background hover:bg-accent hover:text-accent-foreground',
          variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
          size === 'sm' && 'h-9 px-3 rounded-lg text-sm',
          size === 'md' && 'h-10 px-4 py-2',
          size === 'lg' && 'h-11 px-8 rounded-lg text-base',
          size === 'touch' && 'h-12 px-6 py-3 text-base',
          className
        )}
        onClick={onClick}
      >
        {buttonContent}
      </a>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      loading={loading}
      disabled={disabled}
      icon={icon}
      iconPosition={iconPosition}
      className={className}
      onClick={onClick}
    >
      {children}
    </Button>
  );
};

// Consistent Status Badge Pattern
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'success' | 'error' | 'warning';
  text?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  icon,
  className = '',
}) => {
  const statusConfig = {
    active: {
      variant: 'success' as const,
      defaultText: 'Active',
      icon: icon || (
        <div className="w-2 h-2 bg-green-500 rounded-full" />
      ),
    },
    inactive: {
      variant: 'secondary' as const,
      defaultText: 'Inactive',
      icon: icon || (
        <div className="w-2 h-2 bg-gray-400 rounded-full" />
      ),
    },
    pending: {
      variant: 'warning' as const,
      defaultText: 'Pending',
      icon: icon || (
        <div className="w-2 h-2 bg-yellow-500 rounded-full" />
      ),
    },
    success: {
      variant: 'success' as const,
      defaultText: 'Success',
      icon: icon || (
        <div className="w-2 h-2 bg-green-500 rounded-full" />
      ),
    },
    error: {
      variant: 'destructive' as const,
      defaultText: 'Error',
      icon: icon || (
        <div className="w-2 h-2 bg-red-500 rounded-full" />
      ),
    },
    warning: {
      variant: 'warning' as const,
      defaultText: 'Warning',
      icon: icon || (
        <div className="w-2 h-2 bg-yellow-500 rounded-full" />
      ),
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium',
        config.variant === 'success' && 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
        config.variant === 'secondary' && 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200',
        config.variant === 'warning' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
        config.variant === 'destructive' && 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200',
        className
      )}
    >
      {config.icon}
      <span>{text || config.defaultText}</span>
    </div>
  );
};

// Consistent Info Card Pattern
interface InfoCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  className = '',
}) => {
  return (
    <div className={cn('modern-card p-6 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-primary/10 rounded-lg">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="flex items-center gap-2 text-xs">
          <span className={cn(
            'font-medium',
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
          <span className="text-muted-foreground">
            from last period
          </span>
        </div>
      )}
    </div>
  );
};

// Consistent Empty State Pattern
interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actions,
  className = '',
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {icon && (
        <div className="mb-4 p-4 bg-muted rounded-full">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-muted-foreground mb-6 max-w-md">
          {description}
        </p>
      )}
      {actions && (
        <div className="flex flex-col sm:flex-row gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};

// Consistent Page Header Pattern
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  breadcrumbs,
  className = '',
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {breadcrumbs && (
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <span className="text-muted-foreground">/</span>
              )}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-foreground">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-col sm:flex-row gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

// Consistent Section Header Pattern
interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  actions,
  className = '',
}) => {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6', className)}>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-col sm:flex-row gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};

// Consistent Loading Overlay Pattern
interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  text = 'Loading...',
  className = '',
}) => {
  if (!isLoading) return null;

  return (
    <div className={cn('fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50', className)}>
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full border-2 border-solid border-primary border-r-transparent h-8 w-8" />
        <p className="text-muted-foreground text-sm">{text}</p>
      </div>
    </div>
  );
};

// Consistent Progress Indicator Pattern
interface ProgressIndicatorProps {
  steps: Array<{ label: string; completed?: boolean; current?: boolean }>;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  className = '',
}) => {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                step.completed && 'bg-green-500 text-white',
                step.current && 'bg-primary text-primary-foreground',
                !step.completed && !step.current && 'bg-muted text-muted-foreground'
              )}
            >
              {step.completed ? '✓' : index + 1}
            </div>
            <span className="text-xs text-muted-foreground mt-2 text-center">
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={cn(
              'flex-1 h-0.5 mx-2',
              step.completed ? 'bg-green-500' : 'bg-muted'
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// Export all components
export {
  ActionButton,
  StatusBadge,
  InfoCard,
  EmptyState,
  PageHeader,
  SectionHeader,
  LoadingOverlay,
  ProgressIndicator,
};