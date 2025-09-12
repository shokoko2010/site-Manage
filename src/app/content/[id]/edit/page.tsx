'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, Eye, FileText, Tag, Folder, Calendar, Globe, Sparkles, Upload, ExternalLink, CheckCircle } from 'lucide-react';

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
}

interface Site {
  id: string;
  name: string;
  url: string;
}

interface Tag {
  id: string;
  name: string;
  color?: string;
}

interface Category {
  id: string;
  name: string;
  color?: string;
}

export default function ContentEditPage() {
  const params = useParams();
  const router = useRouter();
  const [content, setContent] = useState<Content | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'ARTICLE' as 'ARTICLE' | 'PRODUCT' | 'CAMPAIGN',
    metaDescription: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' | 'PENDING' | 'SCHEDULED' | 'ARCHIVED',
    language: 'ENGLISH' as 'ENGLISH' | 'ARABIC' | 'FRENCH' | 'SPANISH' | 'GERMAN' | 'JAPANESE',
    featuredImage: '',
    siteId: '',
    scheduledFor: '',
    tagIds: [] as string[],
    categoryIds: [] as string[]
  });

  useEffect(() => {
    fetchContent();
    fetchSites();
    fetchTags();
    fetchCategories();
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
      const contentData = data.content;
      setContent(contentData);
      setFormData({
        title: contentData.title,
        body: contentData.body,
        type: contentData.type,
        metaDescription: contentData.metaDescription || '',
        status: contentData.status,
        language: contentData.language,
        featuredImage: contentData.featuredImage || '',
        siteId: contentData.site?.id || '',
        scheduledFor: contentData.scheduledFor ? new Date(contentData.scheduledFor).toISOString().slice(0, 16) : '',
        tagIds: contentData.tags.map((t: any) => t.tag.id),
        categoryIds: contentData.categories.map((c: any) => c.category.id)
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/sites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSites(data.sites || []);
      }
    } catch (err) {
      console.error('Failed to fetch sites:', err);
    }
  };

  const fetchTags = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/tags', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTags(data.tags || []);
      }
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId]
    }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/content/${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to update content');
      }

      setSuccess('Content updated successfully');
      // Refresh content data
      await fetchContent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToWordPress = async () => {
    if (!formData.siteId) {
      setError('Please select a site to publish to WordPress');
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/wordpress/publish', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'publish',
          contentId: params.id,
          siteId: formData.siteId,
          postData: {
            title: formData.title,
            content: formData.body,
            excerpt: formData.metaDescription || '',
            status: formData.status === 'PUBLISHED' ? 'publish' : 'draft',
            categories: formData.categoryIds.map(id => parseInt(id)),
            tags: formData.tagIds.map(id => parseInt(id))
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        setPublishResult(result);
        setSuccess(`Content published successfully! Post ID: ${result.postId}`);
      } else {
        throw new Error(result.error || 'Failed to publish to WordPress');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setPublishing(false);
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
            <h1 className="text-3xl font-bold tracking-tight">Edit Content</h1>
            <p className="text-muted-foreground">
              {content ? `Editing ${content.title}` : 'Loading content...'}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          {formData.siteId && (
            <Button 
              variant="outline" 
              onClick={handlePublishToWordPress}
              disabled={publishing}
            >
              <Upload className="h-4 w-4 mr-2" />
              {publishing ? 'Publishing...' : 'Publish to WordPress'}
            </Button>
          )}
          <Button 
            onClick={handleSubmit} 
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* WordPress Publish Result */}
      {publishResult && (
        <Alert>
          <AlertDescription className="space-y-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="font-medium">Published to WordPress successfully!</span>
            </div>
            <div className="text-sm space-y-1">
              <p>Post ID: {publishResult.postId}</p>
              <p>Status: {publishResult.status}</p>
              {publishResult.postUrl && (
                <a 
                  href={publishResult.postUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Post
                </a>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {previewMode ? (
        /* Preview Mode */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <h1>{formData.title}</h1>
              {formData.metaDescription && (
                <p className="text-gray-600 italic">{formData.metaDescription}</p>
              )}
              <div className="whitespace-pre-wrap">{formData.body}</div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Edit Mode */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Set the title, content type, and basic details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter content title"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="type">Content Type</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARTICLE">Article</SelectItem>
                    <SelectItem value="PRODUCT">Product</SelectItem>
                    <SelectItem value="CAMPAIGN">Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                  placeholder="Enter meta description for SEO"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Body */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Content Body
              </CardTitle>
              <CardDescription>
                Write your content using Markdown or plain text
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => handleInputChange('body', e.target.value)}
                placeholder="Write your content here..."
                rows={15}
                required
              />
            </CardContent>
          </Card>

          {/* Publishing Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Publishing Settings
              </CardTitle>
              <CardDescription>
                Configure publishing status and schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="PENDING">Pending Review</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.status === 'SCHEDULED' && (
                <div>
                  <Label htmlFor="scheduledFor">Schedule For</Label>
                  <Input
                    id="scheduledFor"
                    type="datetime-local"
                    value={formData.scheduledFor}
                    onChange={(e) => handleInputChange('scheduledFor', e.target.value)}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="language">Language</Label>
                <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENGLISH">English</SelectItem>
                    <SelectItem value="ARABIC">Arabic</SelectItem>
                    <SelectItem value="FRENCH">French</SelectItem>
                    <SelectItem value="SPANISH">Spanish</SelectItem>
                    <SelectItem value="GERMAN">German</SelectItem>
                    <SelectItem value="JAPANESE">Japanese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Site Association */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Site Association
              </CardTitle>
              <CardDescription>
                Associate this content with a site
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="siteId">Site</Label>
                <Select value={formData.siteId} onValueChange={(value) => handleInputChange('siteId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a site" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No site</SelectItem>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tag className="h-5 w-5 mr-2" />
                Tags
              </CardTitle>
              <CardDescription>
                Add tags to categorize your content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={formData.tagIds.includes(tag.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Folder className="h-5 w-5 mr-2" />
                Categories
              </CardTitle>
              <CardDescription>
                Add categories to organize your content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category.id}
                    variant={formData.categoryIds.includes(category.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleCategoryToggle(category.id)}
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
              <CardDescription>
                Add a featured image URL
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="featuredImage">Image URL</Label>
                <Input
                  id="featuredImage"
                  type="url"
                  value={formData.featuredImage}
                  onChange={(e) => handleInputChange('featuredImage', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}