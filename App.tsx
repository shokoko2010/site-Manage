import React, { useState, useEffect, useCallback, createContext, Suspense } from 'react';
import TurndownService from 'turndown';
import DOMPurify from 'dompurify';
import { View, WordPressSite, GeneratedContent, Notification as NotificationType, LanguageCode, LanguageContextType, ArticleContent, ContentType, CampaignGenerationResult, SitePost, Language } from './types';
import Sidebar from './components/Sidebar';
import { getSitesFromStorage, saveSitesToStorage, fetchAllPostsFromAllSites } from './services/wordpressService';
import Notification from './components/Notification';
import { getT } from './i18n';
import Spinner from './components/common/Spinner';

const DashboardView = React.lazy(() => import('./components/DashboardView'));
const NewContentView = React.lazy(() => import('./components/NewContentView'));
const ContentLibraryView = React.lazy(() => import('./components/ContentLibraryView'));
const CalendarView = React.lazy(() => import('./components/CalendarView'));
const SettingsView = React.lazy(() => import('./components/SettingsView'));
const SiteDetailView = React.lazy(() => import('./components/SiteDetailView'));


export const LanguageContext = createContext<LanguageContextType | null>(null);

const turndownService = new TurndownService({ headingStyle: 'atx' });

export default function App() {
  const [currentView, setCurrentView] = useState<View>(View.Dashboard);
  const [sites, setSites] = useState<WordPressSite[]>([]);
  const [contentLibrary, setContentLibrary] = useState<GeneratedContent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<NotificationType | null>(null);
  const [language, setLanguage] = useState<LanguageCode>((localStorage.getItem('app_language') as LanguageCode) || 'en');
  
  // State for editing or creating specific content
  const [editingContent, setEditingContent] = useState<ArticleContent | null>(null);
  const [newContentType, setNewContentType] = useState<ContentType | undefined>(undefined);
  const [initialTitleForNewContent, setInitialTitleForNewContent] = useState<string | undefined>(undefined);
  
  const [activeSite, setActiveSite] = useState<WordPressSite | null>(null);
  
  const t = getT(language);
  
  const loadAllContent = useCallback(async (allSites: WordPressSite[]) => {
      try {
          // 1. Fetch all posts from all connected WordPress sites
          const sitePosts = await fetchAllPostsFromAllSites(allSites);
          const syncedContent: ArticleContent[] = sitePosts.map((post: SitePost) => {
              const sanitizedHtml = DOMPurify.sanitize(post.content.rendered);
              const markdownBody = turndownService.turndown(sanitizedHtml);
              const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];

              return {
                  id: `synced_${post.id}`,
                  type: ContentType.Article,
                  title: post.title.rendered,
                  metaDescription: '', // Not available from basic posts endpoint
                  body: markdownBody,
                  status: post.status === 'publish' ? 'published' : 'draft',
                  createdAt: new Date(post.date),
                  language: allSites.find(s => s.url === new URL(post.link).origin)?.url.includes('.ar') ? Language.Arabic : Language.English,
                  siteId: allSites.find(s => s.url === new URL(post.link).origin)?.id,
                  postId: post.id,
                  origin: 'synced',
                  postLink: post.link,
                  performanceStats: post.performance_stats,
                  scheduledFor: post.status === 'future' ? new Date(post.date).toISOString() : undefined,
                  featuredMediaId: featuredMedia?.id,
                  featuredMediaUrl: featuredMedia?.source_url,
              };
          });
          
          // 2. Load locally generated content
          const localContent: GeneratedContent[] = JSON.parse(localStorage.getItem('content_library') || '[]')
            .map((item: GeneratedContent) => ({...item, createdAt: new Date(item.createdAt)}));
            
          // 3. Merge and deduplicate
          // Keep local content only if it hasn't been synced (i.e., doesn't have a postId that exists in synced content)
          const syncedPostIds = new Set(syncedContent.map(c => c.postId));
          const uniqueLocalContent = localContent.filter(item => !item.postId || !syncedPostIds.has(item.postId));

          const combinedLibrary = [...syncedContent, ...uniqueLocalContent];
          setContentLibrary(combinedLibrary);
          
      } catch (error) {
           console.error("Failed to load all content:", error);
           showNotification({ message: 'Could not sync with all WordPress sites.', type: 'error'});
           // Fallback to only local storage if sync fails
           const storedContent = JSON.parse(localStorage.getItem('content_library') || '[]');
           setContentLibrary(storedContent.map((item: GeneratedContent) => ({...item, createdAt: new Date(item.createdAt)})));
      }
  }, []);

  useEffect(() => {
    // Load sites and then all content
    setIsLoading(true);
    const storedSites = getSitesFromStorage();
    setSites(storedSites);
    loadAllContent(storedSites).finally(() => setIsLoading(false));
  }, [loadAllContent]);

  useEffect(() => {
      localStorage.setItem('app_language', language);
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    // Persist content library to local storage whenever it changes, but only store non-synced items
    const localItems = contentLibrary.filter(item => item.origin !== 'synced');
    localStorage.setItem('content_library', JSON.stringify(localItems));
  }, [contentLibrary]);


  const showNotification = (notif: NotificationType) => {
    setNotification(notif);
  };

  const addSite = (newSite: WordPressSite) => {
    const updatedSites = [...sites, newSite];
    setSites(updatedSites);
    saveSitesToStorage(updatedSites);
    showNotification({ message: t('siteAdded', { name: newSite.name }), type: 'success' });
    // Refresh content after adding a new site
    loadAllContent(updatedSites);
  };

  const removeSite = (siteId: string) => {
    const updatedSites = sites.filter(site => site.id !== siteId)
    setSites(updatedSites);
    saveSitesToStorage(updatedSites);
    showNotification({ message: t('siteRemoved'), type: 'info' });
     // Refresh content after removing a site
    loadAllContent(updatedSites);
  }

  const addToLibrary = useCallback((content: GeneratedContent) => {
    setContentLibrary(prevLibrary => [content, ...prevLibrary]);
    showNotification({ message: t('contentSaved', { title: content.title }), type: 'success' });
  }, [t]);
  
  const handleCampaignGenerated = useCallback((campaignResult: CampaignGenerationResult) => {
    const allNewArticles = [campaignResult.pillarPost, ...campaignResult.clusterPosts];
    setContentLibrary(prevLibrary => [...allNewArticles, ...prevLibrary]);
    showNotification({ message: t('campaignGenerated'), type: 'success' });
  }, [t]);

  const handleMultipleContentsGenerated = useCallback((contents: GeneratedContent[]) => {
    setContentLibrary(prevLibrary => [...contents, ...prevLibrary]);
    const notificationMessage = t('multipleContentsGenerated', { count: contents.length });
    showNotification({ message: notificationMessage, type: 'success' });
  }, [t]);

  const removeFromLibrary = (contentId: string) => {
    setContentLibrary(prev => prev.filter(item => item.id !== contentId));
  }

  const updateLibraryItem = (contentId: string, updates: Partial<GeneratedContent>) => {
    setContentLibrary(prev => prev.map(item => item.id === contentId ? { ...item, ...updates } as GeneratedContent : item));
  };
  
  const editFromLibrary = (content: ArticleContent) => {
    setEditingContent(content);
    setNewContentType(undefined); // Ensure we're in edit mode
    setInitialTitleForNewContent(undefined);
    setCurrentView(View.NewContent);
  };

  const createNew = (type: ContentType, title?: string) => {
    setNewContentType(type);
    setEditingContent(null);
    setInitialTitleForNewContent(title);
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

  const navigateTo = (view: View) => {
      if (view !== View.NewContent && currentView === View.NewContent) {
        setEditingContent(null);
        setNewContentType(undefined);
        setInitialTitleForNewContent(undefined);
      }
      if (view !== View.SiteDetail) {
        setActiveSite(null);
      }
      setCurrentView(view);
    };

  const navigateToSiteDetail = (site: WordPressSite) => {
    setActiveSite(site);
    setCurrentView(View.SiteDetail);
  };
  
  const handleEditorExit = () => {
    // If we were on a site detail page before, go back there. Otherwise, go to library.
    const destination = activeSite ? View.SiteDetail : View.ContentLibrary;
    navigateTo(destination);
    // After editing, a sync might be needed to get the latest version
    loadAllContent(sites);
  };


  const renderView = () => {
    const fallback = <div className="flex h-full w-full items-center justify-center"><Spinner size="lg" /></div>;
    
    if (currentView === View.NewContent) {
        return (
             <Suspense fallback={fallback}>
                <NewContentView 
                    onContentGenerated={addToLibrary} 
                    onCampaignGenerated={handleCampaignGenerated}
                    onMultipleContentsGenerated={handleMultipleContentsGenerated}
                    sites={sites} 
                    showNotification={showNotification} 
                    initialContent={editingContent}
                    onExit={handleEditorExit}
                    newContentType={newContentType}
                    initialTitle={initialTitleForNewContent}
                />
            </Suspense>
        )
    }

    return (
       <div className="flex-1 overflow-y-auto">
        {(() => {
            switch (currentView) {
              case View.Dashboard:
                return (
                  <Suspense fallback={fallback}>
                    <DashboardView 
                      sites={sites} 
                      onAddSite={addSite} 
                      onRemoveSite={removeSite} 
                      isLoading={isLoading} 
                      onManageSite={navigateToSiteDetail}
                      onNavigateToNewContent={createNew}
                      contentLibrary={contentLibrary}
                    />
                  </Suspense>
                );
              case View.ContentLibrary:
                return (
                    <Suspense fallback={fallback}>
                      <ContentLibraryView 
                        library={contentLibrary} 
                        sites={sites} 
                        onRemoveFromLibrary={removeFromLibrary} 
                        showNotification={showNotification} 
                        onEdit={editFromLibrary} 
                        onScheduleAll={scheduleAllUnscheduled} 
                        onUpdateLibraryItem={updateLibraryItem}
                      />
                    </Suspense>
                );
              case View.Calendar:
                return (
                    <Suspense fallback={fallback}>
                      <CalendarView 
                        library={contentLibrary} 
                        sites={sites} 
                        showNotification={showNotification} 
                        onUpdateLibraryItem={updateLibraryItem} 
                      />
                    </Suspense>
                );
              case View.Settings:
                  return (
                    <Suspense fallback={fallback}>
                      <SettingsView showNotification={showNotification} />
                    </Suspense>
                  );
              case View.SiteDetail:
                  return (
                    <Suspense fallback={fallback}>
                        {activeSite ? <SiteDetailView site={activeSite} onEdit={editFromLibrary} onBack={() => navigateTo(View.Dashboard)} showNotification={showNotification} /> : <DashboardView sites={sites} onAddSite={addSite} onRemoveSite={removeSite} isLoading={isLoading} onManageSite={navigateToSiteDetail} onNavigateToNewContent={createNew} contentLibrary={contentLibrary} />}
                    </Suspense>
                  );
              default:
                return (
                  <Suspense fallback={fallback}>
                    <DashboardView 
                      sites={sites} 
                      onAddSite={addSite} 
                      onRemoveSite={removeSite} 
                      isLoading={isLoading} 
                      onManageSite={navigateToSiteDetail}
                      onNavigateToNewContent={createNew}
                      contentLibrary={contentLibrary}
                    />
                  </Suspense>
                );
            }
        })()}
        </div>
    );
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
        <Notification notification={notification} onClose={() => setNotification(null)} />
        {currentView !== View.NewContent && <Sidebar currentView={currentView} setCurrentView={navigateTo} onQuickAction={createNew} />}
        <main className="flex-1 flex flex-col">
          {renderView()}
        </main>
      </div>
    </LanguageContext.Provider>
  );
}