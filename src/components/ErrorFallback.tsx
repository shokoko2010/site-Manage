import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface ErrorFallbackProps {
  error: Error;
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
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold">
            Oops! Something went wrong
          </CardTitle>
          
          <CardDescription>
            We're sorry, but an unexpected error occurred. Our team has been notified.
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
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};