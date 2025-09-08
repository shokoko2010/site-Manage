import React, { useEffect, useState } from 'react'
import CalendarView from '../components/CalendarView'
import { useAuth } from '../contexts/AuthContext'
import { contentService } from '../services/apiService'
import { GeneratedContent } from '../types/types'
import { useOutletContext } from 'react-router-dom'

interface CalendarPageProps {}

interface OutletContext {
  showNotification: (notification: { message: string; type: 'success' | 'error' | 'info' }) => void
}

export const CalendarPage: React.FC<CalendarPageProps> = () => {
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

  const updateLibraryItem = (contentId: string, updates: Partial<GeneratedContent>) => {
    setContentLibrary(prev => prev.map(item => item.id === contentId ? { ...item, ...updates } as GeneratedContent : item))
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <CalendarView 
        library={contentLibrary} 
        sites={sites} 
        showNotification={showNotification} 
        onUpdateLibraryItem={updateLibraryItem} 
      />
    </div>
  )
}