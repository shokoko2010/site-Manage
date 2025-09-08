import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, LoginCredentials, RegisterData, setAuthTokens, clearAuthTokens, isAuthenticated } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasPermission: (permission: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (isAuthenticated()) {
        try {
          const { user } = await authService.getCurrentUser();
          setUser(user);
        } catch (error) {
          console.error('Failed to restore session:', error);
          clearAuthTokens();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const { user, token } = await authService.login(credentials);
      setUser(user);
      setAuthTokens(token);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const { user, token } = await authService.register(data);
      setUser(user);
      setAuthTokens(token);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      clearAuthTokens();
    }
  };

  const refreshUser = async () => {
    try {
      const { user } = await authService.getCurrentUser();
      setUser(user);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  };

  const isAuthenticatedUser = !!user;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;

    // Define permissions based on user plan
    const permissions: Record<string, string[]> = {
      FREE: ['view_dashboard', 'view_own_content'],
      BASIC: ['view_dashboard', 'view_own_content', 'create_content', 'edit_own_content'],
      PREMIUM: ['view_dashboard', 'view_own_content', 'create_content', 'edit_own_content', 'delete_own_content', 'view_analytics'],
      ENTERPRISE: ['view_dashboard', 'view_own_content', 'create_content', 'edit_own_content', 'delete_own_content', 'view_analytics', 'manage_users', 'view_all_content'],
    };

    return permissions[user.plan]?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: isAuthenticatedUser,
        isAdmin,
        hasPermission,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};