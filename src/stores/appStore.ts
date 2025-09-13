import { create } from 'zustand';

interface AppState {
  // UI State
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  
  // Notifications
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: Date;
  }>;
  
  // Loading states
  loadingStates: Record<string, boolean>;
  
  // Modal states
  modals: Record<string, boolean>;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: string) => void;
  
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
  
  openModal: (modal: string) => void;
  closeModal: (modal: string) => void;
  toggleModal: (modal: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  sidebarOpen: true,
  theme: 'system',
  language: 'en',
  notifications: [],
  loadingStates: {},
  modals: {},

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open });
  },

  setTheme: (theme: 'light' | 'dark' | 'system') => {
    set({ theme });
  },

  setLanguage: (language: string) => {
    set({ language });
  },

  addNotification: (notification) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          ...notification,
          id,
          timestamp: new Date(),
        },
      ],
    }));
  },

  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  setLoading: (key: string, loading: boolean) => {
    set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        [key]: loading,
      },
    }));
  },

  isLoading: (key: string) => {
    return get().loadingStates[key] || false;
  },

  openModal: (modal: string) => {
    set((state) => ({
      modals: {
        ...state.modals,
        [modal]: true,
      },
    }));
  },

  closeModal: (modal: string) => {
    set((state) => ({
      modals: {
        ...state.modals,
        [modal]: false,
      },
    }));
  },

  toggleModal: (modal: string) => {
    set((state) => ({
      modals: {
        ...state.modals,
        [modal]: !state.modals[modal],
      },
    }));
  },
}));