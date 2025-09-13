import { NextRequest, NextResponse } from 'next/server';
import { Server } from 'socket.io';
import { getSocketServer, socketUtils } from '@/lib/socket';
import jwt from 'jsonwebtoken';

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

    const { event, data, targetUserId } = await request.json();

    if (!event || !data) {
      return NextResponse.json(
        { error: 'Event and data are required' },
        { status: 400 }
      );
    }

    const io = getSocketServer();
    if (!io) {
      return NextResponse.json(
        { error: 'Socket.IO server not available' },
        { status: 500 }
      );
    }

    // Broadcast the event based on the target
    if (targetUserId) {
      // Send to specific user
      socketUtils.sendNotificationToUser(targetUserId, {
        ...data,
        event,
        sentBy: decoded.id,
        sentAt: new Date()
      });
    } else {
      // Broadcast to all connected clients
      io.emit(event, {
        ...data,
        sentBy: decoded.id,
        sentAt: new Date()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Event broadcast successfully',
      event,
      target: targetUserId || 'all'
    });

  } catch (error) {
    console.error('Socket broadcast error:', error);
    return NextResponse.json(
      { 
        error: 'Socket broadcast error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to send real-time notifications (can be imported and used in other API routes)
export async function sendRealtimeNotification(
  userId: string, 
  notification: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    actionUrl?: string;
  }
) {
  socketUtils.sendNotificationToUser(userId, {
    ...notification,
    createdAt: new Date()
  });
}

// Helper function to broadcast content updates
export async function broadcastContentUpdate(
  event: 'content_created' | 'content_updated' | 'content_published',
  contentData: any
) {
  const io = getSocketServer();
  if (!io) return;

  io.emit(event, {
    ...contentData,
    timestamp: new Date()
  });
}

// Helper function to broadcast site events
export async function broadcastSiteEvent(
  event: 'site_connected' | 'site_disconnected' | 'site_synced',
  siteData: any
) {
  const io = getSocketServer();
  if (!io) return;

  io.emit(event, {
    ...siteData,
    timestamp: new Date()
  });
}