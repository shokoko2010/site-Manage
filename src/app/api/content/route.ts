import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { z } from 'zod';
import { JwtPayload } from 'jsonwebtoken';

interface ContentData {
  title: string;
  content?: string;
  body?: string;
  type: 'ARTICLE' | 'PRODUCT' | 'CAMPAIGN';
  metaDescription?: string;
  language?: 'ENGLISH' | 'ARABIC' | 'FRENCH' | 'SPANISH' | 'GERMAN' | 'JAPANESE';
  featuredImage?: string;
  siteId?: string;
  scheduledFor?: string;
  tagIds?: string[];
  categoryIds?: string[];
}

interface ContentWhereClause {
  userId: string;
  type?: string;
  status?: string;
  siteId?: string;
}

const contentSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  type: z.enum(['ARTICLE', 'PRODUCT', 'CAMPAIGN']),
  metaDescription: z.string().optional(),
  language: z.enum(['ENGLISH', 'ARABIC', 'FRENCH', 'SPANISH', 'GERMAN', 'JAPANESE']).optional(),
  featuredImage: z.string().optional(),
  siteId: z.string().optional(),
  scheduledFor: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional()
});

// Helper function to transform frontend data to match schema
function transformContentData(data: ContentData) {
  return {
    ...data,
    body: data.content || data.body, // Map 'content' to 'body'
  };
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as JwtPayload & { userId: string };

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const siteId = searchParams.get('siteId');

    const skip = (page - 1) * limit;

    const where: ContentWhereClause = {
      userId: decoded.userId
    };

    if (type) where.type = type;
    if (status) where.status = status;
    if (siteId) where.siteId = siteId;

    const [content, total] = await Promise.all([
      db.generatedContent.findMany({
        where,
        include: {
          site: {
            select: { id: true, name: true, url: true }
          },
          tags: {
            include: {
              tag: true
            }
          },
          categories: {
            include: {
              category: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.generatedContent.count({ where })
    ]);

    return NextResponse.json({
      content,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=15'
      }
    });

  } catch (error) {
    console.error('Get content error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as JwtPayload & { userId: string };

    const body = await request.json();
    const transformedData = transformContentData(body);
    const validatedData = contentSchema.parse(transformedData);

    const user = await db.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check user's plan limits
    const currentContent = await db.generatedContent.count({
      where: { userId: decoded.userId }
    });

    const contentLimits = {
      FREE: 10,
      BASIC: 50,
      PREMIUM: 200,
      ENTERPRISE: Infinity
    };

    if (currentContent >= contentLimits[user.plan]) {
      return NextResponse.json(
        { error: 'Content limit reached for your plan' },
        { status: 403 }
      );
    }

    // Generate slug from title
    const slug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const content = await db.generatedContent.create({
      data: {
        userId: decoded.userId,
        title: validatedData.title,
        body: validatedData.body,
        type: validatedData.type,
        metaDescription: validatedData.metaDescription,
        language: validatedData.language || 'ENGLISH',
        featuredImage: validatedData.featuredImage,
        siteId: validatedData.siteId,
        scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : null,
        slug,
        status: 'DRAFT'
      }
    });

    // Add tags if provided
    if (validatedData.tagIds && validatedData.tagIds.length > 0) {
      await db.contentTag.createMany({
        data: validatedData.tagIds.map((tagId: string) => ({
          contentId: content.id,
          tagId
        }))
      });
    }

    // Add categories if provided
    if (validatedData.categoryIds && validatedData.categoryIds.length > 0) {
      await db.contentCategory.createMany({
        data: validatedData.categoryIds.map((categoryId: string) => ({
          contentId: content.id,
          categoryId
        }))
      });
    }

    // Log activity
    await db.activity.create({
      data: {
        userId: decoded.userId,
        contentId: content.id,
        action: 'CREATE_CONTENT',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      message: 'Content created successfully',
      content
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create content error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}