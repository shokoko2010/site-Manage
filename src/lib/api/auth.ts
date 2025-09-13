import { apiClient } from '../api-client';
import { User } from '@/stores';

// Auth types
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  name: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

// Auth API functions
export const authApi = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return await apiClient.post<AuthResponse>('/auth/login', credentials);
  },

  // Register user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    return await apiClient.post<AuthResponse>('/auth/register', data);
  },

  // Logout user
  logout: async (): Promise<void> => {
    return await apiClient.post<void>('/auth/logout');
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    return await apiClient.get<User>('/auth/me');
  },

  // Refresh token
  refreshToken: async (): Promise<{ token: string }> => {
    return await apiClient.post<{ token: string }>('/auth/refresh');
  },
};