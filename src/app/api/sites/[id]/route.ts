import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;

    const site = await db.wordPressSite.findFirst({
      where: { 
        id: id,
        userId: decoded.userId 
      },
      include: {
        content: true,
        analytics: {
          orderBy: { date: 'desc' },
          take: 30
        }
      }
    });

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      site
    });

  } catch (error) {
    console.error('Get site error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;

    const { url, name, isVirtual, username, appPassword, isActive } = await request.json();

    // Check if site exists and belongs to user
    const existingSite = await db.wordPressSite.findFirst({
      where: { 
        id: id,
        userId: decoded.userId 
      }
    });

    if (!existingSite) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    const updatedSite = await db.wordPressSite.update({
      where: { id: id },
      data: {
        url: url || existingSite.url,
        name: name || existingSite.name,
        isVirtual: isVirtual !== undefined ? isVirtual : existingSite.isVirtual,
        username: isVirtual ? null : (username || existingSite.username),
        appPassword: isVirtual ? null : (appPassword || existingSite.appPassword),
        isActive: isActive !== undefined ? isActive : existingSite.isActive
      }
    });

    // Log activity
    await db.activity.create({
      data: {
        userId: decoded.userId,
        siteId: id,
        action: 'UPDATE_SETTINGS',
        metadata: { changes: { url, name, isVirtual, isActive } },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      message: 'Site updated successfully',
      site: updatedSite
    });

  } catch (error) {
    console.error('Update site error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;

    // Check if site exists and belongs to user
    const site = await db.wordPressSite.findFirst({
      where: { 
        id: id,
        userId: decoded.userId 
      }
    });

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    await db.wordPressSite.delete({
      where: { id: id }
    });

    // Log activity
    await db.activity.create({
      data: {
        userId: decoded.userId,
        siteId: id,
        action: 'REMOVE_SITE',
        metadata: { siteName: site.name },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      message: 'Site deleted successfully'
    });

  } catch (error) {
    console.error('Delete site error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}