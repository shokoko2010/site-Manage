import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  login: () => [...authKeys.all, 'login'] as const,
  register: () => [...authKeys.all, 'register'] as const,
};

// Auth hooks
export const useAuth = () => {
  const { isAuthenticated, user } = useAuthStore();
  
  const { data, isLoading, error } = useQuery({
    queryKey: authKeys.user(),
    queryFn: () => authApi.getCurrentUser(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    user: data || user,
    isLoading,
    error,
    isAuthenticated: isAuthenticated && !!data,
  };
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      login(data.user);
      queryClient.setQueryData(authKeys.user(), data.user);
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      login(data.user);
      queryClient.setQueryData(authKeys.user(), data.user);
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      logout();
      queryClient.removeQueries();
      queryClient.clear();
    },
  });
};