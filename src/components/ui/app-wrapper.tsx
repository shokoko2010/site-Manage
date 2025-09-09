"use client"

import * as React from "react"
import { ModernLayout } from "./modern-layout"
import { LoadingPage, ErrorPage, ToastContainer, useToast } from "./feedback-components"
import { ErrorBoundary } from "./feedback-components"

interface AppWrapperProps {
  children: React.ReactNode
  title: string
  user?: {
    name: string
    email: string
    plan: string
  }
  onLogout?: () => void
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

export function AppWrapper({ 
  children, 
  title, 
  user, 
  onLogout, 
  loading = false, 
  error = null,
  onRetry
}: AppWrapperProps) {
  const { toasts, removeToast } = useToast()

  if (loading) {
    return <LoadingPage message="Loading application..." />
  }

  if (error) {
    return <ErrorPage title="Application Error" message={error} onRetry={onRetry} />
  }

  return (
    <ErrorBoundary>
      <ModernLayout 
        title={title}
        user={user}
        onLogout={onLogout}
        notificationCount={3}
      >
        {children}
      </ModernLayout>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ErrorBoundary>
  )
}

// Higher-order component for adding loading states
export function withLoading<P extends object>(
  Component: React.ComponentType<P>,
  loadingProp: keyof P = "loading"
) {
  return function WithLoading(props: P) {
    const [isLoading, setIsLoading] = React.useState(false)

    const handleAction = React.useCallback(async (action: () => Promise<any>) => {
      setIsLoading(true)
      try {
        await action()
      } catch (error) {
        console.error("Action failed:", error)
        throw error
      } finally {
        setIsLoading(false)
      }
    }, [])

    return (
      <Component 
        {...props} 
        {...{ [loadingProp]: isLoading } as any}
        onAction={handleAction}
      />
    )
  }
}

// Hook for async operations with loading states
export function useAsyncOperation<T = any>() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const { toast } = useToast()

  const execute = React.useCallback(async (
    operation: () => Promise<T>,
    successMessage?: string,
    errorMessage = "Operation failed"
  ) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await operation()
      if (successMessage) {
        toast.success(successMessage)
      }
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : errorMessage
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  return {
    isLoading,
    error,
    execute,
    clearError: () => setError(null)
  }
}