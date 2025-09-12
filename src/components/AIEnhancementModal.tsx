'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sparkles, Wand2, FileText, Image, MessageSquare, Shield, Settings, Loader2, CheckCircle } from 'lucide-react';

interface AIEnhancementModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: {
    title: string;
    body: string;
    type: 'ARTICLE' | 'PRODUCT' | 'CAMPAIGN';
    language: string;
  };
  onContentUpdate: (content: { title: string; body: string }) => void;
  showNotification: (notification: { message: string; type: 'success' | 'error' | 'info' }) => void;
}

type EnhancementType = 'generate' | 'enhance' | 'grammar' | 'seo' | 'engagement' | 'professional' | 'casual';

const AIEnhancementModal: React.FC<AIEnhancementModalProps> = ({ 
  isOpen, 
  onClose, 
  content, 
  onContentUpdate, 
  showNotification 
}) => {
  const [selectedEnhancement, setSelectedEnhancement] = useState<EnhancementType>('generate');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('neutral');
  const [length, setLength] = useState('medium');

  const enhancementTypes = [
    {
      id: 'generate' as EnhancementType,
      name: 'Generate Content',
      description: 'Generate new content using AI',
      icon: <Sparkles className="w-6 h-6" />
    },
    {
      id: 'enhance' as EnhancementType,
      name: 'Enhance Content',
      description: 'Improve existing content quality',
      icon: <Wand2 className="w-6 h-6" />
    },
    {
      id: 'grammar' as EnhancementType,
      name: 'Fix Grammar',
      description: 'Correct grammar and spelling',
      icon: <FileText className="w-6 h-6" />
    },
    {
      id: 'seo' as EnhancementType,
      name: 'SEO Optimization',
      description: 'Optimize for search engines',
      icon: <FileText className="w-6 h-6" />
    },
    {
      id: 'engagement' as EnhancementType,
      name: 'Boost Engagement',
      description: 'Make content more engaging',
      icon: <MessageSquare className="w-6 h-6" />
    },
    {
      id: 'professional' as EnhancementType,
      name: 'Professional Tone',
      description: 'Make content more professional',
      icon: <Shield className="w-6 h-6" />
    },
    {
      id: 'casual' as EnhancementType,
      name: 'Casual Tone',
      description: 'Make content more conversational',
      icon: <MessageSquare className="w-6 h-6" />
    }
  ];

  const handleEnhancement = async () => {
    setIsProcessing(true);
    setResults(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      let response;
      let url;
      let body;

      if (selectedEnhancement === 'generate') {
        url = '/api/ai/generate';
        body = {
          prompt: prompt || content.title,
          type: content.type,
          tone,
          length
        };
      } else {
        url = '/api/ai/enhance';
        body = {
          title: content.title,
          content: content.body,
          enhancementType: selectedEnhancement
        };
      }

      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process enhancement');
      }

      const data = await response.json();

      if (data.success && data.content) {
        setResults(data.content);
        
        if (selectedEnhancement === 'generate') {
          onContentUpdate({
            title: data.content.title,
            body: data.content.content
          });
          showNotification({ message: 'Content generated successfully!', type: 'success' });
        } else {
          onContentUpdate({
            title: data.content.title || content.title,
            body: data.content.content
          });
          showNotification({ message: 'Content enhanced successfully!', type: 'success' });
        }
      } else {
        throw new Error('No content returned from AI');
      }

    } catch (error) {
      console.error('Enhancement error:', error);
      showNotification({ 
        message: `Failed to process enhancement: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        type: 'error' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderGenerateOptions = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="prompt">Prompt</Label>
        <Textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to generate..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tone">Tone</Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger>
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="formal">Formal</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="length">Length</Label>
          <Select value={length} onValueChange={setLength}>
            <SelectTrigger>
              <SelectValue placeholder="Select length" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short">Short</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="long">Long</SelectItem>
              <SelectItem value="detailed">Detailed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderEnhanceOptions = () => (
    <div className="space-y-4">
      <div>
        <Label>Enhancement Type</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {enhancementTypes.filter(t => t.id !== 'generate').map(type => (
            <Button
              key={type.id}
              variant={selectedEnhancement === type.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedEnhancement(type.id as EnhancementType)}
              className="justify-start h-auto p-3"
            >
              <div className="flex items-center space-x-2">
                {type.icon}
                <div className="text-left">
                  <div className="font-medium text-sm">{type.name}</div>
                  <div className="text-xs opacity-70">{type.description}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <span>AI Content Enhancement</span>
          </DialogTitle>
          <DialogDescription>
            Use AI to generate or enhance your content
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Enhancement Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Enhancement Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {enhancementTypes.map(type => (
                  <Button
                    key={type.id}
                    variant={selectedEnhancement === type.id ? "default" : "outline"}
                    onClick={() => setSelectedEnhancement(type.id)}
                    className="justify-start h-auto p-4"
                  >
                    <div className="flex items-center space-x-3">
                      {type.icon}
                      <div className="text-left">
                        <div className="font-medium">{type.name}</div>
                        <div className="text-xs opacity-70 mt-1">{type.description}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Options</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEnhancement === 'generate' ? renderGenerateOptions() : renderEnhanceOptions()}
            </CardContent>
          </Card>

          {/* Current Content Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label>Title</Label>
                  <div className="p-3 bg-muted rounded-md text-sm">
                    {content.title}
                  </div>
                </div>
                <div>
                  <Label>Content</Label>
                  <div className="p-3 bg-muted rounded-md text-sm max-h-32 overflow-y-auto">
                    {content.body.substring(0, 300)}
                    {content.body.length > 300 && '...'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {results && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  AI Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label>Generated Title</Label>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      {results.title}
                    </div>
                  </div>
                  <div>
                    <Label>Generated Content</Label>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md max-h-64 overflow-y-auto">
                      {results.content}
                    </div>
                  </div>
                  {results.metaDescription && (
                    <div>
                      <Label>Meta Description</Label>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
                        {results.metaDescription}
                      </div>
                    </div>
                  )}
                  {results.tags && results.tags.length > 0 && (
                    <div>
                      <Label>Suggested Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {results.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleEnhancement} disabled={isProcessing}>
              {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedEnhancement === 'generate' ? 'Generate' : 'Enhance'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIEnhancementModal;