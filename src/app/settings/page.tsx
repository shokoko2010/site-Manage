'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [brandVoice, setBrandVoice] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedApiKey = localStorage.getItem('gemini_api_key') || '';
    const savedBrandVoice = localStorage.getItem('brand_voice') || '';
    
    setGeminiApiKey(savedApiKey);
    setBrandVoice(savedBrandVoice);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('gemini_api_key', geminiApiKey);
      localStorage.setItem('brand_voice', brandVoice);
      
      // Show success message
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your API connections and preferences</p>
        </div>

        <div className="space-y-6">
          {/* API Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                API Configuration
                <Badge variant="secondary">Gemini</Badge>
              </CardTitle>
              <CardDescription>
                Configure your AI service API keys for content generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">Gemini API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your Gemini API key"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Get your API key from the Google AI Studio dashboard
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Brand Voice */}
          <Card>
            <CardHeader>
              <CardTitle>Brand Voice</CardTitle>
              <CardDescription>
                Define your brand's personality and writing style for consistent content generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brandVoice">Brand Personality</Label>
                <Textarea
                  id="brandVoice"
                  placeholder="e.g., Friendly, professional, and slightly informal. We use clear language and avoid jargon..."
                  value={brandVoice}
                  onChange={(e) => setBrandVoice(e.target.value)}
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  Describe your brand's tone, style, and personality traits
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}