import { create } from 'zustand';
import { GeneratedContent, ContentType } from '@/types/types';

interface ContentState {
  content: GeneratedContent[];
  selectedContent: GeneratedContent | null;
  isLoading: boolean;
  error: string | null;
  
  // Filters
  filters: {
    type?: ContentType;
    status?: string;
    siteId?: string;
    searchQuery?: string;
  };
  
  // Actions
  setContent: (content: GeneratedContent[]) => void;
  addContent: (content: GeneratedContent) => void;
  updateContent: (contentId: string, updates: Partial<GeneratedContent>) => void;
  removeContent: (contentId: string) => void;
  selectContent: (content: GeneratedContent | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setFilters: (filters: Partial<ContentState['filters']>) => void;
  clearFilters: () => void;
  
  // Computed
  filteredContent: GeneratedContent[];
}

export const useContentStore = create<ContentState>((set, get) => ({
  content: [],
  selectedContent: null,
  isLoading: false,
  error: null,
  filters: {},

  setContent: (content: GeneratedContent[]) => {
    set({ content });
  },

  addContent: (content: GeneratedContent) => {
    set((state) => ({
      content: [content, ...state.content]
    }));
  },

  updateContent: (contentId: string, updates: Partial<GeneratedContent>) => {
    set((state) => ({
      content: state.content.map(item => 
        item.id === contentId ? { ...item, ...updates } : item
      ),
      selectedContent: state.selectedContent?.id === contentId 
        ? { ...state.selectedContent, ...updates }
        : state.selectedContent
    }));
  },

  removeContent: (contentId: string) => {
    set((state) => ({
      content: state.content.filter(item => item.id !== contentId),
      selectedContent: state.selectedContent?.id === contentId ? null : state.selectedContent
    }));
  },

  selectContent: (content: GeneratedContent | null) => {
    set({ selectedContent: content });
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

  setFilters: (filters: Partial<ContentState['filters']>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters }
    }));
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  // Computed property
  get filteredContent() {
    const { content, filters } = get();
    
    return content.filter(item => {
      // Type filter
      if (filters.type && item.type !== filters.type) return false;
      
      // Status filter
      if (filters.status && item.status !== filters.status) return false;
      
      // Site filter
      if (filters.siteId && item.siteId !== filters.siteId) return false;
      
      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matches = 
          item.title.toLowerCase().includes(query) ||
          item.metaDescription?.toLowerCase().includes(query) ||
          item.body.toLowerCase().includes(query);
        if (!matches) return false;
      }
      
      return true;
    });
  },
}));