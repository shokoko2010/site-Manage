"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    default: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: number
}

export function ResponsiveGrid({ 
  children, 
  className, 
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 4
}: ResponsiveGridProps) {
  const gridClasses = [
    `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    `gap-${gap}`
  ].filter(Boolean).join(' ')

  return (
    <div className={cn("grid", gridClasses, className)}>
      {children}
    </div>
  )
}

interface ResponsiveCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  clickable?: boolean
  onClick?: () => void
}

export function ResponsiveCard({ 
  children, 
  className, 
  hover = true, 
  clickable = false,
  onClick 
}: ResponsiveCardProps) {
  return (
    <Card 
      className={cn(
        "transition-all duration-200",
        hover && "hover:shadow-lg hover:-translate-y-1",
        clickable && "cursor-pointer",
        className
      )}
      onClick={clickable ? onClick : undefined}
    >
      {children}
    </Card>
  )
}

interface ResponsiveStatCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: "positive" | "negative"
  icon?: React.ReactNode
  className?: string
}

export function ResponsiveStatCard({ 
  title, 
  value, 
  change, 
  changeType = "positive",
  icon,
  className 
}: ResponsiveStatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <p className={`text-xs flex items-center ${
                changeType === "positive" ? "text-green-600" : "text-red-600"
              }`}>
                {changeType === "positive" ? "↑" : "↓"} {change}
              </p>
            )}
          </div>
          {icon && (
            <div className="h-8 w-8 text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface ResponsiveListProps {
  items: React.ReactNode[]
  className?: string
  spacing?: "sm" | "md" | "lg"
  divided?: boolean
}

export function ResponsiveList({ 
  items, 
  className, 
  spacing = "md",
  divided = false 
}: ResponsiveListProps) {
  const spacingClasses = {
    sm: "space-y-2",
    md: "space-y-3", 
    lg: "space-y-4"
  }

  return (
    <div className={cn(spacingClasses[spacing], className)}>
      {items.map((item, index) => (
        <div key={index}>
          {item}
          {divided && index < items.length - 1 && (
            <div className="border-t border-border mt-2 pt-2" />
          )}
        </div>
      ))}
    </div>
  )
}

interface ResponsiveSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  actions?: React.ReactNode
}

export function ResponsiveSection({ 
  title, 
  description, 
  children, 
  className,
  actions 
}: ResponsiveSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
      {children}
    </section>
  )
}

// Mobile-first responsive utilities
export const Responsive = {
  // Visibility utilities
  Hidden: ({ children, breakpoint = "md" }: { children: React.ReactNode; breakpoint?: "sm" | "md" | "lg" | "xl" }) => (
    <div className={`hidden ${breakpoint}:block`}>
      {children}
    </div>
  ),
  
  MobileOnly: ({ children }: { children: React.ReactNode }) => (
    <div className="md:hidden">
      {children}
    </div>
  ),
  
  DesktopOnly: ({ children }: { children: React.ReactNode }) => (
    <div className="hidden md:block">
      {children}
    </div>
  ),
  
  // Layout utilities
  Flex: ({ 
    children, 
    direction = "row", 
    wrap = false,
    justify = "start", 
    align = "stretch",
    gap = 4,
    className 
  }: {
    children: React.ReactNode
    direction?: "row" | "col"
    wrap?: boolean
    justify?: "start" | "end" | "center" | "between" | "around" | "evenly"
    align?: "start" | "end" | "center" | "stretch" | "baseline"
    gap?: number
    className?: string
  }) => (
    <div className={cn(
      "flex",
      `flex-${direction}`,
      wrap && "flex-wrap",
      `justify-${justify}`,
      `items-${align}`,
      `gap-${gap}`,
      className
    )}>
      {children}
    </div>
  ),
  
  Grid: ResponsiveGrid,
  Card: ResponsiveCard,
  StatCard: ResponsiveStatCard,
  List: ResponsiveList,
  Section: ResponsiveSection
}