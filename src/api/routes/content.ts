import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { validateContent, handleValidation } from '../middleware/validation';

const router = express.Router();
const prisma = new PrismaClient();

// Get all content for the authenticated user
router.get('/', authenticateToken, requirePermission('view_own_content'), async (req, res) => {
  try {
    const { 
      type, 
      status, 
      siteId, 
      page = 1, 
      limit = 20, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc' 
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build filters
    const where: any = {
      userId: req.user!.id,
    };

    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }
    if (siteId) {
      where.siteId = siteId;
    }
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { metaDescription: { contains: search as string, mode: 'insensitive' } },
        { body: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Build sort
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    const [content, total] = await Promise.all([
      prisma.generatedContent.findMany({
        where,
        include: {
          site: {
            select: {
              id: true,
              name: true,
              url: true,
            }
          },
          tags: {
            include: {
              tag: true,
            }
          },
          categories: {
            include: {
              category: true,
            }
          },
          _count: {
            select: {
              analytics: true,
            }
          }
        },
        orderBy,
        skip,
        take: Number(limit),
      }),
      prisma.generatedContent.count({ where }),
    ]);

    res.json({
      content,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific content item
router.get('/:id', authenticateToken, requirePermission('view_own_content'), async (req, res) => {
  try {
    const { id } = req.params;

    const content = await prisma.generatedContent.findFirst({
      where: { 
        id,
        userId: req.user!.id 
      },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            url: true,
          }
        },
        tags: {
          include: {
            tag: true,
          }
        },
        categories: {
          include: {
            category: true,
          }
        },
        analytics: {
          orderBy: { date: 'desc' },
          take: 30, // Last 30 days of analytics
        }
      }
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json({ content });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new content
router.post('/', authenticateToken, requirePermission('create_content'), validateContent, handleValidation, async (req, res) => {
  try {
    const {
      type,
      title,
      body,
      metaDescription,
      language,
      siteId,
      featuredImage,
      scheduledFor,
      tags,
      categories,
    } = req.body;

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists for this user
    const existingContent = await prisma.generatedContent.findFirst({
      where: {
        userId: req.user!.id,
        slug,
      }
    });

    if (existingContent) {
      // Append timestamp to make slug unique
      const uniqueSlug = `${slug}-${Date.now()}`;
      slug = uniqueSlug;
    }

    // Create content
    const content = await prisma.generatedContent.create({
      data: {
        userId: req.user!.id,
        type,
        title,
        slug,
        body,
        metaDescription,
        language: language || 'ENGLISH',
        siteId,
        featuredImage,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      }
    });

    // Add tags if provided
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        let tag = await prisma.tag.findUnique({
          where: { name: tagName }
        });

        if (!tag) {
          tag = await prisma.tag.create({
            data: {
              name: tagName,
              slug: tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            }
          });
        }

        await prisma.contentTag.create({
          data: {
            contentId: content.id,
            tagId: tag.id,
          }
        });
      }
    }

    // Add categories if provided
    if (categories && categories.length > 0) {
      for (const categoryName of categories) {
        let category = await prisma.category.findUnique({
          where: { name: categoryName }
        });

        if (!category) {
          category = await prisma.category.create({
            data: {
              name: categoryName,
              slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            }
          });
        }

        await prisma.contentCategory.create({
          data: {
            contentId: content.id,
            categoryId: category.id,
          }
        });
      }
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user!.id,
        contentId: content.id,
        action: 'CREATE_CONTENT',
        metadata: { title: content.title, type: content.type },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      }
    });

    // Get the complete content with relations
    const completeContent = await prisma.generatedContent.findUnique({
      where: { id: content.id },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            url: true,
          }
        },
        tags: {
          include: {
            tag: true,
          }
        },
        categories: {
          include: {
            category: true,
          }
        }
      }
    });

    res.status(201).json({
      message: 'Content created successfully',
      content: completeContent,
    });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update content
router.put('/:id', authenticateToken, requirePermission('edit_own_content'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      body,
      metaDescription,
      status,
      featuredImage,
      scheduledFor,
      tags,
      categories,
    } = req.body;

    // Check if content exists and belongs to user
    const existingContent = await prisma.generatedContent.findFirst({
      where: { 
        id,
        userId: req.user!.id 
      }
    });

    if (!existingContent) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Update slug if title changed
    let newSlug = existingContent.slug;
    if (title && title !== existingContent.title) {
      newSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if new slug already exists
      const slugExists = await prisma.generatedContent.findFirst({
        where: {
          userId: req.user!.id,
          slug: newSlug,
          id: { not: id },
        }
      });

      if (slugExists) {
        newSlug = `${newSlug}-${Date.now()}`;
      }
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (newSlug !== undefined) updateData.slug = newSlug;
    if (body !== undefined) updateData.body = body;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'PUBLISHED' && existingContent.status !== 'PUBLISHED') {
        updateData.publishedAt = new Date();
      }
    }
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
    if (scheduledFor !== undefined) updateData.scheduledFor = scheduledFor ? new Date(scheduledFor) : null;

    const content = await prisma.generatedContent.update({
      where: { id },
      data: updateData,
    });

    // Update tags if provided
    if (tags !== undefined) {
      // Remove existing tags
      await prisma.contentTag.deleteMany({
        where: { contentId: id }
      });

      // Add new tags
      for (const tagName of tags) {
        let tag = await prisma.tag.findUnique({
          where: { name: tagName }
        });

        if (!tag) {
          tag = await prisma.tag.create({
            data: {
              name: tagName,
              slug: tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            }
          });
        }

        await prisma.contentTag.create({
          data: {
            contentId: id,
            tagId: tag.id,
          }
        });
      }
    }

    // Update categories if provided
    if (categories !== undefined) {
      // Remove existing categories
      await prisma.contentCategory.deleteMany({
        where: { contentId: id }
      });

      // Add new categories
      for (const categoryName of categories) {
        let category = await prisma.category.findUnique({
          where: { name: categoryName }
        });

        if (!category) {
          category = await prisma.category.create({
            data: {
              name: categoryName,
              slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            }
          });
        }

        await prisma.contentCategory.create({
          data: {
            contentId: id,
            categoryId: category.id,
          }
        });
      }
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user!.id,
        contentId: content.id,
        action: 'UPDATE_CONTENT',
        metadata: { title: content.title, type: content.type },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      }
    });

    // Get the complete content with relations
    const completeContent = await prisma.generatedContent.findUnique({
      where: { id: content.id },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            url: true,
          }
        },
        tags: {
          include: {
            tag: true,
          }
        },
        categories: {
          include: {
            category: true,
          }
        }
      }
    });

    res.json({
      message: 'Content updated successfully',
      content: completeContent,
    });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete content
router.delete('/:id', authenticateToken, requirePermission('delete_own_content'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if content exists and belongs to user
    const content = await prisma.generatedContent.findFirst({
      where: { 
        id,
        userId: req.user!.id 
      }
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    await prisma.generatedContent.delete({
      where: { id }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE_CONTENT',
        metadata: { title: content.title, type: content.type },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      }
    });

    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Publish content
router.post('/:id/publish', authenticateToken, requirePermission('edit_own_content'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if content exists and belongs to user
    const content = await prisma.generatedContent.findFirst({
      where: { 
        id,
        userId: req.user!.id 
      }
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const updatedContent = await prisma.generatedContent.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user!.id,
        contentId: content.id,
        action: 'PUBLISH_CONTENT',
        metadata: { title: content.title, type: content.type },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      }
    });

    res.json({
      message: 'Content published successfully',
      content: updatedContent,
    });
  } catch (error) {
    console.error('Publish content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get content analytics
router.get('/:id/analytics', authenticateToken, requirePermission('view_analytics'), async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Check if content exists and belongs to user
    const content = await prisma.generatedContent.findFirst({
      where: { 
        id,
        userId: req.user!.id 
      }
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    const analytics = await prisma.contentAnalytics.findMany({
      where: {
        contentId: id,
        date: dateFilter,
      },
      orderBy: { date: 'desc' }
    });

    res.json({ analytics });
  } catch (error) {
    console.error('Get content analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;