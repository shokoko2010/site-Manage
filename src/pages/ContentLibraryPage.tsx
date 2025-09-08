import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ContentLibraryView from '../components/ContentLibraryView'
import { useAuth } from '../contexts/AuthContext'
import { contentService } from '../services/apiService'
import { GeneratedContent } from '../types/types'
import { useOutletContext } from 'react-router-dom'

interface ContentLibraryPageProps {}

interface OutletContext {
  showNotification: (notification: { message: string; type: 'success' | 'error' | 'info' }) => void
}

export const ContentLibraryPage: React.FC<ContentLibraryPageProps> = () => {
  const navigate = useNavigate()
  const { showNotification } = useOutletContext<OutletContext>()
  const { user, isAuthenticated } = useAuth()
  
  const [contentLibrary, setContentLibrary] = useState<GeneratedContent[]>([])
  const [sites, setSites] = useState<any[]>([])

  // Load content from API
  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated || !user) return;

      try {
        // Load content from API
        const { content: apiContent } = await contentService.getContent();
        setContentLibrary(apiContent as GeneratedContent[]);
        
        // Load sites for site selection
        const { sites: apiSites } = await siteService.getSites();
        setSites(apiSites);
        
      } catch (error) {
        console.error('Failed to load data:', error);
        showNotification({ message: 'Failed to load data from server', type: 'error' });
        
        // Fallback to localStorage
        const storedContent = JSON.parse(localStorage.getItem('content_library') || '[]')
          .map((item: GeneratedContent) => ({...item, createdAt: new Date(item.createdAt)}));
        setContentLibrary(storedContent);
        
        const storedSites = JSON.parse(localStorage.getItem('wordpress_sites') || '[]')
        setSites(storedSites);
      }
    };

    loadData();
  }, [isAuthenticated, user, showNotification]);

  const removeFromLibrary = (contentId: string) => {
    setContentLibrary(prev => prev.filter(item => item.id !== contentId))
    showNotification({ message: 'Content removed from library', type: 'info' })
  }

  const editFromLibrary = (content: any) => {
    navigate(`/content/edit/${content.id}`)
  }

  const updateLibraryItem = (contentId: string, updates: Partial<GeneratedContent>) => {
    setContentLibrary(prev => prev.map(item => item.id === contentId ? { ...item, ...updates } as GeneratedContent : item))
  }

  const scheduleAllUnscheduled = () => {
    const unscheduled = contentLibrary.filter(c => !c.scheduledFor)
    if (unscheduled.length === 0) {
      showNotification({ message: 'No unscheduled items found', type: 'info' })
      return
    }
    
    const today = new Date()
    const updatedLibrary = contentLibrary.map(item => {
      if (!item.scheduledFor) {
        const itemToSchedule = unscheduled.find(u => u.id === item.id)
        if (itemToSchedule) {
          const index = unscheduled.indexOf(itemToSchedule)
          const scheduledDate = new Date(today)
          scheduledDate.setDate(today.getDate() + index + 1)
          return { ...item, scheduledFor: scheduledDate.toISOString() }
        }
      }
      return item
    })
    
    setContentLibrary(updatedLibrary)
    showNotification({ message: 'All items scheduled successfully', type: 'success' })
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <ContentLibraryView 
        library={contentLibrary} 
        sites={sites} 
        onRemoveFromLibrary={removeFromLibrary} 
        showNotification={showNotification} 
        onEdit={editFromLibrary} 
        onScheduleAll={scheduleAllUnscheduled} 
        onUpdateLibraryItem={updateLibraryItem}
      />
    </div>
  )
}