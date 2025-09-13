import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useAuthStore } from '@/stores';

// API Response types
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = useAuthStore.getState().user?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add loading state
        const loadingKey = config.url || 'global';
        useAuthStore.getState().setLoading(loadingKey, true);

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        // Clear loading state
        const loadingKey = response.config.url || 'global';
        useAuthStore.getState().setLoading(loadingKey, false);

        return response;
      },
      (error: AxiosError<ApiError>) => {
        // Clear loading state
        const loadingKey = error.config?.url || 'global';
        useAuthStore.getState().setLoading(loadingKey, false);

        // Handle auth errors
        if (error.response?.status === 401) {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }

        // Handle other errors
        const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
        
        // Add notification
        const { useAppStore } = require('@/stores');
        useAppStore.getState().addNotification({
          type: 'error',
          title: 'API Error',
          message: errorMessage,
        });

        return Promise.reject(error);
      }
    );
  }

  // Generic request methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<ApiResponse<T>>(url, config);
    return response.data.data as T;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<ApiResponse<T>>(url, config);
    return response.data.data as T;
  }

  // Upload file method
  async upload<T = any>(url: string, file: File, config?: AxiosRequestConfig): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.instance.post<ApiResponse<T>>(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data as T;
  }

  // Get the axios instance for custom requests
  getInstance(): AxiosInstance {
    return this.instance;
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// Export default for convenience
export default apiClient;