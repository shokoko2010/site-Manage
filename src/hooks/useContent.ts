import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '@/lib/api';
import { useContentStore } from '@/stores';
import { GeneratedContent, ContentType } from '@/types/types';

// Query keys
export const contentKeys = {
  all: ['content'] as const,
  lists: () => [...contentKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...contentKeys.lists(), { filters }] as const,
  details: () => [...contentKeys.all, 'detail'] as const,
  detail: (id: string) => [...contentKeys.details(), id] as const,
  generate: () => [...contentKeys.all, 'generate'] as const,
  enhance: (id: string) => [...contentKeys.all, 'enhance', id] as const,
  seo: (id: string) => [...contentKeys.all, 'seo', id] as const,
};

// Content hooks
export const useContent = (filters?: {
  type?: ContentType;
  status?: string;
  siteId?: string;
  search?: string;
}) => {
  const { setContent, setLoading, setError } = useContentStore();

  return useQuery({
    queryKey: contentKeys.list(filters || {}),
    queryFn: () => contentApi.getContent(filters),
    onSuccess: (data) => {
      setContent(data);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Failed to fetch content');
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

export const useContentItem = (contentId: string) => {
  return useQuery({
    queryKey: contentKeys.detail(contentId),
    queryFn: () => contentApi.getContentById(contentId),
    enabled: !!contentId,
  });
};

export const useCreateContent = () => {
  const queryClient = useQueryClient();
  const { addContent } = useContentStore();

  return useMutation({
    mutationFn: contentApi.createContent,
    onSuccess: (data) => {
      addContent(data);
      queryClient.invalidateQueries({ queryKey: contentKeys.lists() });
    },
  });
};

export const useUpdateContent = () => {
  const queryClient = useQueryClient();
  const { updateContent } = useContentStore();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof contentApi.updateContent>[1]) =>
      contentApi.updateContent(id, data),
    onSuccess: (data, variables) => {
      updateContent(variables.id, data);
      queryClient.invalidateQueries({ queryKey: contentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contentKeys.detail(variables.id) });
    },
  });
};

export const useDeleteContent = () => {
  const queryClient = useQueryClient();
  const { removeContent } = useContentStore();

  return useMutation({
    mutationFn: contentApi.deleteContent,
    onSuccess: (_, variables) => {
      removeContent(variables);
      queryClient.invalidateQueries({ queryKey: contentKeys.lists() });
    },
  });
};

export const usePublishContent = () => {
  const queryClient = useQueryClient();
  const { updateContent } = useContentStore();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => contentApi.publishContent(id),
    onSuccess: (data, variables) => {
      updateContent(variables.id, {
        status: 'PUBLISHED',
        postId: data.postId,
        postLink: data.postUrl,
        publishedAt: new Date(),
      });
      queryClient.invalidateQueries({ queryKey: contentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contentKeys.detail(variables.id) });
    },
  });
};

export const useGenerateContent = () => {
  return useMutation({
    mutationFn: contentApi.generateContent,
  });
};

export const useEnhanceContent = () => {
  const queryClient = useQueryClient();
  const { updateContent } = useContentStore();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof contentApi.enhanceContent>[1]) =>
      contentApi.enhanceContent(id, data),
    onSuccess: (data, variables) => {
      updateContent(variables.id, {
        body: data.content,
      });
      queryClient.invalidateQueries({ queryKey: contentKeys.detail(variables.id) });
    },
  });
};

export const useSEOAnalysis = (contentId: string) => {
  return useQuery({
    queryKey: contentKeys.seo(contentId),
    queryFn: () => contentApi.getSEOAnalysis(contentId),
    enabled: !!contentId,
  });
};

export const useUploadFeaturedImage = () => {
  return useMutation({
    mutationFn: contentApi.uploadFeaturedImage,
  });
};