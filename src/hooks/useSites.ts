import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sitesApi } from '@/lib/api';
import { useSitesStore } from '@/stores';
import { WordPressSite } from '@/types/types';

// Query keys
export const sitesKeys = {
  all: ['sites'] as const,
  lists: () => [...sitesKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...sitesKeys.lists(), { filters }] as const,
  details: () => [...sitesKeys.all, 'detail'] as const,
  detail: (id: string) => [...sitesKeys.details(), id] as const,
};

// Sites hooks
export const useSites = () => {
  const { setSites, setLoading, setError } = useSitesStore();

  return useQuery({
    queryKey: sitesKeys.list({}),
    queryFn: () => sitesApi.getSites(),
    onSuccess: (data) => {
      setSites(data);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Failed to fetch sites');
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

export const useSite = (siteId: string) => {
  return useQuery({
    queryKey: sitesKeys.detail(siteId),
    queryFn: () => sitesApi.getSite(siteId),
    enabled: !!siteId,
  });
};

export const useCreateSite = () => {
  const queryClient = useQueryClient();
  const { addSite } = useSitesStore();

  return useMutation({
    mutationFn: sitesApi.createSite,
    onSuccess: (data) => {
      addSite(data);
      queryClient.invalidateQueries({ queryKey: sitesKeys.lists() });
    },
  });
};

export const useUpdateSite = () => {
  const queryClient = useQueryClient();
  const { updateSite } = useSitesStore();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof sitesApi.updateSite>[1]) =>
      sitesApi.updateSite(id, data),
    onSuccess: (data, variables) => {
      updateSite(variables.id, data);
      queryClient.invalidateQueries({ queryKey: sitesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sitesKeys.detail(variables.id) });
    },
  });
};

export const useDeleteSite = () => {
  const queryClient = useQueryClient();
  const { removeSite } = useSitesStore();

  return useMutation({
    mutationFn: sitesApi.deleteSite,
    onSuccess: (_, variables) => {
      removeSite(variables);
      queryClient.invalidateQueries({ queryKey: sitesKeys.lists() });
    },
  });
};

export const useSyncSite = () => {
  const queryClient = useQueryClient();
  const { updateSite } = useSitesStore();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => sitesApi.syncSite(id),
    onSuccess: (data, variables) => {
      // Update site with sync information
      updateSite(variables.id, {
        lastSyncedAt: new Date(),
      });
      queryClient.invalidateQueries({ queryKey: sitesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sitesKeys.detail(variables.id) });
    },
  });
};

export const useTestConnection = () => {
  return useMutation({
    mutationFn: sitesApi.testConnection,
  });
};