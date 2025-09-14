"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Spinner } from '@/components/common/Spinner';

type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
type UserPlan = 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPlan?: UserPlan;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPlan,
  redirectTo = '/login'
}) => {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated via API call
        const response = await fetch('/api/auth/me');
        
        if (response.ok) {
          const userData = await response.json();
          useAuthStore.getState().login(userData.user);
        } else {
          // If not authenticated, redirect to login
          router.push(redirectTo);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push(redirectTo);
      } finally {
        setIsChecking(false);
      }
    };

    // Only check if not already authenticated and not loading
    if (!isAuthenticated && !isLoading) {
      checkAuth();
    } else {
      setIsChecking(false);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  // Show loading spinner while checking authentication
  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect (this should be handled by middleware, but this is a fallback)
  if (!isAuthenticated || !user) {
    return null; // Will redirect via useEffect
  }

  // Check role requirements
  if (requiredRole && user.role !== requiredRole && user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have the required permissions to access this page.
          </p>
        </div>
      </div>
    );
  }

  // Check plan requirements
  if (requiredPlan && user.plan !== requiredPlan && user.plan !== 'ENTERPRISE') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-yellow-600 mb-4">Upgrade Required</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This feature requires a {requiredPlan} plan or higher.
          </p>
          <a
            href="/settings/plans"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upgrade Plan
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};