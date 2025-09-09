"use client"

import * as React from "react"
import { ModernSidebar } from "./modern-sidebar"
import { ModernHeader } from "./modern-header"

interface ModernLayoutProps {
  children: React.ReactNode
  title: string
  user?: {
    name: string
    email: string
    plan: string
  }
  onLogout?: () => void
  notificationCount?: number
}

export function ModernLayout({ 
  children, 
  title, 
  user, 
  onLogout, 
  notificationCount 
}: ModernLayoutProps) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <ModernSidebar user={user} onLogout={onLogout} />
      <div className="flex flex-col">
        <ModernHeader 
          title={title} 
          user={user} 
          notificationCount={notificationCount} 
        />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}