"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  ArrowLeft, 
  Plus, 
  Filter,
  Download,
  Settings
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'ARTICLE' | 'PRODUCT' | 'CAMPAIGN';
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
  site?: string;
}

export default function CalendarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Mock data for now - in real app this would fetch from API
      const mockEvents: CalendarEvent[] = [
        {
          id: '1',
          title: '10 Tips for Better SEO',
          date: new Date().toISOString(),
          type: 'ARTICLE',
          status: 'SCHEDULED',
          site: 'Tech Blog'
        },
        {
          id: '2',
          title: 'Product Launch Announcement',
          date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          type: 'CAMPAIGN',
          status: 'DRAFT',
          site: 'Company Blog'
        }
      ];

      setEvents(mockEvents);
    } catch (err) {
      setError('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

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
      weekday: 'short',
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
          <p className="mt-2 text-muted-foreground">Loading calendar...</p>
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
              <a href="/content" className="text-muted-foreground hover:text-foreground">Content</a>
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
                  <CalendarIcon className="h-8 w-8" />
                  <span>Content Calendar</span>
                </h1>
                <p className="text-muted-foreground">Plan and schedule your content across all sites</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Content
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Calendar Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Calendar View */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Calendar View</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">Today</Button>
                      <Button variant="outline" size="sm">
                        &lt; Prev
                      </Button>
                      <span className="text-sm font-medium">
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                      <Button variant="outline" size="sm">
                        Next &gt;
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Calendar view coming soon</p>
                    <p className="text-sm">Full calendar integration will be available in the next update</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Upcoming Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming Content</CardTitle>
                  <CardDescription>Content scheduled for the next 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No upcoming content scheduled</p>
                  ) : (
                    <div className="space-y-3">
                      {events.map((event) => (
                        <div key={event.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-sm">{event.title}</h4>
                            <div className="flex space-x-1">
                              <Badge className={`text-xs ${getTypeColor(event.type)}`}>
                                {event.type}
                              </Badge>
                              <Badge className={`text-xs ${getStatusColor(event.status)}`}>
                                {event.status}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(event.date)}
                          </p>
                          {event.site && (
                            <p className="text-xs text-muted-foreground">
                              Site: {event.site}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Content</span>
                      <span className="font-medium">{events.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Published</span>
                      <span className="font-medium text-green-600">
                        {events.filter(e => e.status === 'PUBLISHED').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Scheduled</span>
                      <span className="font-medium text-blue-600">
                        {events.filter(e => e.status === 'SCHEDULED').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Drafts</span>
                      <span className="font-medium text-gray-600">
                        {events.filter(e => e.status === 'DRAFT').length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/content/new')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Content
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/sites/new')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Site
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Calendar Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}