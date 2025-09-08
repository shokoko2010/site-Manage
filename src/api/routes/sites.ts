import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { validateSite, handleValidation } from '../middleware/validation';

const router = express.Router();
const prisma = new PrismaClient();

// Get all sites for the authenticated user
router.get('/', authenticateToken, requirePermission('view_dashboard'), async (req, res) => {
  try {
    const sites = await prisma.wordPressSite.findMany({
      where: { 
        userId: req.user!.id,
        isActive: true 
      },
      include: {
        _count: {
          select: {
            content: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ sites });
  } catch (error) {
    console.error('Get sites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific site
router.get('/:id', authenticateToken, requirePermission('view_dashboard'), async (req, res) => {
  try {
    const { id } = req.params;

    const site = await prisma.wordPressSite.findFirst({
      where: { 
        id,
        userId: req.user!.id,
        isActive: true 
      },
      include: {
        content: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            createdAt: true,
          }
        },
        _count: {
          select: {
            content: true,
          }
        }
      }
    });

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    res.json({ site });
  } catch (error) {
    console.error('Get site error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new site
router.post('/', authenticateToken, requirePermission('create_content'), validateSite, handleValidation, async (req, res) => {
  try {
    const { url, name, isVirtual, username, appPassword } = req.body;

    // Check if site already exists for this user
    const existingSite = await prisma.wordPressSite.findFirst({
      where: {
        userId: req.user!.id,
        url: url,
      }
    });

    if (existingSite) {
      return res.status(409).json({ error: 'Site already exists for this user' });
    }

    // For non-virtual sites, validate credentials
    if (!isVirtual && (!username || !appPassword)) {
      return res.status(400).json({ error: 'Username and app password are required for non-virtual sites' });
    }

    // Create site
    const site = await prisma.wordPressSite.create({
      data: {
        userId: req.user!.id,
        url: new URL(url).origin, // Normalize URL
        name: name || new URL(url).hostname,
        isVirtual: isVirtual || false,
        username: isVirtual ? null : username,
        appPassword: isVirtual ? null : appPassword,
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user!.id,
        siteId: site.id,
        action: 'ADD_SITE',
        metadata: { siteName: site.name },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      }
    });

    res.status(201).json({
      message: 'Site created successfully',
      site,
    });
  } catch (error) {
    console.error('Create site error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a site
router.put('/:id', authenticateToken, requirePermission('create_content'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isVirtual, username, appPassword } = req.body;

    // Check if site exists and belongs to user
    const existingSite = await prisma.wordPressSite.findFirst({
      where: { 
        id,
        userId: req.user!.id 
      }
    });

    if (!existingSite) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (isVirtual !== undefined) {
      updateData.isVirtual = isVirtual;
      updateData.username = isVirtual ? null : username || existingSite.username;
      updateData.appPassword = isVirtual ? null : appPassword || existingSite.appPassword;
    } else {
      if (username !== undefined) updateData.username = username;
      if (appPassword !== undefined) updateData.appPassword = appPassword;
    }

    const site = await prisma.wordPressSite.update({
      where: { id },
      data: updateData
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user!.id,
        siteId: site.id,
        action: 'UPDATE_SETTINGS',
        metadata: { siteName: site.name },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      }
    });

    res.json({
      message: 'Site updated successfully',
      site,
    });
  } catch (error) {
    console.error('Update site error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a site
router.delete('/:id', authenticateToken, requirePermission('create_content'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if site exists and belongs to user
    const site = await prisma.wordPressSite.findFirst({
      where: { 
        id,
        userId: req.user!.id 
      }
    });

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Soft delete by setting isActive to false
    await prisma.wordPressSite.update({
      where: { id },
      data: { isActive: false }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user!.id,
        siteId: site.id,
        action: 'REMOVE_SITE',
        metadata: { siteName: site.name },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      }
    });

    res.json({ message: 'Site deleted successfully' });
  } catch (error) {
    console.error('Delete site error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sync site with WordPress
router.post('/:id/sync', authenticateToken, requirePermission('view_own_content'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if site exists and belongs to user
    const site = await prisma.wordPressSite.findFirst({
      where: { 
        id,
        userId: req.user!.id,
        isActive: true 
      }
    });

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    if (site.isVirtual) {
      return res.status(400).json({ error: 'Cannot sync virtual sites' });
    }

    // Here you would implement the actual WordPress sync logic
    // For now, we'll just update the lastSyncedAt timestamp
    const updatedSite = await prisma.wordPressSite.update({
      where: { id },
      data: { lastSyncedAt: new Date() }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user!.id,
        siteId: site.id,
        action: 'SYNC_SITE',
        metadata: { siteName: site.name },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      }
    });

    res.json({
      message: 'Site sync initiated successfully',
      site: updatedSite,
    });
  } catch (error) {
    console.error('Sync site error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get site analytics
router.get('/:id/analytics', authenticateToken, requirePermission('view_analytics'), async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Check if site exists and belongs to user
    const site = await prisma.wordPressSite.findFirst({
      where: { 
        id,
        userId: req.user!.id,
        isActive: true 
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

    // Get analytics data
    const analytics = await prisma.siteAnalytics.findMany({
      where: {
        siteId: id,
        date: dateFilter,
      },
      orderBy: { date: 'desc' }
    });

    // Get content analytics
    const contentAnalytics = await prisma.contentAnalytics.findMany({
      where: {
        content: {
          siteId: id,
        },
        date: dateFilter,
      },
      include: {
        content: {
          select: {
            id: true,
            title: true,
            type: true,
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json({
      analytics,
      contentAnalytics,
    });
  } catch (error) {
    console.error('Get site analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;