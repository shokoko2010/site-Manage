import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { JwtPayload } from 'jsonwebtoken';
import { 
  AppError, 
  ErrorCodes, 
  handleApiError, 
  createUnauthorizedError, 
  createValidationError, 
  createNotFoundError, 
  createConflictError 
} from '@/lib/error-handling';

interface SiteStats {
  posts: number;
  pages: number;
  products: number;
}

interface SiteWithStats extends ReturnType<typeof db.wordPressSite.findFirst> {
  stats: SiteStats;
  _count: {
    content: Array<{
      type: string;
    }>;
  };
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createUnauthorizedError('Authorization token required');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as JwtPayload & { userId: string };

    const sites = await db.wordPressSite.findMany({
      where: { userId: decoded.userId },
      include: {
        _count: {
          select: {
            content: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add stats to each site
    const sitesWithStats = sites.map(site => ({
      ...site,
      stats: {
        posts: site._count.content || 0,
        pages: 0, // TODO: Implement pages count when pages are added to the system
        products: site._count.content.filter(c => c.type === 'PRODUCT').length || 0
      }
    }));

    return NextResponse.json({
      sites: sitesWithStats
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
      }
    });

  } catch (error) {
    const appError = handleApiError(error);
    return NextResponse.json(
      { 
        error: appError.message,
        code: appError.code,
        details: appError.details 
      },
      { status: appError.statusCode }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createUnauthorizedError('Authorization token required');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as JwtPayload & { userId: string };

    const { url, name, isVirtual, username, appPassword } = await request.json();

    if (!url || !name) {
      throw createValidationError('URL and name are required');
    }

    // Check user's plan limits
    const user = await db.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      throw createNotFoundError('User');
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
      throw createConflictError('Site limit reached for your plan');
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
    const appError = handleApiError(error);
    return NextResponse.json(
      { 
        error: appError.message,
        code: appError.code,
        details: appError.details 
      },
      { status: appError.statusCode }
    );
  }
}