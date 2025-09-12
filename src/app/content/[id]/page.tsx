'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Edit, Eye, Calendar, FileText, Tag, Folder, Globe, TrendingUp, MessageSquare, Share2 } from 'lucide-react';

interface Content {
  id: string;
  title: string;
  body: string;
  type: 'ARTICLE' | 'PRODUCT' | 'CAMPAIGN';
  metaDescription?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'PENDING' | 'SCHEDULED' | 'ARCHIVED';
  language: 'ENGLISH' | 'ARABIC' | 'FRENCH' | 'SPANISH' | 'GERMAN' | 'JAPANESE';
  featuredImage?: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  scheduledFor?: Date;
  site?: {
    id: string;
    name: string;
    url: string;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
      color?: string;
    };
  }>;
  categories: Array<{
    category: {
      id: string;
      name: string;
      color?: string;
    };
  }>;
  analytics: Array<{
    date: Date;
    views: number;
    comments: number;
    shares: number;
    clickThroughRate: number;
    engagementScore: number;
  }>;
}

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
  }, [params.id]);

  const fetchContent = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/content/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }

      const data = await response.json();
      setContent(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'default';
      case 'DRAFT': return 'secondary';
      case 'PENDING': return 'outline';
      case 'SCHEDULED': return 'default';
      case 'ARCHIVED': return 'destructive';
      default: return 'secondary';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ARTICLE': return 'default';
      case 'PRODUCT': return 'secondary';
      case 'CAMPAIGN': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !content) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertDescription>Content not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const latestAnalytics = content.analytics.length > 0 ? content.analytics[0] : null;

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
            <h1 className="text-3xl font-bold tracking-tight">{content.title}</h1>
            <p className="text-muted-foreground">
              {content.type.toLowerCase()} • {content.status.toLowerCase()}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => window.open(`/content/${content.slug}`, '_blank')}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={() => router.push(`/content/${content.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex space-x-2">
        <Badge variant={getStatusColor(content.status)}>
          {content.status}
        </Badge>
        <Badge variant={getTypeColor(content.type)}>
          {content.type}
        </Badge>
        <Badge variant="outline">
          {content.language}
        </Badge>
      </div>

      {/* Content Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestAnalytics?.views || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total views
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestAnalytics?.comments || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total comments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shares</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestAnalytics?.shares || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total shares
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestAnalytics?.engagementScore ? Math.round(latestAnalytics.engagementScore) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Engagement score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Information */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap">{content.body}</div>
              </div>
            </CardContent>
          </Card>

          {/* Meta Description */}
          {content.metaDescription && (
            <Card>
              <CardHeader>
                <CardTitle>Meta Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{content.metaDescription}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Content Details */}
          <Card>
            <CardHeader>
              <CardTitle>Content Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(content.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              {content.publishedAt && (
                <div>
                  <p className="text-sm font-medium">Published</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(content.publishedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              {content.scheduledFor && (
                <div>
                  <p className="text-sm font-medium">Scheduled For</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(content.scheduledFor).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(content.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Site Information */}
          {content.site && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Site
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{content.site.name}</p>
                  <p className="text-sm text-muted-foreground">{content.site.url}</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push(`/sites/${content.site?.id}`)}
                  >
                    View Site
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {content.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Tag className="h-5 w-5 mr-2" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {content.tags.map(({ tag }) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Categories */}
          {content.categories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Folder className="h-5 w-5 mr-2" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {content.categories.map(({ category }) => (
                    <Badge key={category.id} variant="outline">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Featured Image */}
      {content.featuredImage && (
        <Card>
          <CardHeader>
            <CardTitle>Featured Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video rounded-lg overflow-hidden">
              <img 
                src={content.featuredImage} 
                alt={content.title}
                className="object-cover w-full h-full"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}