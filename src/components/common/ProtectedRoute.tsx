"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  requiredPlan?: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
}

interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  plan: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  avatar?: string;
  bio?: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function ProtectedRoute({ children, requiredRole, requiredPlan }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      const user: User = data.user;

      // Check role requirements
      if (requiredRole && user.role !== requiredRole) {
        // Check if user has higher privileges
        const roleHierarchy = {
          'USER': 0,
          'ADMIN': 1,
          'SUPER_ADMIN': 2
        };
        
        const userRoleLevel = roleHierarchy[user.role];
        const requiredRoleLevel = roleHierarchy[requiredRole];
        
        if (userRoleLevel < requiredRoleLevel) {
          router.push('/unauthorized');
          return;
        }
      }

      // Check plan requirements
      if (requiredPlan && user.plan !== requiredPlan) {
        const planHierarchy = {
          'FREE': 0,
          'BASIC': 1,
          'PREMIUM': 2,
          'ENTERPRISE': 3
        };
        
        const userPlanLevel = planHierarchy[user.plan];
        const requiredPlanLevel = planHierarchy[requiredPlan];
        
        if (userPlanLevel < requiredPlanLevel) {
          router.push('/upgrade');
          return;
        }
      }

      setAuthorized(true);
    } catch (error) {
      console.error('Authorization check failed:', error);
      localStorage.removeItem('auth_token');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-muted-foreground">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null; // Will redirect automatically
  }

  return <>{children}</>;
}