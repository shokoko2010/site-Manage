import { apiClient } from '../api-client';
import { WordPressSite } from '@/types/types';

// Site types
interface CreateSiteData {
  url: string;
  name: string;
  username?: string;
  appPassword?: string;
  isVirtual?: boolean;
}

interface UpdateSiteData {
  url?: string;
  name?: string;
  username?: string;
  appPassword?: string;
  isActive?: boolean;
}

interface SyncSiteResponse {
  success: boolean;
  message: string;
  contentCount?: number;
}

// Sites API functions
export const sitesApi = {
  // Get all sites
  getSites: async (): Promise<WordPressSite[]> => {
    return await apiClient.get<WordPressSite[]>('/sites');
  },

  // Get single site
  getSite: async (siteId: string): Promise<WordPressSite> => {
    return await apiClient.get<WordPressSite>(`/sites/${siteId}`);
  },

  // Create site
  createSite: async (data: CreateSiteData): Promise<WordPressSite> => {
    return await apiClient.post<WordPressSite>('/sites', data);
  },

  // Update site
  updateSite: async (siteId: string, data: UpdateSiteData): Promise<WordPressSite> => {
    return await apiClient.put<WordPressSite>(`/sites/${siteId}`, data);
  },

  // Delete site
  deleteSite: async (siteId: string): Promise<void> => {
    return await apiClient.delete<void>(`/sites/${siteId}`);
  },

  // Sync site
  syncSite: async (siteId: string): Promise<SyncSiteResponse> => {
    return await apiClient.post<SyncSiteResponse>(`/sites/${siteId}/sync`);
  },

  // Test site connection
  testConnection: async (data: CreateSiteData): Promise<{ success: boolean; message: string }> => {
    return await apiClient.post<{ success: boolean; message: string }>('/sites/test', data);
  },
};