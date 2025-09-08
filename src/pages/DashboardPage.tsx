import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import DashboardView from '../components/DashboardView'
import { useAuth } from '../contexts/AuthContext'
import { siteService, contentService } from '../services/apiService'
import { WordPressSite, GeneratedContent, ContentType } from '../types/types'
import { useOutletContext } from 'react-router-dom'

interface DashboardPageProps {}

interface OutletContext {
  showNotification: (notification: { message: string; type: 'success' | 'error' | 'info' }) => void
}

export const DashboardPage: React.FC<DashboardPageProps> = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { showNotification } = useOutletContext<OutletContext>()
  const { user, isAuthenticated } = useAuth()
  
  const [sites, setSites] = useState<WordPressSite[]>([])
  const [contentLibrary, setContentLibrary] = useState<GeneratedContent[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

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
        showNotification({ message: 'Failed to load data from server', type: 'error' });
        
        // Fallback to localStorage for now
        const storedSites = JSON.parse(localStorage.getItem('wordpress_sites') || '[]')
        setSites(storedSites);
        
        const storedContent = JSON.parse(localStorage.getItem('content_library') || '[]')
          .map((item: GeneratedContent) => ({...item, createdAt: new Date(item.createdAt)}));
        setContentLibrary(storedContent);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, user, showNotification]);

  const addSite = async (newSite: WordPressSite) => {
    try {
      const { site: createdSite } = await siteService.createSite({
        url: newSite.url,
        name: newSite.name,
        isVirtual: newSite.isVirtual,
        username: newSite.username,
        appPassword: newSite.appPassword,
      });
      
      const updatedSites = [...sites, createdSite];
      setSites(updatedSites);
      localStorage.setItem('wordpress_sites', JSON.stringify(updatedSites));
      showNotification({ message: `Site "${createdSite.name}" added successfully`, type: 'success' });
      
    } catch (error) {
      console.error('Failed to add site via API:', error);
      
      // Fallback to localStorage
      const updatedSites = [...sites, newSite];
      setSites(updatedSites);
      localStorage.setItem('wordpress_sites', JSON.stringify(updatedSites));
      showNotification({ message: `Site "${newSite.name}" added successfully`, type: 'success' });
    }
  }

  const removeSite = async (siteId: string) => {
    try {
      await siteService.deleteSite(siteId);
      
      const updatedSites = sites.filter(site => site.id !== siteId);
      setSites(updatedSites);
      localStorage.setItem('wordpress_sites', JSON.stringify(updatedSites));
      showNotification({ message: 'Site removed successfully', type: 'info' });
      
    } catch (error) {
      console.error('Failed to remove site via API:', error);
      
      // Fallback to localStorage
      const updatedSites = sites.filter(site => site.id !== siteId);
      setSites(updatedSites);
      localStorage.setItem('wordpress_sites', JSON.stringify(updatedSites));
      showNotification({ message: 'Site removed successfully', type: 'info' });
    }
  }

  const navigateToSiteDetail = (site: WordPressSite) => {
    navigate(`/sites/${site.id}`)
  }

  const navigateToNewContent = (type: ContentType, title?: string) => {
    if (title) {
      navigate(`/content/new/${type}?title=${encodeURIComponent(title)}`)
    } else {
      navigate(`/content/new/${type}`)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <DashboardView 
        sites={sites} 
        onAddSite={addSite} 
        onRemoveSite={removeSite} 
        isLoading={isLoading} 
        onManageSite={navigateToSiteDetail}
        onNavigateToNewContent={navigateToNewContent}
        contentLibrary={contentLibrary}
      />
    </div>
  )
}