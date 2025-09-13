import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const lastCheck = searchParams.get('lastCheck');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get notifications for the user
    const notifications = await db.notification.findMany({
      where: {
        userId: userId,
        read: false,
        ...(lastCheck && {
          createdAt: {
            gte: new Date(lastCheck)
          }
        })
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    // Get recent activities for the user
    const activities = await db.activity.findMany({
      where: {
        userId: userId,
        ...(lastCheck && {
          createdAt: {
            gte: new Date(lastCheck)
          }
        })
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20,
      include: {
        content: {
          select: {
            id: true,
            title: true,
            type: true
          }
        },
        site: {
          select: {
            id: true,
            name: true,
            url: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        activities,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Notification polling error:', error);
    return NextResponse.json(
      { 
        error: 'Notification polling error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}