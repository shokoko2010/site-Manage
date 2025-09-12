"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Globe,
  TrendingUp
} from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  type: 'ARTICLE' | 'PRODUCT' | 'CAMPAIGN';
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
  language: string;
  createdAt: string;
  updatedAt: string;
  site?: {
    name: string;
    url: string;
  };
  stats?: {
    views: number;
    comments: number;
  };
}

export default function ContentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [content, setContent] = useState<ContentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/content', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setContent(data.content || []);
      } else {
        // Mock data for demo if API fails
        const mockContent: ContentItem[] = [
          {
            id: '1',
            title: '10 Tips for Better SEO in 2024',
            type: 'ARTICLE',
            status: 'PUBLISHED',
            language: 'ENGLISH',
            createdAt: '2024-04-10T10:30:00Z',
            updatedAt: '2024-04-10T10:30:00Z',
            site: {
              name: 'Tech Blog',
              url: 'https://techblog.com'
            },
            stats: {
              views: 3420,
              comments: 45
            }
          },
          {
            id: '2',
            title: 'Product Launch Announcement',
            type: 'CAMPAIGN',
            status: 'DRAFT',
            language: 'ENGLISH',
            createdAt: '2024-04-09T15:45:00Z',
            updatedAt: '2024-04-09T15:45:00Z',
            site: {
              name: 'Company Blog',
              url: 'https://company.com'
            }
          },
          {
            id: '3',
            title: 'How to Build a Successful Blog',
            type: 'ARTICLE',
            status: 'SCHEDULED',
            language: 'ENGLISH',
            createdAt: '2024-04-08T09:15:00Z',
            updatedAt: '2024-04-08T09:15:00Z',
            site: {
              name: 'Personal Blog',
              url: 'https://myblog.com'
            }
          }
        ];
        setContent(mockContent);
      }
    } catch (err) {
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ARTICLE':
        return 'bg-purple-100 text-purple-800';
      case 'PRODUCT':
        return 'bg-orange-100 text-orange-800';
      case 'CAMPAIGN':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading content...</p>
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
              <a href="/content" className="text-foreground">Content</a>
              <a href="/sites" className="text-muted-foreground hover:text-foreground">Sites</a>
              <a href="/analytics" className="text-muted-foreground hover:text-foreground">Analytics</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => router.push('/appboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Appboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold flex items-center space-x-2">
                  <FileText className="h-8 w-8" />
                  <span>Content Library</span>
                </h1>
                <p className="text-muted-foreground">Manage all your content across all sites</p>
              </div>
            </div>
            <Button onClick={() => router.push('/content/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Content
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Content</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{content.length}</div>
                <p className="text-xs text-muted-foreground">All content pieces</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {content.filter(c => c.status === 'PUBLISHED').length}
                </div>
                <p className="text-xs text-muted-foreground">Live content</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {content.filter(c => c.status === 'DRAFT').length}
                </div>
                <p className="text-xs text-muted-foreground">In progress</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {content.filter(c => c.status === 'SCHEDULED').length}
                </div>
                <p className="text-xs text-muted-foreground">Queued to publish</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search content..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="ARTICLE">Articles</option>
                    <option value="PRODUCT">Products</option>
                    <option value="CAMPAIGN">Campaigns</option>
                  </select>
                  <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="DRAFT">Drafts</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="SCHEDULED">Scheduled</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content List */}
          <Card>
            <CardHeader>
              <CardTitle>Content Items ({filteredContent.length})</CardTitle>
              <CardDescription>
                {filteredContent.length} content piece{filteredContent.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredContent.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No content found</p>
                  <p className="text-sm">Try adjusting your search or filters, or create your first content piece.</p>
                  <Button className="mt-4" onClick={() => router.push('/content/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Content
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredContent.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium text-lg">{item.title}</h3>
                            <Badge className={`text-xs ${getTypeColor(item.type)}`}>
                              {item.type}
                            </Badge>
                            <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                              {item.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                            <span className="flex items-center">
                              <Globe className="h-3 w-3 mr-1" />
                              {item.site?.name || 'No site'}
                            </span>
                            <span>•</span>
                            <span>Created {formatDate(item.createdAt)}</span>
                            {item.stats && (
                              <>
                                <span>•</span>
                                <span className="flex items-center">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  {item.stats.views} views
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}