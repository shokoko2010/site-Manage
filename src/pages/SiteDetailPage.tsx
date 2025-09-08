import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SiteDetailView from '../components/SiteDetailView'
import { useAuth } from '../contexts/AuthContext'
import { siteService } from '../services/apiService'
import { WordPressSite } from '../types/types'
import { useOutletContext } from 'react-router-dom'

interface SiteDetailPageProps {}

interface OutletContext {
  showNotification: (notification: { message: string; type: 'success' | 'error' | 'info' }) => void
}

export const SiteDetailPage: React.FC<SiteDetailPageProps> = () => {
  const { siteId } = useParams<{ siteId: string }>()
  const navigate = useNavigate()
  const { showNotification } = useOutletContext<OutletContext>()
  const { user, isAuthenticated } = useAuth()
  
  const [site, setSite] = useState<WordPressSite | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSite = async () => {
      if (!siteId || !isAuthenticated || !user) return;

      try {
        setLoading(true)
        const { site: apiSite } = await siteService.getSite(siteId)
        setSite(apiSite)
      } catch (error) {
        console.error('Failed to load site:', error)
        showNotification({ message: 'Failed to load site details', type: 'error' })
        navigate('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadSite()
  }, [siteId, isAuthenticated, user, showNotification, navigate])

  const editFromLibrary = (content: any) => {
    navigate(`/content/edit/${content.id}`)
  }

  const onBack = () => {
    navigate('/dashboard')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!site) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Site Not Found</h1>
          <p className="text-gray-600 mb-4">The requested site could not be found.</p>
          <button 
            onClick={onBack}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <SiteDetailView 
        site={site} 
        onEdit={editFromLibrary} 
        onBack={onBack} 
        showNotification={showNotification} 
      />
    </div>
  )
}