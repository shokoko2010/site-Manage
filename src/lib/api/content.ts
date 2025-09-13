import { apiClient } from '../api-client';
import { GeneratedContent, ContentType } from '@/types/types';

// Content types
interface CreateContentData {
  title: string;
  body: string;
  type: ContentType;
  siteId?: string;
  metaDescription?: string;
  featuredImage?: string;
  language?: string;
}

interface UpdateContentData {
  title?: string;
  body?: string;
  status?: string;
  metaDescription?: string;
  featuredImage?: string;
  language?: string;
}

interface PublishContentResponse {
  success: boolean;
  postId?: number;
  postUrl?: string;
  message: string;
}

interface GenerateContentResponse {
  content: string;
  suggestions?: string[];
}

// Content API functions
export const contentApi = {
  // Get all content
  getContent: async (filters?: {
    type?: ContentType;
    status?: string;
    siteId?: string;
    search?: string;
  }): Promise<GeneratedContent[]> => {
    return await apiClient.get<GeneratedContent[]>('/content', { params: filters });
  },

  // Get single content
  getContentById: async (contentId: string): Promise<GeneratedContent> => {
    return await apiClient.get<GeneratedContent>(`/content/${contentId}`);
  },

  // Create content
  createContent: async (data: CreateContentData): Promise<GeneratedContent> => {
    return await apiClient.post<GeneratedContent>('/content', data);
  },

  // Update content
  updateContent: async (contentId: string, data: UpdateContentData): Promise<GeneratedContent> => {
    return await apiClient.put<GeneratedContent>(`/content/${contentId}`, data);
  },

  // Delete content
  deleteContent: async (contentId: string): Promise<void> => {
    return await apiClient.delete<void>(`/content/${contentId}`);
  },

  // Publish content
  publishContent: async (contentId: string): Promise<PublishContentResponse> => {
    return await apiClient.post<PublishContentResponse>(`/content/${contentId}/publish`);
  },

  // Generate content using AI
  generateContent: async (data: {
    prompt: string;
    type: ContentType;
    tone?: string;
    length?: 'short' | 'medium' | 'long';
  }): Promise<GenerateContentResponse> => {
    return await apiClient.post<GenerateContentResponse>('/content/generate', data);
  },

  // Enhance content using AI
  enhanceContent: async (contentId: string, data: {
    improvements: string[];
    targetAudience?: string;
  }): Promise<{ content: string; improvements: string[] }> => {
    return await apiClient.post<{ content: string; improvements: string[] }>(`/content/${contentId}/enhance`, data);
  },

  // Get SEO analysis
  getSEOAnalysis: async (contentId: string): Promise<{
    score: number;
    suggestions: string[];
    keywords: string[];
  }> => {
    return await apiClient.get<{
      score: number;
      suggestions: string[];
      keywords: string[];
    }>(`/content/${contentId}/seo`);
  },

  // Upload featured image
  uploadFeaturedImage: async (file: File): Promise<{ url: string; id: number }> => {
    return await apiClient.upload<{ url: string; id: number }>('/content/upload-image', file);
  },
};