import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Notification from '../components/Notification'
import { useAuth } from '../contexts/AuthContext'
import Spinner from '../components/common/Spinner'

interface AuthenticatedLayoutProps {
  children?: React.ReactNode
}

export const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = () => {
  const { user, logout, loading, isAuthenticated } = useAuth()
  const [notification, setNotification] = React.useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Show loading state while authenticating
  if (loading || !isAuthenticated) {
    return (
      <div className="flex h-screen bg-gray-900 text-gray-100 font-sans items-center justify-center">
        <div className="text-center">
          <Spinner />
          <p className="mt-4">Loading application...</p>
        </div>
      </div>
    )
  }

  const showNotification = (notif: { message: string; type: 'success' | 'error' | 'info' }) => {
    setNotification(notif)
  }

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <Notification 
        notification={notification} 
        onClose={() => setNotification(null)} 
      />
      <Sidebar 
        user={user}
        onLogout={logout}
        showNotification={showNotification}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet context={{ showNotification }} />
      </main>
    </div>
  )
}