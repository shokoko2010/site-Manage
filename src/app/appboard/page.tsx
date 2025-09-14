'use client';

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppboardView from '@/components/AppboardView'
import { useAuth } from '@/contexts/AuthContext'
import { siteService, contentService } from '@/services/apiService'
import { WordPressSite, GeneratedContent, ContentType } from '@/types/types'

export default function AppboardPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  
  const [sites, setSites] = useState<WordPressSite[]>([])
  const [contentLibrary, setContentLibrary] = useState<GeneratedContent[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Simple notification function
  const showNotification = (notification: { message: string; type: 'success' | 'error' | 'info' }) => {
    console.log(`Notification: ${notification.message} (${notification.type})`)
  }

  // Load sites and content from API
  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated || !user) return;

      try {
        setIsLoading(true);
        
        // Load sites from API
        const { sites: apiSites } = await siteService.getSites();
        // Transform string dates to Date objects
        const transformedSites = apiSites.map(site => ({
          ...site,
          createdAt: new Date(site.createdAt),
          updatedAt: new Date(site.updatedAt),
          lastSyncedAt: site.lastSyncedAt ? new Date(site.lastSyncedAt) : undefined
        }));
        setSites(transformedSites);

        // Load content from API
        const { content: apiContent } = await contentService.getContent();
        // Transform string dates to Date objects for content
        const transformedContent = apiContent.map(content => ({
          ...content,
          createdAt: new Date(content.createdAt),
          updatedAt: new Date(content.updatedAt),
          publishedAt: content.publishedAt ? new Date(content.publishedAt) : undefined,
          scheduledFor: content.scheduledFor ? new Date(content.scheduledFor) : undefined
        }));
        setContentLibrary(transformedContent as GeneratedContent[]);
        
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
  }, [isAuthenticated, user]);

  const addSite = async (newSite: any) => {
    try {
      const { site: createdSite } = await siteService.createSite({
        url: newSite.url,
        name: newSite.name,
        isVirtual: newSite.isVirtual,
        username: newSite.username,
        appPassword: newSite.appPassword,
      });
      
      const updatedSites = [...sites, {
        ...createdSite,
        createdAt: new Date(createdSite.createdAt),
        updatedAt: new Date(createdSite.updatedAt),
        lastSyncedAt: createdSite.lastSyncedAt ? new Date(createdSite.lastSyncedAt) : undefined
      }];
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

  const navigateToSiteDetail = (siteId: string) => {
    router.push(`/sites/${siteId}`)
  }

  const navigateToNewContent = (type: ContentType, title?: string) => {
    if (title) {
      router.push(`/content/new/${type}?title=${encodeURIComponent(title)}`)
    } else {
      router.push(`/content/new/${type}`)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <AppboardView 
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