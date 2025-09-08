import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get user analytics dashboard
router.get('/dashboard', authenticateToken, requirePermission('view_analytics'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    // Get user analytics
    const userAnalytics = await prisma.userAnalytics.findMany({
      where: {
        userId: req.user!.id,
        date: dateFilter,
      },
      orderBy: { date: 'desc' }
    });

    // Get content statistics
    const contentStats = await prisma.generatedContent.groupBy({
      by: ['status', 'type'],
      where: {
        userId: req.user!.id,
        createdAt: dateFilter,
      },
      _count: {
        id: true,
      },
    });

    // Get site statistics
    const siteStats = await prisma.wordPressSite.findMany({
      where: {
        userId: req.user!.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        url: true,
        _count: {
          select: {
            content: true,
          }
        },
        analytics: {
          where: {
            date: dateFilter,
          },
          orderBy: { date: 'desc' },
          take: 1,
        }
      }
    });

    // Get top performing content
    const topContent = await prisma.generatedContent.findMany({
      where: {
        userId: req.user!.id,
        status: 'PUBLISHED',
      },
      include: {
        analytics: {
          where: dateFilter,
          orderBy: { views: 'desc' },
          take: 1,
        }
      },
      orderBy: {
        analytics: {
          _count: 'desc'
        }
      },
      take: 10,
    });

    // Calculate totals
    const totals = userAnalytics.reduce((acc, curr) => {
      acc.contentCreated += curr.contentCreated;
      acc.contentPublished += curr.contentPublished;
      acc.sitesConnected += curr.sitesConnected;
      acc.totalViews += curr.totalViews;
      acc.totalComments += curr.totalComments;
      return acc;
    }, {
      contentCreated: 0,
      contentPublished: 0,
      sitesConnected: 0,
      totalViews: 0,
      totalComments: 0,
    });

    res.json({
      userAnalytics,
      contentStats,
      siteStats,
      topContent,
      totals,
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user analytics over time
router.get('/user', authenticateToken, requirePermission('view_analytics'), async (req, res) => {
  try {
    const { startDate, endDate, granularity = 'daily' } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    let analytics = await prisma.userAnalytics.findMany({
      where: {
        userId: req.user!.id,
        date: dateFilter,
      },
      orderBy: { date: 'asc' },
    });

    // Group by granularity if needed
    if (granularity === 'weekly' || granularity === 'monthly') {
      const grouped = analytics.reduce((acc, item) => {
        const date = new Date(item.date);
        let key: string;
        
        if (granularity === 'weekly') {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
        } else {
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        }

        if (!acc[key]) {
          acc[key] = {
            date: key,
            contentCreated: 0,
            contentPublished: 0,
            sitesConnected: 0,
            totalViews: 0,
            totalComments: 0,
          };
        }

        acc[key].contentCreated += item.contentCreated;
        acc[key].contentPublished += item.contentPublished;
        acc[key].sitesConnected += item.sitesConnected;
        acc[key].totalViews += item.totalViews;
        acc[key].totalComments += item.totalComments;

        return acc;
      }, {} as any);

      analytics = Object.values(grouped);
    }

    res.json({ analytics });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get site analytics
router.get('/sites/:siteId', authenticateToken, requirePermission('view_analytics'), async (req, res) => {
  try {
    const { siteId } = req.params;
    const { startDate, endDate } = req.query;

    // Check if site exists and belongs to user
    const site = await prisma.wordPressSite.findFirst({
      where: {
        id: siteId,
        userId: req.user!.id,
        isActive: true,
      }
    });

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    const analytics = await prisma.siteAnalytics.findMany({
      where: {
        siteId,
        date: dateFilter,
      },
      orderBy: { date: 'desc' }
    });

    // Get content performance for this site
    const contentPerformance = await prisma.generatedContent.findMany({
      where: {
        siteId,
        userId: req.user!.id,
      },
      include: {
        analytics: {
          where: dateFilter,
          orderBy: { date: 'desc' },
          take: 1,
        }
      },
      orderBy: {
        analytics: {
          _count: 'desc'
        }
      },
      take: 20,
    });

    res.json({
      analytics,
      contentPerformance,
    });
  } catch (error) {
    console.error('Get site analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get content analytics
router.get('/content/:contentId', authenticateToken, requirePermission('view_analytics'), async (req, res) => {
  try {
    const { contentId } = req.params;
    const { startDate, endDate } = req.query;

    // Check if content exists and belongs to user
    const content = await prisma.generatedContent.findFirst({
      where: {
        id: contentId,
        userId: req.user!.id,
      }
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.ggte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    const analytics = await prisma.contentAnalytics.findMany({
      where: {
        contentId,
        date: dateFilter,
      },
      orderBy: { date: 'desc' }
    });

    // Calculate totals and averages
    const totals = analytics.reduce((acc, curr) => {
      acc.views += curr.views;
      acc.comments += curr.comments;
      acc.shares += curr.shares;
      acc.engagementScore += curr.engagementScore;
      acc.clickThroughRate += curr.clickThroughRate;
      return acc;
    }, {
      views: 0,
      comments: 0,
      shares: 0,
      engagementScore: 0,
      clickThroughRate: 0,
    });

    const averages = {
      views: analytics.length > 0 ? totals.views / analytics.length : 0,
      comments: analytics.length > 0 ? totals.comments / analytics.length : 0,
      shares: analytics.length > 0 ? totals.shares / analytics.length : 0,
      engagementScore: analytics.length > 0 ? totals.engagementScore / analytics.length : 0,
      clickThroughRate: analytics.length > 0 ? totals.clickThroughRate / analytics.length : 0,
    };

    res.json({
      analytics,
      totals,
      averages,
    });
  } catch (error) {
    console.error('Get content analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate analytics report
router.post('/report', authenticateToken, requirePermission('view_analytics'), async (req, res) => {
  try {
    const { startDate, endDate, type = 'user' } = req.body;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    let reportData: any = {};

    switch (type) {
      case 'user':
        // User performance report
        const userAnalytics = await prisma.userAnalytics.findMany({
          where: {
            userId: req.user!.id,
            date: dateFilter,
          },
          orderBy: { date: 'asc' },
        });

        const userContentStats = await prisma.generatedContent.groupBy({
          by: ['status', 'type'],
          where: {
            userId: req.user!.id,
            createdAt: dateFilter,
          },
          _count: {
            id: true,
          },
        });

        reportData = {
          type: 'user',
          period: { startDate, endDate },
          analytics: userAnalytics,
          contentStats: userContentStats,
          generatedAt: new Date(),
        };
        break;

      case 'sites':
        // Sites performance report
        const sites = await prisma.wordPressSite.findMany({
          where: {
            userId: req.user!.id,
            isActive: true,
          },
          include: {
            analytics: {
              where: dateFilter,
              orderBy: { date: 'desc' },
            },
            _count: {
              select: {
                content: true,
              }
            }
          }
        });

        reportData = {
          type: 'sites',
          period: { startDate, endDate },
          sites,
          generatedAt: new Date(),
        };
        break;

      case 'content':
        // Content performance report
        const content = await prisma.generatedContent.findMany({
          where: {
            userId: req.user!.id,
            createdAt: dateFilter,
          },
          include: {
            analytics: {
              where: dateFilter,
              orderBy: { date: 'desc' },
            },
            site: {
              select: {
                id: true,
                name: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
        });

        reportData = {
          type: 'content',
          period: { startDate, endDate },
          content,
          generatedAt: new Date(),
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    // Save report to database
    const report = await prisma.activity.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_SETTINGS',
        metadata: {
          type: 'analytics_report_generated',
          reportType: type,
          period: { startDate, endDate },
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      }
    });

    res.json({
      message: 'Analytics report generated successfully',
      report: reportData,
      reportId: report.id,
    });
  } catch (error) {
    console.error('Generate analytics report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;