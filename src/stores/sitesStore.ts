import { create } from 'zustand';
import { WordPressSite } from '@/types/types';

interface SitesState {
  sites: WordPressSite[];
  selectedSite: WordPressSite | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSites: (sites: WordPressSite[]) => void;
  addSite: (site: WordPressSite) => void;
  updateSite: (siteId: string, updates: Partial<WordPressSite>) => void;
  removeSite: (siteId: string) => void;
  selectSite: (site: WordPressSite | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useSitesStore = create<SitesState>((set, get) => ({
  sites: [],
  selectedSite: null,
  isLoading: false,
  error: null,

  setSites: (sites: WordPressSite[]) => {
    set({ sites });
  },

  addSite: (site: WordPressSite) => {
    set((state) => ({
      sites: [...state.sites, site]
    }));
  },

  updateSite: (siteId: string, updates: Partial<WordPressSite>) => {
    set((state) => ({
      sites: state.sites.map(site => 
        site.id === siteId ? { ...site, ...updates } : site
      )
    }));
  },

  removeSite: (siteId: string) => {
    set((state) => ({
      sites: state.sites.filter(site => site.id !== siteId),
      selectedSite: state.selectedSite?.id === siteId ? null : state.selectedSite
    }));
  },

  selectSite: (site: WordPressSite | null) => {
    set({ selectedSite: site });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },
}));