"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Menu,
  X,
  Home,
  FileText,
  Calendar,
  Settings,
  User,
  Bell,
  Search,
  Plus,
  ChevronDown,
  LogOut
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home, mobileOnly: false },
  { name: "Content Library", href: "/content", icon: FileText, mobileOnly: false },
  { name: "Calendar", href: "/calendar", icon: Calendar, mobileOnly: false },
  { name: "Settings", href: "/settings", icon: Settings, mobileOnly: true },
]

interface MobileNavProps {
  user?: {
    name: string
    email: string
    plan: string
  }
  onLogout?: () => void
  isOpen: boolean
  onClose: () => void
}

function MobileNav({ user, onLogout, isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden">
      <div className="fixed inset-y-0 left-0 z-50 w-full max-w-xs bg-background shadow-lg">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="">Zex-Content</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-8 w-8 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="grid gap-2 p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    isActive && "bg-muted text-primary"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
            
            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Quick Actions</h3>
              <div className="grid gap-2">
                <Button variant="outline" className="justify-start" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Article
                </Button>
                <Button variant="outline" className="justify-start" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Product
                </Button>
              </div>
            </div>
          </nav>
        </div>
        
        {user && (
          <div className="border-t p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <Badge variant="secondary" className="mt-1">
                  {user.plan}
                </Badge>
              </div>
            </div>
            {onLogout && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={onLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface MobileHeaderProps {
  title: string
  onMenuClick: () => void
  notificationCount?: number
}

function MobileHeader({ title, onMenuClick, notificationCount = 0 }: MobileHeaderProps) {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:hidden">
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onMenuClick}>
        <Menu className="h-4 w-4" />
      </Button>
      <div className="flex-1">
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative">
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {notificationCount}
            </Badge>
          )}
        </Button>
      </div>
    </header>
  )
}

interface ResponsiveLayoutProps {
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

export function ResponsiveLayout({ 
  children, 
  title, 
  user, 
  onLogout, 
  notificationCount 
}: ResponsiveLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Navigation */}
      <MobileNav
        user={user}
        onLogout={onLogout}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      
      {/* Mobile Header */}
      <MobileHeader
        title={title}
        onMenuClick={() => setIsMobileMenuOpen(true)}
        notificationCount={notificationCount}
      />
      
      {/* Desktop Layout */}
      <div className="hidden md:grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        {/* Desktop Sidebar */}
        <div className="hidden border-r bg-muted/40 md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <span className="">Zex-Content</span>
              </Link>
            </div>
            <div className="flex-1">
              <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                {navigation
                  .filter(item => !item.mobileOnly)
                  .map((item) => {
                    const pathname = usePathname()
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                          isActive && "bg-muted text-primary"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </Link>
                    )
                  })}
              </nav>
            </div>
            {user && (
              <div className="mt-auto p-4">
                <div className="flex items-center gap-3 rounded-lg bg-accent p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <Badge variant="secondary" className="mt-1">
                      {user.plan}
                    </Badge>
                  </div>
                </div>
                {onLogout && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full justify-start"
                    onClick={onLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Desktop Header and Content */}
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
            <div className="w-full flex-1">
              <h1 className="text-lg font-semibold md:text-2xl">{title}</h1>
            </div>
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search..."
                  className="w-64 rounded-lg bg-background pl-8 md:w-80 lg:w-96 border border-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              
              {/* Notifications */}
              <Button variant="outline" size="icon" className="ml-auto h-8 w-8 relative">
                <Bell className="h-4 w-4" />
                {notificationCount && notificationCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {notificationCount}
                  </Badge>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
              
              {/* User */}
              {user && (
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <User className="h-4 w-4" />
                  <span className="sr-only">User menu</span>
                </Button>
              )}
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            {children}
          </main>
        </div>
      </div>
      
      {/* Mobile Content */}
      <main className="flex-1 md:hidden">
        <div className="flex flex-col gap-4 p-4">
          {children}
        </div>
      </main>
    </div>
  )
}