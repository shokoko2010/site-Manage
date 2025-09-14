import { getSocketServer, socketUtils } from '@/lib/socket';

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