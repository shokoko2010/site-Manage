import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import NewContentView from '../components/NewContentView'
import { useAuth } from '../contexts/AuthContext'
import { siteService, contentService } from '../services/apiService'
import { WordPressSite, GeneratedContent, ContentType, CampaignGenerationResult, ArticleContent } from '../types/types'
import { useOutletContext } from 'react-router-dom'

interface NewContentPageProps {}

interface OutletContext {
  showNotification: (notification: { message: string; type: 'success' | 'error' | 'info' }) => void
}

export const NewContentPage: React.FC<NewContentPageProps> = () => {
  const { type, contentId } = useParams<{ type?: string; contentId?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { showNotification } = useOutletContext<OutletContext>()
  const { user, isAuthenticated } = useAuth()
  
  const [sites, setSites] = useState<WordPressSite[]>([])
  const [editingContent, setEditingContent] = useState<ArticleContent | null>(null)
  const [newContentType, setNewContentType] = useState<ContentType | undefined>(undefined)
  const [initialTitleForNewContent, setInitialTitleForNewContent] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  // Parse URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const titleParam = searchParams.get('title')
    if (titleParam) {
      setInitialTitleForNewContent(decodeURIComponent(titleParam))
    }
  }, [location.search])

  // Load sites and editing content
  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated || !user) return;

      try {
        setLoading(true)
        
        // Load sites from API
        const { sites: apiSites } = await siteService.getSites();
        setSites(apiSites);

        // Determine content type from URL or set default
        if (type) {
          const contentType = type.toUpperCase() as ContentType
          if (Object.values(ContentType).includes(contentType)) {
            setNewContentType(contentType)
          }
        }

        // Load content for editing if contentId is provided
        if (contentId) {
          const { content: apiContent } = await contentService.getContentById(contentId);
          setEditingContent(apiContent as ArticleContent);
        }
        
      } catch (error) {
        console.error('Failed to load data:', error);
        showNotification({ message: 'Failed to load data from server', type: 'error' });
        
        // Fallback to localStorage
        const storedSites = JSON.parse(localStorage.getItem('wordpress_sites') || '[]')
        setSites(storedSites);
        
        if (contentId) {
          const storedContent = JSON.parse(localStorage.getItem('content_library') || '[]')
          const content = storedContent.find((item: GeneratedContent) => item.id === contentId)
          if (content) {
            setEditingContent(content as ArticleContent)
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, user, type, contentId, showNotification]);

  const addToLibrary = (content: GeneratedContent) => {
    // Get existing content from localStorage
    const existingContent = JSON.parse(localStorage.getItem('content_library') || '[]')
    const updatedContent = [content, ...existingContent]
    localStorage.setItem('content_library', JSON.stringify(updatedContent))
    showNotification({ message: `Content "${content.title}" saved to library`, type: 'success' })
  }

  const handleCampaignGenerated = (campaignResult: CampaignGenerationResult) => {
    const allNewArticles = [campaignResult.pillarPost, ...campaignResult.clusterPosts]
    const existingContent = JSON.parse(localStorage.getItem('content_library') || '[]')
    const updatedContent = [...allNewArticles, ...existingContent]
    localStorage.setItem('content_library', JSON.stringify(updatedContent))
    showNotification({ message: 'Campaign generated successfully', type: 'success' })
  }

  const handleMultipleContentsGenerated = (contents: GeneratedContent[]) => {
    const existingContent = JSON.parse(localStorage.getItem('content_library') || '[]')
    const updatedContent = [...contents, ...existingContent]
    localStorage.setItem('content_library', JSON.stringify(updatedContent))
    const notificationMessage = `${contents.length} content items generated successfully`
    showNotification({ message: notificationMessage, type: 'success' })
  }

  const handleEditorExit = () => {
    navigate('/content')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
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
    </div>
  )
}