"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Globe, 
  FileText, 
  Calendar, 
  TrendingUp, 
  Users, 
  Plus,
  ArrowRight,
  Clock,
  Eye,
  MessageSquare,
  BarChart3,
  Target,
  Zap
} from "lucide-react"

interface Site {
  id: string
  name: string
  url: string
  status: "active" | "inactive"
  posts: number
  lastUpdated: string
}

interface ContentItem {
  id: string
  title: string
  type: "article" | "product" | "campaign"
  status: "draft" | "published" | "scheduled"
  createdAt: string
  views?: number
  comments?: number
}

interface ModernAppboardProps {
  sites: Site[]
  content: ContentItem[]
  onCreateContent: (type: "article" | "product" | "campaign") => void
  onAddSite: () => void
}

function SiteCard({ site, onManage }: { site: Site; onManage: (site: Site) => void }) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onManage(site)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{site.name}</CardTitle>
          </div>
          <Badge variant={site.status === "active" ? "default" : "secondary"}>
            {site.status}
          </Badge>
        </div>
        <CardDescription className="text-sm">{site.url}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>{site.posts} posts</span>
          <span>Updated {site.lastUpdated}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickActionButton({ 
  icon: Icon, 
  label, 
  onClick, 
  variant = "default" 
}: { 
  icon: React.ElementType
  label: string
  onClick: () => void
  variant?: "default" | "secondary"
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-6 text-center">
        <Icon className="h-8 w-8 mx-auto mb-3 text-primary" />
        <h3 className="font-semibold mb-1">{label}</h3>
        <p className="text-xs text-muted-foreground">Create new content</p>
      </CardContent>
    </Card>
  )
}

function ActivityItem({ item }: { item: ContentItem }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-100 text-green-800"
      case "scheduled": return "bg-blue-100 text-blue-800"
      case "draft": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "article": return FileText
      case "product": return Target
      case "campaign": return Zap
      default: return FileText
    }
  }

  const Icon = getTypeIcon(item.type)

  return (
    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-shrink-0">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
        <div className="flex items-center space-x-2 mt-1">
          <Badge variant="outline" className={getStatusColor(item.status)}>
            {item.status}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      {item.views !== undefined && (
        <div className="flex items-center space-x-3 text-xs text-muted-foreground">
          <span className="flex items-center">
            <Eye className="h-3 w-3 mr-1" />
            {item.views}
          </span>
          <span className="flex items-center">
            <MessageSquare className="h-3 w-3 mr-1" />
            {item.comments}
          </span>
        </div>
      )}
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  change, 
  icon: Icon 
}: { 
  title: string
  value: string | number
  change?: string
  icon: React.ElementType 
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <p className="text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {change}
              </p>
            )}
          </div>
          <Icon className="h-8 w-8 text-primary/20" />
        </div>
      </CardContent>
    </Card>
  )
}

export function ModernAppboard({ 
  sites, 
  content, 
  onCreateContent, 
  onAddSite 
}: ModernAppboardProps) {
  const recentContent = content.slice(0, 5)
  const topPerformingContent = content
    .filter(item => item.views && item.views > 0)
    .sort((a, b) => (b.views || 0) - (a.views || 0))[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your content.
          </p>
        </div>
        <Button onClick={onAddSite}>
          <Plus className="h-4 w-4 mr-2" />
          Add Site
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Sites" 
          value={sites.length} 
          change="+2 this month"
          icon={Globe}
        />
        <StatCard 
          title="Content Items" 
          value={content.length} 
          change="+12 this week"
          icon={FileText}
        />
        <StatCard 
          title="Published" 
          value={content.filter(c => c.status === "published").length}
          change="+8 this week"
          icon={BarChart3}
        />
        <StatCard 
          title="Scheduled" 
          value={content.filter(c => c.status === "scheduled").length}
          change="+3 today"
          icon={Calendar}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Quick Actions */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Create new content quickly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <QuickActionButton
                  icon={FileText}
                  label="Article"
                  onClick={() => onCreateContent("article")}
                />
                <QuickActionButton
                  icon={Target}
                  label="Product"
                  onClick={() => onCreateContent("product")}
                  variant="secondary"
                />
                <QuickActionButton
                  icon={Zap}
                  label="Campaign"
                  onClick={() => onCreateContent("campaign")}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performing Content */}
        {topPerformingContent && (
          <div className="lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Content</CardTitle>
                <CardDescription>Your best content this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">{topPerformingContent.title}</h4>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {topPerformingContent.views} views
                      </span>
                      <span className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {topPerformingContent.comments} comments
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Analyze Performance
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* My Sites */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>My Sites</CardTitle>
              <CardDescription>Manage your WordPress sites</CardDescription>
            </CardHeader>
            <CardContent>
              {sites.length > 0 ? (
                <div className="space-y-3">
                  {sites.map((site) => (
                    <SiteCard key={site.id} site={site} onManage={() => {}} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No sites yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect your first WordPress site to get started
                  </p>
                  <Button onClick={onAddSite}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Site
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest content updates</CardDescription>
            </CardHeader>
            <CardContent>
              {recentContent.length > 0 ? (
                <div className="space-y-1">
                  {recentContent.map((item) => (
                    <ActivityItem key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                  <p className="text-muted-foreground">
                    Start creating content to see activity here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}