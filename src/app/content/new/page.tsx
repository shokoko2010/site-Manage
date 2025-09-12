"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import FileUpload from '@/components/ui/file-upload';
import { Loader2, Save, Eye, ArrowLeft, Image as ImageIcon } from 'lucide-react';

interface Site {
  id: string;
  name: string;
  url: string;
}

export default function NewContentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'ARTICLE',
    language: 'ENGLISH',
    metaDescription: '',
    featuredImage: ''
  });

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

      if (response.ok) {
        const data = await response.json();
        setSites(data.sites || []);
      }
    } catch (err) {
      console.error('Error fetching sites:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          siteId: selectedSite || null
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create content');
      }

      // Redirect to content library or show success
      router.push('/content');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create content');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSelect = (fileUrl: string, fileInfo: any) => {
    setFormData(prev => ({
      ...prev,
      featuredImage: fileUrl
    }));
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      featuredImage: ''
    }));
  };

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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => router.push('/appboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Appboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Create New Content</h1>
                <p className="text-muted-foreground">Generate AI-powered content for your WordPress sites</p>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Content Form */}
          <Card>
            <CardHeader>
              <CardTitle>Content Details</CardTitle>
              <CardDescription>Fill in the details to create new content</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Site Selection */}
                <div className="space-y-2">
                  <Label htmlFor="site">Select Site (Optional)</Label>
                  <Select value={selectedSite} onValueChange={setSelectedSite}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a site to publish to" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites.length === 0 ? (
                        <SelectItem value="" disabled>
                          No sites available. Add a site first.
                        </SelectItem>
                      ) : (
                        sites.map((site) => (
                          <SelectItem key={site.id} value={site.id}>
                            {site.name} - {site.url}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    If no site is selected, content will be saved as a draft.
                  </p>
                </div>

                {/* Content Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">Content Type</Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARTICLE">Article</SelectItem>
                      <SelectItem value="PRODUCT">Product Description</SelectItem>
                      <SelectItem value="CAMPAIGN">Marketing Campaign</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                    <SelectTrigger>
                      <SelectValue />
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

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter content title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                </div>

                {/* Meta Description */}
                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    placeholder="Enter meta description for SEO"
                    value={formData.metaDescription}
                    onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Featured Image */}
                <div className="space-y-2">
                  <Label htmlFor="featuredImage">Featured Image</Label>
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    currentImage={formData.featuredImage}
                    onRemove={handleRemoveImage}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    Upload a featured image for your content. Recommended size: 1200x630px.
                  </p>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter your content here or use AI to generate it..."
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    rows={12}
                    required
                  />
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">AI Enhanced</Badge>
                    <span className="text-sm text-muted-foreground">
                      Use AI to improve your content quality and SEO
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4">
                  <div className="flex space-x-2">
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Content
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline">
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}