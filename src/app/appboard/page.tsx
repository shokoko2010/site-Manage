"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Globe, 
  Calendar, 
  BarChart3, 
  Users, 
  Settings,
  Plus,
  LogOut,
  RefreshCw
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  plan: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  avatar?: string;
  bio?: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DashboardStats {
  totalContent: number;
  totalSites: number;
  scheduledContent: number;
  totalViews: number;
  totalTeamMembers: number;
}

export default function AppboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalContent: 0,
    totalSites: 0,
    scheduledContent: 0,
    totalViews: 0,
    totalTeamMembers: 1
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Refresh data when component mounts or when user navigates back
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      // Fetch sites count
      const sitesResponse = await fetch('/api/sites', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (sitesResponse.ok) {
        const sitesData = await sitesResponse.json();
        setStats(prev => ({
          ...prev,
          totalSites: sitesData.sites?.length || 0
        }));
      }

      // Fetch content count
      const contentResponse = await fetch('/api/content', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (contentResponse.ok) {
        const contentData = await contentResponse.json();
        const allContent = contentData.content || [];
        const scheduledContent = allContent.filter((item: any) => 
          item.status === 'SCHEDULED' || item.scheduledFor
        );
        
        setStats(prev => ({
          ...prev,
          totalContent: allContent.length,
          scheduledContent: scheduledContent.length
        }));
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      setUser(data.user);
      
      // Fetch dashboard data after successful authentication
      fetchDashboardData();
    } catch (err) {
      setError('Authentication failed');
      localStorage.removeItem('auth_token');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('auth_token');
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
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
              <a href="/appboard" className="text-foreground">Appboard</a>
              <a href="/content" className="text-muted-foreground hover:text-foreground">Content</a>
              <a href="/sites" className="text-muted-foreground hover:text-foreground">Sites</a>
              <a href="/analytics" className="text-muted-foreground hover:text-foreground">Analytics</a>
            </nav>
            <div className="flex items-center space-x-2">
              {user && (
                <span className="text-sm text-muted-foreground">
                  Welcome, {user.name}
                </span>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Welcome Section */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-4">
              <h1 className="text-3xl font-bold">Welcome to Your Appboard</h1>
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
            <p className="text-muted-foreground">
              Manage your content, sites, and analytics all in one place
            </p>
          </div>

          {/* User Info Card */}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your current account status and plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{user.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-medium">{user.role}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="font-medium">{user.plan}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Create Content</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalContent}</div>
                <p className="text-xs text-muted-foreground">Articles created</p>
                <Button 
                  className="mt-4 w-full" 
                  size="sm"
                  onClick={() => router.push('/content/new')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Article
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connected Sites</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSites}</div>
                <p className="text-xs text-muted-foreground">WordPress sites</p>
                <Button 
                  className="mt-4 w-full" 
                  size="sm"
                  onClick={() => router.push('/sites/new')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Site
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled Content</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.scheduledContent}</div>
                <p className="text-xs text-muted-foreground">Articles scheduled</p>
                <Button 
                  className="mt-4 w-full" 
                  size="sm" 
                  variant="outline"
                  onClick={() => router.push('/calendar')}
                >
                  View Calendar
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Analytics</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalViews}</div>
                <p className="text-xs text-muted-foreground">Total views</p>
                <Button 
                  className="mt-4 w-full" 
                  size="sm" 
                  variant="outline"
                  onClick={() => router.push('/analytics')}
                >
                  View Analytics
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTeamMembers}</div>
                <p className="text-xs text-muted-foreground">Active users</p>
                <Button 
                  className="mt-4 w-full" 
                  size="sm" 
                  variant="outline"
                  onClick={() => router.push('/team')}
                >
                  Manage Team
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Settings</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">✓</div>
                <p className="text-xs text-muted-foreground">System configured</p>
                <Button 
                  className="mt-4 w-full" 
                  size="sm" 
                  variant="outline"
                  onClick={() => router.push('/settings')}
                >
                  View Settings
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Follow these steps to set up your content management system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">1</span>
                  </div>
                  <h3 className="font-medium">Connect Your Site</h3>
                  <p className="text-sm text-muted-foreground">Add your WordPress site to start managing content</p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">2</span>
                  </div>
                  <h3 className="font-medium">Create Content</h3>
                  <p className="text-sm text-muted-foreground">Use our AI-powered tools to generate high-quality content</p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">3</span>
                  </div>
                  <h3 className="font-medium">Publish & Analyze</h3>
                  <p className="text-sm text-muted-foreground">Schedule content and track performance with analytics</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}