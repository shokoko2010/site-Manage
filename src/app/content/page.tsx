'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FileTextIcon, 
  CalendarIcon, 
  SearchIcon, 
  PlusIcon,
  EditIcon,
  TrashIcon,
  EyeIcon
} from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  type: 'article' | 'product' | 'campaign';
  status: 'draft' | 'published' | 'scheduled';
  createdAt: string;
  scheduledFor?: string;
}

export default function ContentLibraryPage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading content
    const mockContent: ContentItem[] = [
      {
        id: '1',
        title: 'The Future of AI in Content Creation',
        type: 'article',
        status: 'published',
        createdAt: '2024-03-10',
      },
      {
        id: '2',
        title: '10 Tips for Better SEO Writing',
        type: 'article',
        status: 'draft',
        createdAt: '2024-03-12',
      },
      {
        id: '3',
        title: 'Product Launch: New AI Tools',
        type: 'campaign',
        status: 'scheduled',
        createdAt: '2024-03-11',
        scheduledFor: '2024-03-20',
      },
    ];

    setTimeout(() => {
      setContent(mockContent);
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredContent = content.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return <FileTextIcon className="h-4 w-4" />;
      case 'product': return <FileTextIcon className="h-4 w-4" />;
      case 'campaign': return <FileTextIcon className="h-4 w-4" />;
      default: return <FileTextIcon className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Loading content library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Content Library</h1>
            <p className="text-muted-foreground">
              Manage and organize all your generated content
            </p>
          </div>
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create New Content
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">Filters</Button>
            </div>
          </CardContent>
        </Card>

        {/* Content Grid */}
        <div className="grid gap-4">
          {filteredContent.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="p-2 bg-muted rounded-lg">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="secondary" className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                        {item.scheduledFor && (
                          <div className="text-sm text-blue-600">
                            Scheduled for {new Date(item.scheduledFor).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredContent.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileTextIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No content found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No content matches your search.' : 'Start by creating your first piece of content.'}
              </p>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create New Content
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}