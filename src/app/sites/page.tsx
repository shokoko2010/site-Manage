"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  Plus, 
  Settings, 
  RefreshCw, 
  ExternalLink,
  Calendar,
  FileText,
  Trash2,
  Edit
} from 'lucide-react';

interface Site {
  id: string;
  name: string;
  url: string;
  isVirtual: boolean;
  username?: string;
  isActive: boolean;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/sites', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sites');
      }

      const data = await response.json();
      setSites(data.sites || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sites');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSites();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleDelete = async (siteId: string) => {
    if (!confirm('Are you sure you want to delete this site? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`/api/sites/${siteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete site');
      }

      await fetchSites(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete site');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading sites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <div className="mr-4 flex">
            <span className="font-bold text-xl">Zex-Content</span>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2">
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <a href="/appboard" className="text-muted-foreground hover:text-foreground">Appboard</a>
              <a href="/content" className="text-muted-foreground hover:text-foreground">Content</a>
              <a href="/sites" className="text-foreground">Sites</a>
              <a href="/analytics" className="text-muted-foreground hover:text-foreground">Analytics</a>
            </nav>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Your Sites</h1>
              <p className="text-muted-foreground">Manage your connected WordPress sites</p>
            </div>
            <Button onClick={() => router.push('/sites/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Site
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Sites Grid */}
          {sites.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No sites connected yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Connect your first WordPress site to start managing content
                </p>
                <Button onClick={() => router.push('/sites/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Site
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sites.map((site) => (
                <Card key={site.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{site.name}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-1">
                        {site.isVirtual ? (
                          <Badge variant="secondary">Virtual</Badge>
                        ) : (
                          <Badge variant={site.isActive ? "default" : "destructive"}>
                            {site.isActive ? "Active" : "Inactive"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription className="text-sm">
                      {site.url}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Site Info */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Status:</span>
                          <span className={site.isActive ? "text-green-600" : "text-red-600"}>
                            {site.isActive ? "Connected" : "Disconnected"}
                          </span>
                        </div>
                        {site.lastSyncedAt && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Last synced:</span>
                            <span>{new Date(site.lastSyncedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Added:</span>
                          <span>{new Date(site.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(site.url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/sites/${site.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(site.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/content?siteId=${site.id}`)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Content
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle>Getting Started with Sites</CardTitle>
              <CardDescription>Learn how to connect and manage your WordPress sites</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Plus className="h-4 w-4" />
                  </div>
                  <h3 className="font-medium">Add Your Site</h3>
                  <p className="text-sm text-muted-foreground">Connect your WordPress site using the site URL and application password</p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <RefreshCw className="h-4 w-4" />
                  </div>
                  <h3 className="font-medium">Sync Content</h3>
                  <p className="text-sm text-muted-foreground">Automatically sync your existing content to manage it in one place</p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <FileText className="h-4 w-4" />
                  </div>
                  <h3 className="font-medium">Create & Publish</h3>
                  <p className="text-sm text-muted-foreground">Use AI-powered tools to create and publish content directly to your site</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}