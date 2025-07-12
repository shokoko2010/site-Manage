
import React, { useState, useEffect, useCallback, createContext, Suspense } from 'react';
import { View, WordPressSite, GeneratedContent, Notification as NotificationType, LanguageCode, LanguageContextType, ArticleContent } from './types';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import ContentLibraryView from './components/ContentLibraryView';
import CalendarView from './components/CalendarView';
import { getSitesFromStorage, saveSitesToStorage } from './services/wordpressService';
import Notification from './components/Notification';
import { getT } from './i18n';
import SettingsView from './components/SettingsView';
import Spinner from './components/common/Spinner';

const NewContentView = React.lazy(() => import('./components/NewContentView'));

export const LanguageContext = createContext<LanguageContextType | null>(null);

export default function App() {
  const [currentView, setCurrentView] = useState<View>(View.Dashboard);
  const [sites, setSites] = useState<WordPressSite[]>([]);
  const [contentLibrary, setContentLibrary] = useState<GeneratedContent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<NotificationType | null>(null);
  const [language, setLanguage] = useState<LanguageCode>((localStorage.getItem('app_language') as LanguageCode) || 'en');
  const [editingContent, setEditingContent] = useState<ArticleContent | null>(null);
  
  const t = getT(language);

  useEffect(() => {
    // Load sites and content library from local storage on initial load
    setIsLoading(true);
    try {
        const storedSites = getSitesFromStorage();
        setSites(storedSites);
        const storedContent = JSON.parse(localStorage.getItem('content_library') || '[]');
        setContentLibrary(storedContent);
    } catch (error) {
        console.error("Failed to load data from storage:", error);
        showNotification({ message: 'Could not load data from your browser storage.', type: 'error'});
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
      localStorage.setItem('app_language', language);
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    // Persist content library to local storage whenever it changes
    localStorage.setItem('content_library', JSON.stringify(contentLibrary));
  }, [contentLibrary]);


  const showNotification = (notif: NotificationType) => {
    setNotification(notif);
  };

  const addSite = (newSite: WordPressSite) => {
    const updatedSites = [...sites, newSite];
    setSites(updatedSites);
    saveSitesToStorage(updatedSites);
    showNotification({ message: t('siteAdded', { name: newSite.name }), type: 'success' });
  };

  const removeSite = (siteId: string) => {
    const updatedSites = sites.filter(site => site.id !== siteId)
    setSites(updatedSites);
    saveSitesToStorage(updatedSites);
    showNotification({ message: t('siteRemoved'), type: 'info' });
  }

  const addToLibrary = useCallback((content: GeneratedContent) => {
    setContentLibrary(prevLibrary => [content, ...prevLibrary]);
    showNotification({ message: t('contentSaved', { title: content.title }), type: 'success' });
  }, [t]);
  
  const addMultipleToLibrary = useCallback((contents: ArticleContent[]) => {
    setContentLibrary(prevLibrary => [...contents, ...prevLibrary]);
    showNotification({ message: t('strategyGenerated'), type: 'success' });
  }, [t]);

  const removeFromLibrary = (contentId: string) => {
    setContentLibrary(prev => prev.filter(item => item.id !== contentId));
  }

  const updateLibraryItem = (contentId: string, updates: Partial<GeneratedContent>) => {
    setContentLibrary(prev => prev.map(item => item.id === contentId ? { ...item, ...updates } as GeneratedContent : item));
  };
  
  const editFromLibrary = (content: ArticleContent) => {
    setEditingContent(content);
    setCurrentView(View.NewContent);
  };
  
  const scheduleAllUnscheduled = () => {
      const unscheduled = contentLibrary.filter(c => !c.scheduledFor);
      if (unscheduled.length === 0) {
          showNotification({ message: t('noUnscheduledItems'), type: 'info' });
          return;
      }
      
      const today = new Date();
      const updatedLibrary = contentLibrary.map(item => {
          if (!item.scheduledFor) {
              const itemToSchedule = unscheduled.find(u => u.id === item.id);
              if (itemToSchedule) {
                  const index = unscheduled.indexOf(itemToSchedule);
                  const scheduledDate = new Date(today);
                  scheduledDate.setDate(today.getDate() + index + 1); // Start scheduling from tomorrow
                  return { ...item, scheduledFor: scheduledDate.toISOString() };
              }
          }
          return item;
      });
      
      setContentLibrary(updatedLibrary);
      showNotification({ message: t('allItemsScheduled'), type: 'success' });
  };

  const renderView = () => {
    switch (currentView) {
      case View.Dashboard:
        return <DashboardView sites={sites} onAddSite={addSite} onRemoveSite={removeSite} isLoading={isLoading} />;
      case View.NewContent:
        return (
            <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><Spinner size="lg" /></div>}>
                <NewContentView onContentGenerated={addToLibrary} onStrategyGenerated={addMultipleToLibrary} sites={sites} showNotification={showNotification} initialContent={editingContent} />
            </Suspense>
        );
      case View.ContentLibrary:
        return <ContentLibraryView library={contentLibrary} sites={sites} onRemoveFromLibrary={removeFromLibrary} showNotification={showNotification} onEdit={editFromLibrary} onScheduleAll={scheduleAllUnscheduled} />;
      case View.Calendar:
        return <CalendarView library={contentLibrary} sites={sites} showNotification={showNotification} onUpdateLibraryItem={updateLibraryItem} onRemoveFromLibrary={removeFromLibrary} />;
      case View.Settings:
          return <SettingsView showNotification={showNotification} />;
      default:
        return <DashboardView sites={sites} onAddSite={addSite} onRemoveSite={removeSite} isLoading={isLoading} />;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
        <Notification notification={notification} onClose={() => setNotification(null)} />
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
        <main className="flex-1 overflow-y-auto">
          {renderView()}
        </main>
      </div>
    </LanguageContext.Provider>
  );
}
