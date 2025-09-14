"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  Eye,
  MessageSquare,
  Share,
  Users,
  Globe,
  Calendar,
  Activity,
  PieChart
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';

interface AnalyticsData {
  totalViews: number;
  totalComments: number;
  totalShares: number;
  topContent: Array<{
    id: string;
    title: string;
    views: number;
    comments: number;
    shares: number;
  }>;
  sitePerformance: Array<{
    id: string;
    name: string;
    views: number;
    engagement: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    views: number;
    comments: number;
  }>;
  trafficSources: Array<{
    source: string;
    views: number;
    percentage: number;
  }>;
  contentTypePerformance: Array<{
    type: string;
    count: number;
    views: number;
  }>;
  userEngagement: Array<{
    date: string;
    newUsers: number;
    returningUsers: number;
    sessionDuration: number;
  }>;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Mock analytics data - in real app this would fetch from API
      const mockAnalytics: AnalyticsData = {
        totalViews: 15420,
        totalComments: 342,
        totalShares: 128,
        topContent: [
          {
            id: '1',
            title: '10 Tips for Better SEO in 2024',
            views: 3420,
            comments: 45,
            shares: 23
          },
          {
            id: '2',
            title: 'The Future of Content Marketing',
            views: 2156,
            comments: 32,
            shares: 18
          },
          {
            id: '3',
            title: 'How to Build a Successful Blog',
            views: 1876,
            comments: 28,
            shares: 15
          }
        ],
        sitePerformance: [
          {
            id: '1',
            name: 'Tech Blog',
            views: 8900,
            engagement: 4.2
          },
          {
            id: '2',
            name: 'Company Blog',
            views: 4520,
            engagement: 3.8
          },
          {
            id: '3',
            name: 'Personal Blog',
            views: 2000,
            engagement: 5.1
          }
        ],
        monthlyTrend: [
          { month: 'Jan', views: 3200, comments: 68 },
          { month: 'Feb', views: 4100, comments: 82 },
          { month: 'Mar', views: 3800, comments: 75 },
          { month: 'Apr', views: 4320, comments: 117 }
        ],
        trafficSources: [
          { source: 'Organic Search', views: 8900, percentage: 58 },
          { source: 'Social Media', views: 3200, percentage: 21 },
          { source: 'Direct', views: 2100, percentage: 14 },
          { source: 'Referral', views: 1220, percentage: 7 }
        ],
        contentTypePerformance: [
          { type: 'Articles', count: 45, views: 12000 },
          { type: 'Products', count: 12, views: 2400 },
          { type: 'Campaigns', count: 8, views: 1020 }
        ],
        userEngagement: [
          { date: '2024-01-01', newUsers: 120, returningUsers: 340, sessionDuration: 245 },
          { date: '2024-01-02', newUsers: 98, returningUsers: 312, sessionDuration: 267 },
          { date: '2024-01-03', newUsers: 145, returningUsers: 389, sessionDuration: 289 },
          { date: '2024-01-04', newUsers: 167, returningUsers: 421, sessionDuration: 312 },
          { date: '2024-01-05', newUsers: 134, returningUsers: 367, sessionDuration: 278 },
          { date: '2024-01-06', newUsers: 189, returningUsers: 445, sessionDuration: 334 },
          { date: '2024-01-07', newUsers: 156, returningUsers: 398, sessionDuration: 301 }
        ]
      };

      setAnalytics(mockAnalytics);
    } catch (err) {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading analytics...</p>
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
              <a href="/analytics" className="text-foreground">Analytics</a>
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
                  <BarChart3 className="h-8 w-8" />
                  <span>Analytics Dashboard</span>
                </h1>
                <p className="text-muted-foreground">Track your content performance across all sites</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Date Range
              </Button>
              <Button variant="outline" size="sm">
                Export Report
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {analytics && (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(analytics.totalViews)}</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                      +12% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Comments</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalComments}</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                      +8% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Shares</CardTitle>
                    <Share className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalShares}</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                      -3% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">4.3%</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                      +0.5% from last month
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performing Content */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Content</CardTitle>
                    <CardDescription>Your most popular content this month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.topContent.map((content, index) => (
                        <div key={content.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                #{index + 1}
                              </Badge>
                              <h4 className="font-medium text-sm">{content.title}</h4>
                            </div>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center">
                                <Eye className="h-3 w-3 mr-1" />
                                {formatNumber(content.views)}
                              </span>
                              <span className="flex items-center">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                {content.comments}
                              </span>
                              <span className="flex items-center">
                                <Share className="h-3 w-3 mr-1" />
                                {content.shares}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Site Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Site Performance</CardTitle>
                    <CardDescription>How your sites are performing</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.sitePerformance.map((site) => (
                        <div key={site.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <h4 className="font-medium text-sm">{site.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {formatNumber(site.views)} views
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{site.engagement}%</div>
                            <div className="text-xs text-muted-foreground">engagement</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trend</CardTitle>
                  <CardDescription>Views and comments over the last 4 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.monthlyTrend.map((month, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <span className="font-medium text-sm w-12">{month.month}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Views</span>
                              <span>{formatNumber(month.views)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${(month.views / Math.max(...analytics.monthlyTrend.map(m => m.views))) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <MessageSquare className="h-3 w-3" />
                          <span>{month.comments}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Traffic Sources Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5" />
                    <span>Traffic Sources</span>
                  </CardTitle>
                  <CardDescription>Where your visitors come from</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      views: {
                        label: 'Views',
                        color: 'hsl(var(--chart-1))',
                      },
                    }}
                    className="h-80"
                  >
                    <RechartsPieChart>
                      <Pie
                        data={analytics.trafficSources}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="views"
                        nameKey="source"
                      >
                        {analytics.trafficSources.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${(index * 90) % 360}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent payload={[]} />} />
                    </RechartsPieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Content Type Performance Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Content Type Performance</CardTitle>
                  <CardDescription>Performance by content type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      views: {
                        label: 'Views',
                        color: 'hsl(var(--chart-1))',
                      },
                      count: {
                        label: 'Count',
                        color: 'hsl(var(--chart-2))',
                      },
                    }}
                    className="h-80"
                  >
                    <BarChart data={analytics.contentTypePerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent payload={[]} />} />
                      <Bar dataKey="views" fill="hsl(var(--chart-1))" name="Views" />
                      <Bar dataKey="count" fill="hsl(var(--chart-2))" name="Count" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* User Engagement Area Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>User Engagement</span>
                  </CardTitle>
                  <CardDescription>Daily user engagement metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      newUsers: {
                        label: 'New Users',
                        color: 'hsl(var(--chart-1))',
                      },
                      returningUsers: {
                        label: 'Returning Users',
                        color: 'hsl(var(--chart-2))',
                      },
                      sessionDuration: {
                        label: 'Session Duration (seconds)',
                        color: 'hsl(var(--chart-3))',
                      },
                    }}
                    className="h-80"
                  >
                    <AreaChart data={analytics.userEngagement}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent payload={[]} />} />
                      <Area
                        type="monotone"
                        dataKey="newUsers"
                        stackId="1"
                        stroke="hsl(var(--chart-1))"
                        fill="hsl(var(--chart-1))"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="returningUsers"
                        stackId="1"
                        stroke="hsl(var(--chart-2))"
                        fill="hsl(var(--chart-2))"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}