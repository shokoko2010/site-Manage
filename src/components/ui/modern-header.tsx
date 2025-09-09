"use client"

import * as React from "react"
import { Bell, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"

interface ModernHeaderProps {
  title: string
  user?: {
    name: string
    email: string
  }
  notificationCount?: number
}

export function ModernHeader({ title, user, notificationCount = 0 }: ModernHeaderProps) {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <div className="w-full flex-1">
        <h1 className="text-lg font-semibold md:text-2xl">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-64 rounded-lg bg-background pl-8 md:w-80 lg:w-96"
          />
        </div>
        
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {/* Notifications */}
        <Button variant="outline" size="icon" className="ml-auto h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
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
  )
}