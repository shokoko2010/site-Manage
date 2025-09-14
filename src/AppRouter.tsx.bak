import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { AuthPage } from './components/auth/AuthPage'

// Layout Components
import { AuthenticatedLayout } from './layouts/AuthenticatedLayout'
import { PublicLayout } from './layouts/PublicLayout'

// Page Components
import { AppboardPage } from './pages/AppboardPage'
import { ContentLibraryPage } from './pages/ContentLibraryPage'
import { CalendarPage } from './pages/CalendarPage'
import { SettingsPage } from './pages/SettingsPage'
import { SiteDetailPage } from './pages/SiteDetailPage'
import { UserManagementPage } from './pages/UserManagementPage'
import { SubscriptionPlansPage } from './pages/SubscriptionPlansPage'
import { NewContentPage } from './pages/NewContentPage'
import { NotFoundPage } from './pages/NotFoundPage'

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPermission }) => {
  const { user, loading, isAuthenticated, hasPermission } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Public Route Component (only accessible when not authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/appboard" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <PublicLayout>
            <AuthPage />
          </PublicLayout>
        </PublicRoute>
      } />
      
      <Route path="/register" element={
        <PublicRoute>
          <PublicLayout>
            <AuthPage />
          </PublicLayout>
        </PublicRoute>
      } />

      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <AuthenticatedLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/appboard" replace />} />
        
        <Route path="appboard" element={
          <ProtectedRoute requiredPermission="view_appboard">
            <AppboardPage />
          </ProtectedRoute>
        } />
        
        <Route path="content" element={
          <ProtectedRoute requiredPermission="view_own_content">
            <ContentLibraryPage />
          </ProtectedRoute>
        } />
        
        <Route path="calendar" element={
          <ProtectedRoute requiredPermission="view_own_content">
            <CalendarPage />
          </ProtectedRoute>
        } />
        
        <Route path="settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        
        <Route path="sites/:siteId" element={
          <ProtectedRoute requiredPermission="view_own_content">
            <SiteDetailPage />
          </ProtectedRoute>
        } />
        
        <Route path="users" element={
          <ProtectedRoute requiredPermission="manage_users">
            <UserManagementPage />
          </ProtectedRoute>
        } />
        
        <Route path="subscription" element={
          <ProtectedRoute>
            <SubscriptionPlansPage />
          </ProtectedRoute>
        } />
        
        <Route path="content/new" element={
          <ProtectedRoute requiredPermission="create_content">
            <NewContentPage />
          </ProtectedRoute>
        } />
        
        <Route path="content/new/:type" element={
          <ProtectedRoute requiredPermission="create_content">
            <NewContentPage />
          </ProtectedRoute>
        } />
        
        <Route path="content/edit/:contentId" element={
          <ProtectedRoute requiredPermission="edit_own_content">
            <NewContentPage />
          </ProtectedRoute>
        } />
      </Route>

      {/* 404 Page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function AppRouter() {
  return (
    <Router future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}>
      <AuthProvider>
        <LanguageProvider>
          <AppRoutes />
        </LanguageProvider>
      </AuthProvider>
    </Router>
  )
}