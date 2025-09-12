'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, Globe, Shield, AlertTriangle } from 'lucide-react';

interface Site {
  id: string;
  name: string;
  url: string;
  isVirtual: boolean;
  username?: string;
  appPassword?: string;
  isActive: boolean;
  createdAt: Date;
}

export default function SiteEditPage() {
  const params = useParams();
  const router = useRouter();
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    isVirtual: false,
    username: '',
    appPassword: '',
    isActive: true
  });

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
      const siteData = data.site;
      setSite(siteData);
      setFormData({
        name: siteData.name,
        url: siteData.url,
        isVirtual: siteData.isVirtual,
        username: siteData.username || '',
        appPassword: siteData.appPassword || '',
        isActive: siteData.isActive
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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

      const response = await fetch(`/api/sites/${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to update site');
      }

      setSuccess('Site updated successfully');
      // Refresh site data
      await fetchSite();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
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
            <h1 className="text-3xl font-bold tracking-tight">Edit Site</h1>
            <p className="text-muted-foreground">
              {site ? `Editing ${site.name}` : 'Loading site...'}
            </p>
          </div>
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

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Site Configuration
          </CardTitle>
          <CardDescription>
            Update your site settings and configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Site Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="My Awesome Site"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="url">Site URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  placeholder="https://example.com"
                  required
                />
              </div>
            </div>

            <Separator />

            {/* Site Type */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isVirtual"
                  checked={formData.isVirtual}
                  onCheckedChange={(checked) => handleInputChange('isVirtual', checked)}
                />
                <Label htmlFor="isVirtual">Virtual Site</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Virtual sites don't connect to WordPress and are used for content management only.
              </p>
            </div>

            {/* WordPress Credentials (only for non-virtual sites) */}
            {!formData.isVirtual && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">WordPress Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      placeholder="admin"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="appPassword">Application Password</Label>
                    <Input
                      id="appPassword"
                      type="password"
                      value={formData.appPassword}
                      onChange={(e) => handleInputChange('appPassword', e.target.value)}
                      placeholder="your-app-password"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Generate an application password in your WordPress dashboard under Users → Profile → Application Passwords
                    </p>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Site Status */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
                <Label htmlFor="isActive">Active Site</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Active sites will be available for content management and synchronization.
              </p>
            </div>

            {/* Warning for Virtual Sites */}
            {formData.isVirtual && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Virtual sites cannot be synchronized with WordPress. Content will be managed locally only.
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium">Data Encryption</p>
              <p className="text-muted-foreground">
                All sensitive data, including passwords, are encrypted before storage.
              </p>
            </div>
            <div>
              <p className="font-medium">API Security</p>
              <p className="text-muted-foreground">
                All API requests are authenticated using JWT tokens.
              </p>
            </div>
            <div>
              <p className="font-medium">WordPress Security</p>
              <p className="text-muted-foreground">
                We use WordPress Application Passwords for secure API access without storing your main password.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}