import React, { useState, useEffect, useCallback } from 'react'
import TurndownService from 'turndown'
import DOMPurify from 'dompurify'
import { View, WordPressSite, GeneratedContent, Notification as NotificationType, LanguageCode, ArticleContent, ContentType, CampaignGenerationResult, SitePost, Language } from '../types/types'
import Sidebar from '../components/Sidebar'
import { getSitesFromStorage, saveSitesToStorage, fetchAllPostsFromAllSites } from '../services/wordpressService'
import Notification from '../components/Notification'
import { getT } from '../lib/i18n'
import Spinner from '../components/common/Spinner'
import { ProtectedRoute } from './common/ProtectedRoute'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { siteService, contentService } from '../services/apiService'
import { UserManagement } from './admin/UserManagement'
import { SubscriptionPlans } from './SubscriptionPlans'

import DashboardView from '../components/DashboardView'
import NewContentView from '../components/NewContentView'
import ContentLibraryView from '../components/ContentLibraryView'
import CalendarView from '../components/CalendarView'
import SettingsView from '../components/SettingsView'
import SiteDetailView from '../components/SiteDetailView'

const turndownService = new TurndownService({ headingStyle: 'atx' })

export const AuthenticatedApp: React.FC = () => {
  const { user, logout, hasPermission, loading: authLoading, isAuthenticated } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const [currentView, setCurrentView] = useState<View>(View.Dashboard)
  const [sites, setSites] = useState<WordPressSite[]>([])
  const [contentLibrary, setContentLibrary] = useState<GeneratedContent[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [notification, setNotification] = useState<NotificationType | null>(null)
  
  // State for editing or creating specific content
  const [editingContent, setEditingContent] = useState<ArticleContent | null>(null)
  const [newContentType, setNewContentType] = useState<ContentType | undefined>(undefined)
  const [initialTitleForNewContent, setInitialTitleForNewContent] = useState<string | undefined>(undefined)
  
  const [activeSite, setActiveSite] = useState<WordPressSite | null>(null)

  // Load sites and content from API
  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated || !user) return;

      try {
        setIsLoading(true);
        
        // Load sites from API
        const { sites: apiSites } = await siteService.getSites();
        setSites(apiSites);

        // Load content from API
        const { content: apiContent } = await contentService.getContent();
        setContentLibrary(apiContent as GeneratedContent[]);
        
      } catch (error) {
        console.error('Failed to load data:', error);
        setNotification({ message: 'Failed to load data from server', type: 'error' });
        
        // Fallback to localStorage for now
        const storedSites = getSitesFromStorage();
        setSites(storedSites);
        
        const storedContent = JSON.parse(localStorage.getItem('content_library') || '[]')
          .map((item: GeneratedContent) => ({...item, createdAt: new Date(item.createdAt)}));
        setContentLibrary(storedContent);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, user]);

  // Initialize language from localStorage on client side
  useEffect(() => {
    if (isClient) {
      const savedLanguage = localStorage.getItem('app_language') as LanguageCode
      if (savedLanguage) {
        setLanguage(savedLanguage)
      }
    }
  }, [isClient, setLanguage])

  useEffect(() => {
    // Only run on client side
    if (!isClient) return
    
    localStorage.setItem('app_language', language)
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = language
  }, [language, isClient])

  useEffect(() => {
    // Only run on client side
    if (!isClient) return
    
    // Persist content library to local storage whenever it changes, but only store non-synced items
    const localItems = contentLibrary.filter(item => item.origin !== 'synced')
    localStorage.setItem('content_library', JSON.stringify(localItems))
  }, [contentLibrary, isClient])

  const showNotification = (notif: NotificationType) => {
    setNotification(notif)
  }

  const addSite = async (newSite: WordPressSite) => {
    try {
      // Try to add via API first
      const { site: createdSite } = await siteService.createSite({
        url: newSite.url,
        name: newSite.name,
        isVirtual: newSite.isVirtual,
        username: newSite.username,
        appPassword: newSite.appPassword,
      });
      
      const updatedSites = [...sites, createdSite];
      setSites(updatedSites);
      saveSitesToStorage(updatedSites);
      showNotification({ message: t('siteAdded', { name: createdSite.name }), type: 'success' });
      
    } catch (error) {
      console.error('Failed to add site via API:', error);
      
      // Fallback to localStorage
      const updatedSites = [...sites, newSite];
      setSites(updatedSites);
      saveSitesToStorage(updatedSites);
      showNotification({ message: t('siteAdded', { name: newSite.name }), type: 'success' });
    }
  }

  const removeSite = async (siteId: string) => {
    try {
      // Try to remove via API first
      await siteService.deleteSite(siteId);
      
      const updatedSites = sites.filter(site => site.id !== siteId);
      setSites(updatedSites);
      saveSitesToStorage(updatedSites);
      showNotification({ message: t('siteRemoved'), type: 'info' });
      
    } catch (error) {
      console.error('Failed to remove site via API:', error);
      
      // Fallback to localStorage
      const updatedSites = sites.filter(site => site.id !== siteId);
      setSites(updatedSites);
      saveSitesToStorage(updatedSites);
      showNotification({ message: t('siteRemoved'), type: 'info' });
    }
  }

  const addToLibrary = useCallback((content: GeneratedContent) => {
    setContentLibrary(prevLibrary => [content, ...prevLibrary])
    showNotification({ message: t('contentSaved', { title: content.title }), type: 'success' })
  }, [t])
  
  const handleCampaignGenerated = useCallback((campaignResult: CampaignGenerationResult) => {
    const allNewArticles = [campaignResult.pillarPost, ...campaignResult.clusterPosts]
    setContentLibrary(prevLibrary => [...allNewArticles, ...prevLibrary])
    showNotification({ message: t('campaignGenerated'), type: 'success' })
  }, [t])

  const handleMultipleContentsGenerated = useCallback((contents: GeneratedContent[]) => {
    setContentLibrary(prevLibrary => [...contents, ...prevLibrary])
    const notificationMessage = t('multipleContentsGenerated', { count: contents.length })
    showNotification({ message: notificationMessage, type: 'success' })
  }, [t])

  const removeFromLibrary = (contentId: string) => {
    setContentLibrary(prev => prev.filter(item => item.id !== contentId))
  }

  const updateLibraryItem = (contentId: string, updates: Partial<GeneratedContent>) => {
    setContentLibrary(prev => prev.map(item => item.id === contentId ? { ...item, ...updates } as GeneratedContent : item))
  }
  
  const editFromLibrary = (content: ArticleContent) => {
    setEditingContent(content)
    setNewContentType(undefined) // Ensure we're in edit mode
    setInitialTitleForNewContent(undefined)
    setCurrentView(View.NewContent)
  }

  const createNew = (type: ContentType, title?: string) => {
    setNewContentType(type)
    setEditingContent(null)
    setInitialTitleForNewContent(title)
    setCurrentView(View.NewContent)
  }
  
  const scheduleAllUnscheduled = () => {
      const unscheduled = contentLibrary.filter(c => !c.scheduledFor)
      if (unscheduled.length === 0) {
          showNotification({ message: t('noUnscheduledItems'), type: 'info' })
          return
      }
      
      const today = new Date()
      const updatedLibrary = contentLibrary.map(item => {
          if (!item.scheduledFor) {
              const itemToSchedule = unscheduled.find(u => u.id === item.id)
              if (itemToSchedule) {
                  const index = unscheduled.indexOf(itemToSchedule)
                  const scheduledDate = new Date(today)
                  scheduledDate.setDate(today.getDate() + index + 1) // Start scheduling from tomorrow
                  return { ...item, scheduledFor: scheduledDate.toISOString() }
              }
          }
          return item
      })
      
      setContentLibrary(updatedLibrary)
      showNotification({ message: t('allItemsScheduled'), type: 'success' })
  }

  const navigateTo = (view: View) => {
      if (view !== View.NewContent && currentView === View.NewContent) {
        setEditingContent(null)
        setNewContentType(undefined)
        setInitialTitleForNewContent(undefined)
      }
      if (view !== View.SiteDetail) {
        setActiveSite(null)
      }
      setCurrentView(view)
    }

  const navigateToSiteDetail = (site: WordPressSite) => {
    setActiveSite(site)
    setCurrentView(View.SiteDetail)
  }
  
  const handleEditorExit = () => {
    // If we were on a site detail page before, go back there. Otherwise, go to library.
    const destination = activeSite ? View.SiteDetail : View.ContentLibrary
    navigateTo(destination)
    // After editing, a sync might be needed to get the latest version
    // loadAllContent(sites)
  }

  const renderView = () => {
    if (currentView === View.NewContent) {
        return (
            <ProtectedRoute requiredPermission="create_content">
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
            </ProtectedRoute>
        )
    }

    return (
       <div className="flex-1 overflow-y-auto">
        {(() => {
            switch (currentView) {
              case View.Dashboard:
                return (
                  <ProtectedRoute requiredPermission="view_dashboard">
                    <DashboardView 
                      sites={sites} 
                      onAddSite={addSite} 
                      onRemoveSite={removeSite} 
                      isLoading={isLoading} 
                      onManageSite={navigateToSiteDetail}
                      onNavigateToNewContent={createNew}
                      contentLibrary={contentLibrary}
                    />
                  </ProtectedRoute>
                )
              case View.ContentLibrary:
                return (
                  <ProtectedRoute requiredPermission="view_own_content">
                    <ContentLibraryView 
                      library={contentLibrary} 
                      sites={sites} 
                      onRemoveFromLibrary={removeFromLibrary} 
                      showNotification={showNotification} 
                      onEdit={editFromLibrary} 
                      onScheduleAll={scheduleAllUnscheduled} 
                      onUpdateLibraryItem={updateLibraryItem}
                    />
                  </ProtectedRoute>
                )
              case View.Calendar:
                return (
                  <ProtectedRoute requiredPermission="view_own_content">
                    <CalendarView 
                      library={contentLibrary} 
                      sites={sites} 
                      showNotification={showNotification} 
                      onUpdateLibraryItem={updateLibraryItem} 
                    />
                  </ProtectedRoute>
                )
              case View.Settings:
                  return (
                    <ProtectedRoute>
                      <SettingsView showNotification={showNotification} />
                    </ProtectedRoute>
                  )
              case View.SiteDetail:
                  return activeSite ? 
                    <ProtectedRoute requiredPermission="view_own_content">
                      <SiteDetailView site={activeSite} onEdit={editFromLibrary} onBack={() => navigateTo(View.Dashboard)} showNotification={showNotification} />
                    </ProtectedRoute> : 
                    <ProtectedRoute requiredPermission="view_dashboard">
                      <DashboardView sites={sites} onAddSite={addSite} onRemoveSite={removeSite} isLoading={isLoading} onManageSite={navigateToSiteDetail} onNavigateToNewContent={createNew} contentLibrary={contentLibrary} />
                    </ProtectedRoute>
              case View.UserManagement:
                  return (
                    <ProtectedRoute requiredPermission="manage_users">
                      <UserManagement />
                    </ProtectedRoute>
                  )
              case View.SubscriptionPlans:
                  return (
                    <ProtectedRoute>
                      <SubscriptionPlans />
                    </ProtectedRoute>
                  )
              default:
                return (
                  <ProtectedRoute requiredPermission="view_dashboard">
                    <DashboardView 
                      sites={sites} 
                      onAddSite={addSite} 
                      onRemoveSite={removeSite} 
                      isLoading={isLoading} 
                      onManageSite={navigateToSiteDetail}
                      onNavigateToNewContent={createNew}
                      contentLibrary={contentLibrary}
                    />
                  </ProtectedRoute>
                )
            }
        })()}
        </div>
    )
  }
  
  // Show loading state while authenticating
  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen bg-gray-900 text-gray-100 font-sans items-center justify-center">
        <div className="text-center">
          <Spinner />
          <p className="mt-4">Loading application...</p>
        </div>
      </div>
    )
  }

  // Show loading state until client is ready
  if (!isClient) {
    return (
      <div className="flex h-screen bg-gray-900 text-gray-100 font-sans items-center justify-center">
        <div className="text-center">
          <Spinner />
          <p className="mt-4">Loading application...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <Notification notification={notification} onClose={() => setNotification(null)} />
      {currentView !== View.NewContent && (
        <Sidebar 
          currentView={currentView} 
          setCurrentView={navigateTo} 
          onQuickAction={createNew}
          user={user}
          onLogout={logout}
        />
      )}
      <main className="flex-1 flex flex-col">
        {renderView()}
      </main>
    </div>
  )
}