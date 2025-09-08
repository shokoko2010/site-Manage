import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
            headers: {
              Authorization: `Bearer ${refreshToken}`
            }
          });

          const { token } = response.data;
          localStorage.setItem('authToken', token);
          
          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role: string;
  plan: string;
  avatar?: string;
  bio?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface WordPressSite {
  id: string;
  url: string;
  name: string;
  isVirtual: boolean;
  isActive: boolean;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    content: number;
  };
}

export interface ContentData {
  id: string;
  type: 'ARTICLE' | 'PRODUCT' | 'CAMPAIGN';
  title: string;
  body: string;
  metaDescription?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'PENDING' | 'SCHEDULED' | 'ARCHIVED';
  language: string;
  featuredImage?: string;
  scheduledFor?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  site?: {
    id: string;
    name: string;
    url: string;
  };
  tags?: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
  categories?: Array<{
    category: {
      id: string;
      name: string;
    };
  }>;
}

export interface CreateContentData {
  type: 'ARTICLE' | 'PRODUCT' | 'CAMPAIGN';
  title: string;
  body: string;
  metaDescription?: string;
  language?: string;
  siteId?: string;
  featuredImage?: string;
  scheduledFor?: string;
  tags?: string[];
  categories?: string[];
}

// API Services
export const authService = {
  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  // Register
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  // Logout
  async logout(): Promise<void> {
    await api.post('/auth/logout');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  },

  // Get current user
  async getCurrentUser(): Promise<{ user: User }> {
    const response = await api.get<{ user: User }>('/auth/me');
    return response.data;
  },

  // Refresh token
  async refreshToken(): Promise<{ token: string; message: string }> {
    const response = await api.post<{ token: string; message: string }>('/auth/refresh');
    return response.data;
  },
};

export const userService = {
  // Get all users (admin only)
  async getUsers(): Promise<{ users: User[] }> {
    const response = await api.get<{ users: User[] }>('/users');
    return response.data;
  },

  // Get user by ID
  async getUserById(id: string): Promise<{ user: User }> {
    const response = await api.get<{ user: User }>(`/users/${id}`);
    return response.data;
  },

  // Update user profile
  async updateUser(id: string, data: Partial<User>): Promise<{ message: string; user: User }> {
    const response = await api.put<{ message: string; user: User }>(`/users/${id}`, data);
    return response.data;
  },

  // Change password
  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await api.put<{ message: string }>(`/users/${id}/password`, {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

export const siteService = {
  // Get user's sites
  async getSites(): Promise<{ sites: WordPressSite[] }> {
    const response = await api.get<{ sites: WordPressSite[] }>('/sites');
    return response.data;
  },

  // Get specific site
  async getSite(id: string): Promise<{ site: WordPressSite }> {
    const response = await api.get<{ site: WordPressSite }>(`/sites/${id}`);
    return response.data;
  },

  // Create new site
  async createSite(data: {
    url: string;
    name?: string;
    isVirtual?: boolean;
    username?: string;
    appPassword?: string;
  }): Promise<{ message: string; site: WordPressSite }> {
    const response = await api.post<{ message: string; site: WordPressSite }>('/sites', data);
    return response.data;
  },

  // Update site
  async updateSite(id: string, data: Partial<WordPressSite>): Promise<{ message: string; site: WordPressSite }> {
    const response = await api.put<{ message: string; site: WordPressSite }>(`/sites/${id}`, data);
    return response.data;
  },

  // Delete site
  async deleteSite(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/sites/${id}`);
    return response.data;
  },

  // Sync site
  async syncSite(id: string): Promise<{ message: string; site: WordPressSite }> {
    const response = await api.post<{ message: string; site: WordPressSite }>(`/sites/${id}/sync`);
    return response.data;
  },
};

export const contentService = {
  // Get content with filtering
  async getContent(params?: {
    type?: string;
    status?: string;
    siteId?: string;
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{ 
    content: ContentData[]; 
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const response = await api.get('/content', { params });
    return response.data;
  },

  // Get specific content
  async getContentById(id: string): Promise<{ content: ContentData }> {
    const response = await api.get<{ content: ContentData }>(`/content/${id}`);
    return response.data;
  },

  // Create content
  async createContent(data: CreateContentData): Promise<{ message: string; content: ContentData }> {
    const response = await api.post<{ message: string; content: ContentData }>('/content', data);
    return response.data;
  },

  // Update content
  async updateContent(id: string, data: Partial<CreateContentData>): Promise<{ message: string; content: ContentData }> {
    const response = await api.put<{ message: string; content: ContentData }>(`/content/${id}`, data);
    return response.data;
  },

  // Delete content
  async deleteContent(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/content/${id}`);
    return response.data;
  },

  // Publish content
  async publishContent(id: string): Promise<{ message: string; content: ContentData }> {
    const response = await api.post<{ message: string; content: ContentData }>(`/content/${id}/publish`);
    return response.data;
  },

  // Get content analytics
  async getContentAnalytics(id: string, params?: { startDate?: string; endDate?: string }): Promise<{ analytics: any[] }> {
    const response = await api.get<{ analytics: any[] }>(`/content/${id}/analytics`, { params });
    return response.data;
  },
};

export const analyticsService = {
  // Get dashboard analytics
  async getDashboardAnalytics(params?: { startDate?: string; endDate?: string }): Promise<{
    userAnalytics: any[];
    contentStats: any[];
    siteStats: any[];
    topContent: any[];
    totals: any;
  }> {
    const response = await api.get('/analytics/dashboard', { params });
    return response.data;
  },

  // Get user analytics
  async getUserAnalytics(params?: { 
    startDate?: string; 
    endDate?: string; 
    granularity?: 'daily' | 'weekly' | 'monthly' 
  }): Promise<{ analytics: any[] }> {
    const response = await api.get('/analytics/user', { params });
    return response.data;
  },

  // Get site analytics
  async getSiteAnalytics(siteId: string, params?: { startDate?: string; endDate?: string }): Promise<{
    analytics: any[];
    contentPerformance: any[];
  }> {
    const response = await api.get(`/analytics/sites/${siteId}`, { params });
    return response.data;
  },

  // Generate report
  async generateReport(data: {
    startDate: string;
    endDate: string;
    type: 'user' | 'sites' | 'content';
  }): Promise<{ message: string; report: any; reportId: string }> {
    const response = await api.post<{ message: string; report: any; reportId: string }>('/analytics/report', data);
    return response.data;
  },
};

// Error handling utility
export const handleApiError = (error: any): string => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Utility to set auth tokens
export const setAuthTokens = (token: string, refreshToken?: string) => {
  localStorage.setItem('authToken', token);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};

// Utility to clear auth tokens
export const clearAuthTokens = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
};

// Utility to check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('authToken');
};

export default api;