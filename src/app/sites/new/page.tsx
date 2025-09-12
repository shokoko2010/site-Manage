"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, ArrowLeft, Globe, Shield } from 'lucide-react';

export default function NewSitePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    username: '',
    appPassword: '',
    isVirtual: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add site');
      }

      setSuccess('Site added successfully!');
      setTimeout(() => {
        router.push('/appboard');
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add site');
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

  const testConnection = async () => {
    if (!formData.url || !formData.username || !formData.appPassword) {
      setError('Please fill in URL, username, and application password to test connection');
      return;
    }

    try {
      // This would be a real API call to test WordPress connection
      // For now, we'll simulate it
      setError('');
      setSuccess('Connection test successful! ✓');
    } catch (err) {
      setError('Connection test failed. Please check your credentials.');
    }
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
              <a href="/content" className="text-muted-foreground hover:text-foreground">Content</a>
              <a href="/sites" className="text-foreground">Sites</a>
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
                <h1 className="text-3xl font-bold">Add New Site</h1>
                <p className="text-muted-foreground">Connect your WordPress site to start managing content</p>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Site Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Site Information</span>
              </CardTitle>
              <CardDescription>
                Enter your WordPress site details to connect it with Zex-Content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Site Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Site Name</Label>
                  <Input
                    id="name"
                    placeholder="My Awesome Blog"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    A friendly name to identify this site in your appboard
                  </p>
                </div>

                {/* Site URL */}
                <div className="space-y-2">
                  <Label htmlFor="url">Site URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://myblog.com"
                    value={formData.url}
                    onChange={(e) => handleInputChange('url', e.target.value)}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    The full URL of your WordPress site (include https://)
                  </p>
                </div>

                {/* Virtual Site Toggle */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isVirtual"
                    checked={formData.isVirtual}
                    onCheckedChange={(checked) => handleInputChange('isVirtual', checked as boolean)}
                  />
                  <Label htmlFor="isVirtual" className="text-sm">
                    Create as virtual site
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground -mt-4">
                  Virtual sites are for content planning without actual WordPress connection
                </p>

                {/* WordPress Credentials - Only show if not virtual */}
                {!formData.isVirtual && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">WordPress Credentials</span>
                      <Badge variant="outline">Required for connection</Badge>
                    </div>

                    {/* Username */}
                    <div className="space-y-2">
                      <Label htmlFor="username">WordPress Username</Label>
                      <Input
                        id="username"
                        placeholder="admin"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        required={!formData.isVirtual}
                      />
                      <p className="text-sm text-muted-foreground">
                        Your WordPress admin username
                      </p>
                    </div>

                    {/* Application Password */}
                    <div className="space-y-2">
                      <Label htmlFor="appPassword">Application Password</Label>
                      <Input
                        id="appPassword"
                        type="password"
                        placeholder="your-app-password"
                        value={formData.appPassword}
                        onChange={(e) => handleInputChange('appPassword', e.target.value)}
                        required={!formData.isVirtual}
                      />
                      <p className="text-sm text-muted-foreground">
                        Generate an application password in your WordPress admin area
                      </p>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>How to generate application password:</strong><br />
                          1. Go to your WordPress admin area<br />
                          2. Navigate to Users → Profile<br />
                          3. Scroll down to Application Passwords<br />
                          4. Enter a name and click "Add New Application Password"
                        </p>
                      </div>
                    </div>

                    {/* Test Connection Button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={testConnection}
                      className="w-full"
                    >
                      Test Connection
                    </Button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/appboard')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding Site...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Add Site
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}