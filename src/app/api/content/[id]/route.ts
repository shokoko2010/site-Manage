import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { z } from 'zod';

const contentUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).optional(),
  type: z.enum(['ARTICLE', 'PRODUCT', 'CAMPAIGN']).optional(),
  metaDescription: z.string().optional(),
  language: z.enum(['ENGLISH', 'ARABIC', 'FRENCH', 'SPANISH', 'GERMAN', 'JAPANESE']).optional(),
  featuredImage: z.string().optional(),
  siteId: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'PENDING', 'SCHEDULED', 'ARCHIVED']).optional(),
  scheduledFor: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional()
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;

    const content = await db.generatedContent.findFirst({
      where: { 
        id: params.id,
        userId: decoded.userId 
      },
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
        },
        analytics: {
          orderBy: { date: 'desc' },
          take: 30
        }
      }
    });

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      content
    });

  } catch (error) {
    console.error('Get content error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;

    const body = await request.json();
    const validatedData = contentUpdateSchema.parse(body);

    // Check if content exists and belongs to user
    const existingContent = await db.generatedContent.findFirst({
      where: { 
        id: params.id,
        userId: decoded.userId 
      }
    });

    if (!existingContent) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Update slug if title is changed
    let updateData: any = { ...validatedData };
    if (validatedData.title) {
      updateData.slug = validatedData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    if (validatedData.scheduledFor) {
      updateData.scheduledFor = new Date(validatedData.scheduledFor);
    }

    const updatedContent = await db.generatedContent.update({
      where: { id: params.id },
      data: updateData
    });

    // Update tags if provided
    if (validatedData.tagIds !== undefined) {
      // Remove existing tags
      await db.contentTag.deleteMany({
        where: { contentId: params.id }
      });

      // Add new tags
      if (validatedData.tagIds.length > 0) {
        await db.contentTag.createMany({
          data: validatedData.tagIds.map((tagId: string) => ({
            contentId: params.id,
            tagId
          }))
        });
      }
    }

    // Update categories if provided
    if (validatedData.categoryIds !== undefined) {
      // Remove existing categories
      await db.contentCategory.deleteMany({
        where: { contentId: params.id }
      });

      // Add new categories
      if (validatedData.categoryIds.length > 0) {
        await db.contentCategory.createMany({
          data: validatedData.categoryIds.map((categoryId: string) => ({
            contentId: params.id,
            categoryId
          }))
        });
      }
    }

    // Log activity
    await db.activity.create({
      data: {
        userId: decoded.userId,
        contentId: params.id,
        action: 'UPDATE_CONTENT',
        metadata: { changes: validatedData },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      message: 'Content updated successfully',
      content: updatedContent
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update content error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;

    // Check if content exists and belongs to user
    const content = await db.generatedContent.findFirst({
      where: { 
        id: params.id,
        userId: decoded.userId 
      }
    });

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    await db.generatedContent.delete({
      where: { id: params.id }
    });

    // Log activity
    await db.activity.create({
      data: {
        userId: decoded.userId,
        contentId: params.id,
        action: 'DELETE_CONTENT',
        metadata: { contentTitle: content.title },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      message: 'Content deleted successfully'
    });

  } catch (error) {
    console.error('Delete content error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}