'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Sync, CheckCircle, XCircle, Clock, RefreshCw, AlertTriangle, Database, FileText, Image } from 'lucide-react';

interface SyncResult {
  postsSynced: number;
  pagesSynced: number;
  productsSynced: number;
  newContent: number;
  updatedContent: number;
}

interface Site {
  id: string;
  name: string;
  url: string;
  isVirtual: boolean;
  username?: string;
  appPassword?: string;
  isActive: boolean;
  lastSyncedAt?: Date;
  createdAt: Date;
}

interface SyncHistory {
  date: Date;
  postsSynced: number;
  pagesSynced: number;
  productsSynced: number;
  lastSyncStatus: string;
}

export default function SiteSyncPage() {
  const params = useParams();
  const router = useRouter();
  const [site, setSite] = useState<Site | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

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
      setSyncHistory(data.site.analytics || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (syncing) return;

    setSyncing(true);
    setSyncStatus('syncing');
    setSyncProgress(0);
    setError(null);
    setSyncResult(null);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 20;
      });
    }, 500);

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

      clearInterval(progressInterval);
      setSyncProgress(100);

      if (!response.ok) {
        throw new Error('Failed to sync site');
      }

      const data = await response.json();
      setSyncResult(data.syncResults);
      setSyncStatus('success');
      
      // Refresh site data
      await fetchSite();
    } catch (err) {
      setSyncStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncProgress(0), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !site) {
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

  if (site.isVirtual) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Virtual sites cannot be synchronized. This site is marked as virtual and is used for content management only.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const latestSync = syncHistory.length > 0 ? syncHistory[0] : null;

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
            <h1 className="text-3xl font-bold tracking-tight">Site Synchronization</h1>
            <p className="text-muted-foreground">
              Sync content with {site.name}
            </p>
          </div>
        </div>
        <Button 
          onClick={handleSync} 
          disabled={syncing || !site.isActive}
          size="lg"
        >
          <Sync className="h-4 w-4 mr-2" />
          {syncing ? 'Syncing...' : 'Sync Now'}
        </Button>
      </div>

      {/* Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Sync Status
          </CardTitle>
          <CardDescription>
            Current synchronization status and progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              {syncStatus === 'idle' && <Clock className="h-4 w-4 text-muted-foreground" />}
              {syncStatus === 'syncing' && <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />}
              {syncStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {syncStatus === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
              <span className="font-medium">
                {syncStatus === 'idle' && 'Ready to sync'}
                {syncStatus === 'syncing' && 'Synchronization in progress'}
                {syncStatus === 'success' && 'Synchronization completed'}
                {syncStatus === 'error' && 'Synchronization failed'}
              </span>
            </div>

            {syncing && (
              <div className="space-y-2">
                <Progress value={syncProgress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  {syncProgress < 30 && 'Connecting to WordPress...'}
                  {syncProgress >= 30 && syncProgress < 60 && 'Fetching content...'}
                  {syncProgress >= 60 && syncProgress < 90 && 'Processing data...'}
                  {syncProgress >= 90 && 'Finalizing sync...'}
                </p>
              </div>
            )}

            {syncResult && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{syncResult.postsSynced}</div>
                  <p className="text-sm text-muted-foreground">Posts Synced</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{syncResult.pagesSynced}</div>
                  <p className="text-sm text-muted-foreground">Pages Synced</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{syncResult.productsSynced}</div>
                  <p className="text-sm text-muted-foreground">Products Synced</p>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Last Sync Information */}
      {latestSync && (
        <Card>
          <CardHeader>
            <CardTitle>Last Sync Results</CardTitle>
            <CardDescription>
              Results from the most recent synchronization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sync Date</span>
                <span className="text-sm">{new Date(latestSync.date).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge variant={latestSync.lastSyncStatus === 'SUCCESS' ? 'default' : 'destructive'}>
                  {latestSync.lastSyncStatus}
                </Badge>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-xl font-bold">{latestSync.postsSynced}</div>
                  <p className="text-sm text-muted-foreground">Posts</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">{latestSync.pagesSynced}</div>
                  <p className="text-sm text-muted-foreground">Pages</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">{latestSync.productsSynced}</div>
                  <p className="text-sm text-muted-foreground">Products</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>
            Recent synchronization activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {syncHistory.length > 0 ? (
            <div className="space-y-3">
              {syncHistory.slice(0, 10).map((sync, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant={sync.lastSyncStatus === 'SUCCESS' ? 'default' : 'destructive'}>
                      {sync.lastSyncStatus}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">
                        {sync.postsSynced} posts, {sync.pagesSynced} pages, {sync.productsSynced} products
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sync.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No synchronization history available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Site Information */}
      <Card>
        <CardHeader>
          <CardTitle>Site Information</CardTitle>
          <CardDescription>
            Current site configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Site Name</span>
              <span className="text-sm">{site.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">URL</span>
              <span className="text-sm">{site.url}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={site.isActive ? 'default' : 'secondary'}>
                {site.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Synced</span>
              <span className="text-sm">
                {site.lastSyncedAt ? new Date(site.lastSyncedAt).toLocaleString() : 'Never'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}