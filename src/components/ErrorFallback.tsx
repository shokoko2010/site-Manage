import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-3">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Oops! Something went wrong
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            We're sorry, but an unexpected error occurred. Our team has been notified.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-mono text-red-600 dark:text-red-400">
                {error.message}
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={resetError}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </button>
            
            <a
              href="/"
              className="flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};