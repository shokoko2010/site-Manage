"use client";

import React from 'react';
import { responsive } from '@/lib/responsive-system';

// Responsive Container Component
interface ResponsiveContainerProps {
  children: React.ReactNode;
  size?: 'default' | 'narrow' | 'wide' | 'full';
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  size = 'default',
  className = '',
}) => {
  return (
    <div className={`${responsive.container[size]} ${className}`}>
      {children}
    </div>
  );
};

// Responsive Grid Component
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 12;
  gap?: 2 | 4 | 6;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = 1,
  gap = 4,
  className = '',
}) => {
  const gridClass = `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cols}`;
  const gapClass = `gap-${gap} sm:gap-${gap + 2} lg:gap-${gap + 4}`;
  
  return (
    <div className={`${gridClass} ${gapClass} ${className}`}>
      {children}
    </div>
  );
};

// Responsive Card Component
interface ResponsiveCardProps {
  children: React.ReactNode;
  variant?: 'base' | 'compact' | 'spacious';
  className?: string;
  hover?: boolean;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  variant = 'base',
  className = '',
  hover = true,
}) => {
  const baseClasses = responsive.card.base;
  const variantClasses = responsive.card[variant];
  const hoverClass = hover ? 'hover:shadow-lg hover:scale-[1.02]' : '';
  
  return (
    <div className={`${baseClasses} ${variantClasses} ${hoverClass} ${className}`}>
      {children}
    </div>
  );
};

// Responsive Form Component
interface ResponsiveFormProps {
  children: React.ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
}

export const ResponsiveForm: React.FC<ResponsiveFormProps> = ({
  children,
  className = '',
  onSubmit,
}) => {
  return (
    <form 
      className={`${responsive.form.container} ${responsive.form.group} ${className}`}
      onSubmit={onSubmit}
    >
      {children}
    </form>
  );
};

// Responsive Form Group Component
interface ResponsiveFormGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveFormGroup: React.FC<ResponsiveFormGroupProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {children}
    </div>
  );
};

// Responsive Input Component
interface ResponsiveInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string;
  error?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ResponsiveInput: React.FC<ResponsiveInputProps> = ({
  label,
  error,
  className = '',
  size = 'md',
  ...props
}) => {
  const sizeClasses = {
    sm: responsive.form.inputSm,
    md: responsive.form.input,
    lg: responsive.form.inputLg,
  };
  
  const errorClasses = error ? responsive.form.inputError : sizeClasses[size];
  
  return (
    <div className="space-y-1">
      {label && (
        <label className={responsive.form.label}>
          {label}
        </label>
      )}
      <input
        className={`${errorClasses} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

// Responsive Button Component
interface ResponsiveButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  icon,
  iconPosition = 'left',
  disabled,
  ...props
}) => {
  const baseClasses = responsive.form.button;
  const sizeClasses = {
    sm: responsive.form.buttonSm,
    md: responsive.form.button,
    lg: responsive.form.buttonLg,
  };
  
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-border bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  };
  
  const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
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
    </button>
  );
};

// Responsive Navigation Component
interface ResponsiveNavProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveNav: React.FC<ResponsiveNavProps> = ({
  children,
  className = '',
}) => {
  return (
    <nav className={`${responsive.nav.container} ${className}`}>
      {children}
    </nav>
  );
};

// Responsive Modal Component
interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  className = '',
}) => {
  if (!isOpen) return null;
  
  return (
    <div className={responsive.modal.container}>
      <div 
        className={responsive.modal.overlay}
        onClick={onClose}
      />
      <div className={`${responsive.modal.content} ${className}`}>
        <div className={responsive.modal.header}>
          {title && (
            <h2 className="text-lg font-semibold">{title}</h2>
          )}
          <button
            className={responsive.modal.closeButton}
            onClick={onClose}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className={responsive.modal.body}>
          {children}
        </div>
      </div>
    </div>
  );
};

// Responsive Table Component
interface ResponsiveTableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  headers,
  children,
  className = '',
  compact = false,
}) => {
  const cellClass = compact ? responsive.table.compactCell : responsive.table.cell;
  const headerCellClass = compact ? responsive.table.compactHeaderCell : responsive.table.headerCell;
  
  return (
    <div className={`${responsive.table.container} ${className}`}>
      <table className={responsive.table.table}>
        <thead className={responsive.table.header}>
          <tr>
            {headers.map((header, index) => (
              <th key={index} className={headerCellClass}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );
};

// Responsive Text Component
interface ResponsiveTextProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body-xs' | 'body-sm' | 'body-base' | 'body-lg' | 'body-xl';
  className?: string;
  as?: React.ElementType;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  variant = 'body-base',
  className = '',
  as: Component = 'p',
}) => {
  return (
    <Component className={`${responsive.typography[variant]} ${className}`}>
      {children}
    </Component>
  );
};

// Responsive Spacer Component
interface ResponsiveSpacerProps {
  size?: 1 | 2 | 3 | 4;
  direction?: 'vertical' | 'horizontal';
  className?: string;
}

export const ResponsiveSpacer: React.FC<ResponsiveSpacerProps> = ({
  size = 2,
  direction = 'vertical',
  className = '',
}) => {
  const spacingClass = direction === 'vertical' 
    ? responsive.spacing[`m${size}`] 
    : responsive.spacing[`gap${size}`];
  
  return <div className={`${spacingClass} ${className}`} />;
};

// Responsive Layout Component
interface ResponsiveLayoutProps {
  children: React.ReactNode;
  direction?: 'row' | 'row-reverse' | 'col' | 'col-reverse';
  gap?: 2 | 3 | 4;
  className?: string;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  direction = 'row',
  gap = 4,
  className = '',
}) => {
  const directionClasses = {
    row: responsive.grid.flexRow,
    'row-reverse': responsive.grid.flexRowReverse,
    col: responsive.grid.flexCol,
    'col-reverse': responsive.grid.flexColReverse,
  };
  
  const gapClass = responsive.spacing[`gap${gap}`];
  
  return (
    <div className={`${directionClasses[direction]} ${gapClass} ${className}`}>
      {children}
    </div>
  );
};