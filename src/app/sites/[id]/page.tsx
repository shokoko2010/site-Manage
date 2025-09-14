'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import SiteDetailView from '@/components/SiteDetailView';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Settings, RefreshCw, Globe, Calendar, FileText, Users, TrendingUp } from 'lucide-react';

interface Site {
  id: string;
  name: string;
  url: string;
  isVirtual: boolean;
  username?: string;
  isActive: boolean;
  lastSyncedAt?: Date;
  createdAt: Date;
  content: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: Date;
  }>;
  analytics: Array<{
    date: Date;
    postsSynced: number;
    pagesSynced: number;
    lastSyncStatus: string;
  }>;
}

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchSite();
  }, [params.id]);

  const fetchSite = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/sites/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch site');
      }

      const data = await response.json();
      setSite(data.site);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/sites/${params.id}/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to sync site');
      }

      await fetchSite(); // Refresh site data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSyncing(false);
    }
  };

  const handleEditContent = (content: any) => {
    // Navigate to content edit page
    router.push(`/content/${content.id}/edit`);
  };

  const showNotification = (notification: { message: string; type: string }) => {
    // Implement notification logic
    console.log('Notification:', notification);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertDescription>Site not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const latestAnalytics = site.analytics.length > 0 ? site.analytics[0] : null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{site.name}</h1>
            <p className="text-muted-foreground">{site.url}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push(`/sites/${site.id}/edit`)}>
            <Settings className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {!site.isVirtual && (
            <Button onClick={handleSync} disabled={syncing}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          )}
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex space-x-2">
        <Badge variant={site.isActive ? "default" : "secondary"}>
          {site.isActive ? 'Active' : 'Inactive'}
        </Badge>
        <Badge variant={site.isVirtual ? "outline" : "default"}>
          {site.isVirtual ? 'Virtual' : 'WordPress'}
        </Badge>
        {latestAnalytics && (
          <Badge variant={latestAnalytics.lastSyncStatus === 'SUCCESS' ? "default" : "destructive"}>
            {latestAnalytics.lastSyncStatus === 'SUCCESS' ? 'Synced' : 'Sync Failed'}
          </Badge>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Items</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{site.content.length}</div>
            <p className="text-xs text-muted-foreground">
              Total content pieces
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {site.lastSyncedAt ? 'Yes' : 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">
              {site.lastSyncedAt 
                ? new Date(site.lastSyncedAt).toLocaleDateString() 
                : 'Not synced yet'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor((Date.now() - new Date(site.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
            </div>
            <p className="text-xs text-muted-foreground">
              Days ago
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {site.isActive ? 'Live' : 'Offline'}
            </div>
            <p className="text-xs text-muted-foreground">
              Site status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sync Information */}
      {latestAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Sync Information</CardTitle>
            <CardDescription>
              Information from the most recent synchronization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium">Posts Synced</p>
                <p className="text-2xl font-bold">{latestAnalytics.postsSynced}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Pages Synced</p>
                <p className="text-2xl font-bold">{latestAnalytics.pagesSynced}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Sync Status</p>
                <Badge variant={latestAnalytics.lastSyncStatus === 'SUCCESS' ? "default" : "destructive"}>
                  {latestAnalytics.lastSyncStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Content List */}
      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
          <CardDescription>
            Manage content for this site
          </CardDescription>
        </CardHeader>
        <CardContent>
          {site.content.length > 0 ? (
            <div className="space-y-4">
              {site.content.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline">{item.status}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditContent(item)}
                  >
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No content found for this site
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}