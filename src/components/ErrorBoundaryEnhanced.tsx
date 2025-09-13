"use client";

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, FileText, Wifi, Server } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

// Error types for better error handling
export enum ErrorType {
  NETWORK = 'network',
  AUTH = 'auth',
  VALIDATION = 'validation',
  SERVER = 'server',
  CLIENT = 'client',
  UNKNOWN = 'unknown'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Enhanced error interface
export interface AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  code?: string;
  details?: any;
  timestamp: number;
}

// Create app error helper
export function createAppError(
  message: string,
  type: ErrorType = ErrorType.UNKNOWN,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  code?: string,
  details?: any
): AppError {
  const error = new Error(message) as AppError;
  error.type = type;
  error.severity = severity;
  error.code = code;
  error.details = details;
  error.timestamp = Date.now();
  return error;
}

// Error icon mapping
const getErrorIcon = (type: ErrorType) => {
  switch (type) {
    case ErrorType.NETWORK:
      return <Wifi className="h-5 w-5" />;
    case ErrorType.AUTH:
      return <AlertTriangle className="h-5 w-5" />;
    case ErrorType.VALIDATION:
      return <FileText className="h-5 w-5" />;
    case ErrorType.SERVER:
      return <Server className="h-5 w-5" />;
    case ErrorType.CLIENT:
      return <Bug className="h-5 w-5" />;
    default:
      return <AlertTriangle className="h-5 w-5" />;
  }
};

// Error color mapping
const getErrorColor = (severity: ErrorSeverity) => {
  switch (severity) {
    case ErrorSeverity.LOW:
      return 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
    case ErrorSeverity.MEDIUM:
      return 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
    case ErrorSeverity.HIGH:
      return 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-200';
    case ErrorSeverity.CRITICAL:
      return 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200';
    default:
      return 'border-gray-200 bg-gray-50 text-gray-800 dark:border-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
  }
};

// Enhanced Error Fallback Component
interface ErrorFallbackProps {
  error: AppError;
  resetError: () => void;
  showDetails?: boolean;
  className?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError, 
  showDetails = false,
  className = '' 
}) => {
  const [showErrorDetails, setShowErrorDetails] = React.useState(showDetails);

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${className}`}>
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className={`p-3 rounded-full ${getErrorColor(error.severity)}`}>
              {getErrorIcon(error.type)}
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold">
            Oops! Something went wrong
          </CardTitle>
          
          <CardDescription>
            {error.type === ErrorType.NETWORK && 'Network connection issue. Please check your internet connection.'}
            {error.type === ErrorType.AUTH && 'Authentication error. Please log in again.'}
            {error.type === ErrorType.VALIDATION && 'Invalid data provided. Please check your input.'}
            {error.type === ErrorType.SERVER && 'Server error. Please try again later.'}
            {error.type === ErrorType.CLIENT && 'Application error. Please refresh the page.'}
            {error.type === ErrorType.UNKNOWN && 'An unexpected error occurred. Our team has been notified.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription className="font-medium">
              {error.message}
            </AlertDescription>
          </Alert>
          
          {error.code && (
            <div className="text-sm text-muted-foreground">
              Error Code: {error.code}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={resetError} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <Button variant="outline" asChild className="flex-1">
              <a href="/">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </a>
            </Button>
          </div>
          
          {(process.env.NODE_ENV === 'development' || showErrorDetails) && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowErrorDetails(!showErrorDetails)}
                className="w-full"
              >
                {showErrorDetails ? 'Hide' : 'Show'} Technical Details
              </Button>
              
              {showErrorDetails && (
                <div className="bg-muted p-3 rounded-lg">
                  <details className="text-sm">
                    <summary className="cursor-pointer font-mono mb-2">Stack Trace</summary>
                    <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-40">
                      {error.stack}
                    </pre>
                  </details>
                  
                  {error.details && (
                    <details className="text-sm mt-2">
                      <summary className="cursor-pointer font-mono mb-2">Error Details</summary>
                      <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-40">
                        {JSON.stringify(error.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Enhanced Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: AppError; resetError: () => void }>;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  allowedErrors?: ErrorType[];
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Convert regular Error to AppError
    const appError = error as AppError || createAppError(
      error.message,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM
    );
    
    return {
      hasError: true,
      error: appError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Convert to AppError if not already
    const appError = error as AppError || createAppError(
      error.message,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      undefined,
      { componentStack: errorInfo.componentStack }
    );
    
    // Check if this error type is allowed
    const { allowedErrors } = this.props;
    if (allowedErrors && !allowedErrors.includes(appError.type)) {
      // Don't show error boundary for allowed error types
      this.setState({ hasError: false, error: null });
      return;
    }
    
    console.error('ErrorBoundary caught an error:', appError, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }
    
    // Update state with the enhanced error
    this.setState({
      hasError: true,
      error: appError
    });
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      const FallbackComponent = fallback || ErrorFallback;
      return <FallbackComponent error={error} resetError={this.resetError} />;
    }

    return children;
  }
}

// Specific error boundaries for different use cases

// Page-level error boundary
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary 
      allowedErrors={[ErrorType.VALIDATION, ErrorType.NETWORK]}
      fallback={({ error, resetError }) => (
        <div className="container mx-auto p-4">
          <ErrorFallback 
            error={error} 
            resetError={resetError} 
            className="min-h-[50vh]"
          />
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// Component-level error boundary (smaller, inline)
interface ComponentErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

export function ComponentErrorBoundary({ 
  children, 
  fallback, 
  className = '' 
}: ComponentErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className={`p-4 ${className}`}>
          {fallback || (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Component Error</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{error.message}</span>
                <Button size="sm" variant="outline" onClick={resetError}>
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// Async operation error boundary
export function AsyncErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      allowedErrors={[ErrorType.NETWORK, ErrorType.SERVER]}
      fallback={({ error, resetError }) => (
        <div className="p-4">
          <Alert>
            <Wifi className="h-4 w-4" />
            <AlertTitle>Loading Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Failed to load data. Please check your connection.</span>
              <Button size="sm" onClick={resetError}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// Higher-order component for error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Error hook for functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<AppError | null>(null);

  const handleError = React.useCallback((error: Error | AppError) => {
    const appError = error as AppError || createAppError(
      error.message,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM
    );
    setError(appError);
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, resetError };
}

// Global error handler for unhandled errors
export function setupGlobalErrorHandling() {
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      // You could send this to an error tracking service
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      // You could send this to an error tracking service
    });
  }
}