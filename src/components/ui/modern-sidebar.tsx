"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const navigation = [
  { name: "Appboard", href: "/appboard", icon: "📊" },
  { name: "Content Library", href: "/content", icon: "📚" },
  { name: "Calendar", href: "/calendar", icon: "📅" },
  { name: "Settings", href: "/settings", icon: "⚙️" },
]

interface ModernSidebarProps {
  user?: {
    name: string
    email: string
    plan: string
  }
  onLogout?: () => void
}

export function ModernSidebar({ user, onLogout }: ModernSidebarProps) {
  const pathname = usePathname()

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="">Zex-Content</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navigation.map((item) => {
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
                  <span className="text-lg">{item.icon}</span>
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
                🚪 Logout
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}