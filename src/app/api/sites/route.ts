import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;

    const sites = await db.wordPressSite.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      sites
    });

  } catch (error) {
    console.error('Get sites error:', error);
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;

    const { url, name, isVirtual, username, appPassword } = await request.json();

    if (!url || !name) {
      return NextResponse.json(
        { error: 'URL and name are required' },
        { status: 400 }
      );
    }

    // Check user's plan limits
    const user = await db.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const currentSites = await db.wordPressSite.count({
      where: { userId: decoded.userId }
    });

    const siteLimits = {
      FREE: 1,
      BASIC: 3,
      PREMIUM: 10,
      ENTERPRISE: Infinity
    };

    if (currentSites >= siteLimits[user.plan]) {
      return NextResponse.json(
        { error: 'Site limit reached for your plan' },
        { status: 403 }
      );
    }

    const site = await db.wordPressSite.create({
      data: {
        userId: decoded.userId,
        url,
        name,
        isVirtual: isVirtual || false,
        username: isVirtual ? null : username,
        appPassword: isVirtual ? null : appPassword
      }
    });

    // Log activity
    await db.activity.create({
      data: {
        userId: decoded.userId,
        siteId: site.id,
        action: 'ADD_SITE',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      message: 'Site created successfully',
      site
    });

  } catch (error) {
    console.error('Create site error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}