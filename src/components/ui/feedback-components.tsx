"use client"

import * as React from "react"
import { Loader2, AlertCircle, CheckCircle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      {text && <span className="ml-2 text-sm text-muted-foreground">{text}</span>}
    </div>
  )
}

interface LoadingCardProps {
  title?: string
  lines?: number
  className?: string
}

export function LoadingCard({ title, lines = 3, className }: LoadingCardProps) {
  return (
    <div className={cn("p-6 space-y-4", className)}>
      {title && (
        <div className="h-6 bg-muted rounded animate-pulse w-1/3"></div>
      )}
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className="h-4 bg-muted rounded animate-pulse" 
          style={{ width: `${Math.random() * 40 + 60}%` }}
        ></div>
      ))}
    </div>
  )
}

interface LoadingPageProps {
  message?: string
}

export function LoadingPage({ message = "Loading..." }: LoadingPageProps) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-lg text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

interface ErrorAlertProps {
  title: string
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorAlert({ title, message, onRetry, className }: ErrorAlertProps) {
  return (
    <div className={cn("border border-destructive/50 bg-destructive/5 p-4 rounded-lg", className)}>
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <h4 className="font-semibold text-destructive">{title}</h4>
          <p className="text-sm text-muted-foreground">{message}</p>
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="mt-2"
            >
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

interface ErrorPageProps {
  title?: string
  message?: string
  onRetry?: () => void
  showHomeButton?: boolean
}

export function ErrorPage({ 
  title = "Something went wrong", 
  message = "An unexpected error occurred. Please try again.",
  onRetry,
  showHomeButton = true
}: ErrorPageProps) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-md">
        <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground mb-6">{message}</p>
        <div className="flex justify-center space-x-3">
          {onRetry && (
            <Button onClick={onRetry}>
              Try Again
            </Button>
          )}
          {showHomeButton && (
            <Button variant="outline" onClick={() => window.location.href = "/"}>
              Go Home
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

interface ToastProps {
  message: string
  type?: "success" | "error" | "info" | "warning"
  duration?: number
  onClose?: () => void
}

export function Toast({ message, type = "info", duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(true)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose?.(), 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  const typeConfig = {
    success: {
      icon: CheckCircle,
      className: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200"
    },
    error: {
      icon: AlertCircle,
      className: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200"
    },
    warning: {
      icon: AlertCircle,
      className: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200"
    },
    info: {
      icon: Info,
      className: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200"
    }
  }

  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 p-4 rounded-lg border shadow-lg max-w-sm animate-in slide-in-from-top-2",
      config.className
    )}>
      <div className="flex items-start space-x-3">
        <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => onClose?.(), 300)
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Array<{
    id: string
    message: string
    type?: "success" | "error" | "info" | "warning"
  }>
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  )
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <ErrorPage 
          title="Something went wrong"
          message={this.state.error?.message || "An unexpected error occurred."}
          onRetry={() => this.setState({ hasError: false })}
        />
      )
    }

    return this.props.children
  }
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = React.useState<Array<{
    id: string
    message: string
    type?: "success" | "error" | "info" | "warning"
  }>>([])

  const addToast = React.useCallback((message: string, type: "success" | "error" | "info" | "warning" = "info") => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const toast = React.useMemo(() => ({
    success: (message: string) => addToast(message, "success"),
    error: (message: string) => addToast(message, "error"),
    info: (message: string) => addToast(message, "info"),
    warning: (message: string) => addToast(message, "warning"),
  }), [addToast])

  return {
    toasts,
    removeToast,
    toast
  }
}