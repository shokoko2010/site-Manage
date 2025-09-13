// API Service for Next.js API routes
export interface User {
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

export interface Site {
  id: string;
  userId: string;
  url: string;
  name: string;
  isVirtual: boolean;
  username?: string;
  appPassword?: string;
  isActive: boolean;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Content {
  id: string;
  userId: string;
  siteId?: string;
  type: 'ARTICLE' | 'PRODUCT' | 'CAMPAIGN';
  title: string;
  slug: string;
  metaDescription?: string;
  body: string;
  status: 'DRAFT' | 'PUBLISHED' | 'PENDING' | 'SCHEDULED' | 'ARCHIVED';
  language: 'ENGLISH' | 'ARABIC' | 'FRENCH' | 'SPANISH' | 'GERMAN' | 'JAPANESE';
  featuredImage?: string;
  featuredMediaId?: number;
  featuredMediaUrl?: string;
  scheduledFor?: string;
  postId?: number;
  origin: 'NEW' | 'SYNCED' | 'IMPORTED';
  postLink?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  seoScore?: number;
  seoAnalysis?: any;
  internalLinks?: any;
  performanceStats?: any;
  site?: Site;
  tags: Array<{ tag: { id: string; name: string; slug: string } }>;
  categories: Array<{ category: { id: string; name: string; slug: string } }>;
}

class ApiService {
  private getBaseUrl(): string {
    return typeof window !== 'undefined' ? '' : 'http://localhost:3000';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authorization header if token exists
    const token = this.getToken();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Token management
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  public setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  public removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const response = await this.request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    this.setToken(response.token);
    return response;
  }

  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    const response = await this.request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    this.setToken(response.token);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request<{ message: string }>('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      this.removeToken();
    }
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth/me');
  }

  // Sites
  async getSites(): Promise<{ sites: Site[] }> {
    return this.request<{ sites: Site[] }>('/api/sites');
  }

  async createSite(siteData: {
    url: string;
    name: string;
    isVirtual?: boolean;
    username?: string;
    appPassword?: string;
  }): Promise<{ message: string; site: Site }> {
    return this.request<{ message: string; site: Site }>('/api/sites', {
      method: 'POST',
      body: JSON.stringify(siteData),
    });
  }

  // Content
  async getContent(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    siteId?: string;
  }): Promise<{
    content: Content[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/content${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.request<{
      content: Content[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);
  }

  async createContent(contentData: {
    title: string;
    body: string;
    type: 'ARTICLE' | 'PRODUCT' | 'CAMPAIGN';
    metaDescription?: string;
    language?: 'ENGLISH' | 'ARABIC' | 'FRENCH' | 'SPANISH' | 'GERMAN' | 'JAPANESE';
    featuredImage?: string;
    siteId?: string;
    scheduledFor?: string;
    tagIds?: string[];
    categoryIds?: string[];
  }): Promise<{ message: string; content: Content }> {
    return this.request<{ message: string; content: Content }>('/api/content', {
      method: 'POST',
      body: JSON.stringify(contentData),
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; message: string; timestamp: string }> {
    return this.request<{ status: string; message: string; timestamp: string }>('/api/health');
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export utility functions for backward compatibility
export const authService = {
  login: (credentials: LoginCredentials) => apiService.login(credentials),
  register: (data: RegisterData) => apiService.register(data),
  logout: () => apiService.logout(),
  getCurrentUser: () => apiService.getCurrentUser(),
};

export const siteService = {
  getSites: () => apiService.getSites(),
  createSite: (siteData: {
    url: string;
    name: string;
    isVirtual?: boolean;
    username?: string;
    appPassword?: string;
  }) => apiService.createSite(siteData),
  deleteSite: async (siteId: string) => {
    return apiService.request<{ message: string }>(`/api/sites/${siteId}`, {
      method: 'DELETE',
    });
  },
};

export const contentService = {
  getContent: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    siteId?: string;
  }) => apiService.getContent(params),
  createContent: (contentData: {
    title: string;
    body: string;
    type: 'ARTICLE' | 'PRODUCT' | 'CAMPAIGN';
    metaDescription?: string;
    language?: 'ENGLISH' | 'ARABIC' | 'FRENCH' | 'SPANISH' | 'GERMAN' | 'JAPANESE';
    featuredImage?: string;
    siteId?: string;
    scheduledFor?: string;
    tagIds?: string[];
    categoryIds?: string[];
  }) => apiService.createContent(contentData),
};

export const setAuthTokens = (token: string): void => {
  apiService.setToken(token);
};

export const clearAuthTokens = (): void => {
  apiService.removeToken();
};

export const isAuthenticated = (): boolean => {
  return !!apiService.getToken();
};