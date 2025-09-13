"use client";

import React from 'react';
import { ErrorBoundary, ErrorFallback, PageErrorBoundary, ComponentErrorBoundary, AsyncErrorBoundary } from './ErrorBoundaryEnhanced';

// Simple error boundary wrapper for pages
interface PageErrorWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function PageErrorWrapper({ children, className = '' }: PageErrorWrapperProps) {
  return (
    <PageErrorBoundary>
      <div className={className}>
        {children}
      </div>
    </PageErrorBoundary>
  );
}

// Simple error boundary wrapper for components
interface ComponentErrorWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export function ComponentErrorWrapper({ 
  children, 
  fallback, 
  className = '' 
}: ComponentErrorWrapperProps) {
  return (
    <ComponentErrorBoundary fallback={fallback} className={className}>
      {children}
    </ComponentErrorBoundary>
  );
}

// Simple error boundary wrapper for async operations
interface AsyncErrorWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function AsyncErrorWrapper({ children, className = '' }: AsyncErrorWrapperProps) {
  return (
    <AsyncErrorBoundary>
      <div className={className}>
        {children}
      </div>
    </AsyncErrorBoundary>
  );
}

// Error boundary with custom loading state
interface ErrorBoundaryWithLoadingProps {
  children: React.ReactNode;
  loading?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
}

export function ErrorBoundaryWithLoading({ 
  children, 
  loading, 
  error,
  className = '' 
}: ErrorBoundaryWithLoadingProps) {
  return (
    <ErrorBoundary
      fallback={({ resetError }) => (
        <div className={className}>
          {error || <ErrorFallback error={resetError as any} resetError={resetError} />}
        </div>
      )}
    >
      <div className={className}>
        {children}
      </div>
    </ErrorBoundary>
  );
}

// Export all components for convenience
export {
  ErrorBoundary,
  ErrorFallback,
  PageErrorBoundary,
  ComponentErrorBoundary,
  AsyncErrorBoundary
};