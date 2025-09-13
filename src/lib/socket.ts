import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

// Store active user sessions
const activeUsers = new Map<string, any>();

// Real-time event types
export enum SocketEvents {
  // Connection events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  
  // Authentication
  AUTHENTICATE = 'authenticate',
  AUTH_SUCCESS = 'auth_success',
  AUTH_ERROR = 'auth_error',
  
  // Content events
  CONTENT_CREATED = 'content_created',
  CONTENT_UPDATED = 'content_updated',
  CONTENT_DELETED = 'content_deleted',
  CONTENT_PUBLISHED = 'content_published',
  
  // Site events
  SITE_CONNECTED = 'site_connected',
  SITE_DISCONNECTED = 'site_disconnected',
  SITE_SYNCED = 'site_synced',
  
  // User events
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline',
  USER_TYPING = 'user_typing',
  
  // Notification events
  NOTIFICATION = 'notification',
  NOTIFICATION_READ = 'notification_read',
  
  // System events
  SYSTEM_MESSAGE = 'system_message',
  ERROR = 'error'
}

// Global socket.io server instance
let io: Server | null = null;

export function getSocketServer(): Server | null {
  return io;
}

export function setupSocket(socketIOServer: Server) {
  io = socketIOServer;
  setupSocketHandlers();
}

function setupSocketHandlers() {
  if (!io) return;

  console.log('Socket.IO server setup complete');

  // Authentication middleware
  io.use((socket: any, next: any) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on(SocketEvents.CONNECT, (socket: any) => {
    console.log('Client connected:', socket.id);

    // Join user to their personal room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      
      // Add to active users
      activeUsers.set(socket.id, {
        userId: socket.userId,
        socketId: socket.id,
        userRole: socket.userRole || 'USER',
        joinedAt: new Date()
      });

      // Notify others that user is online
      socket.broadcast.emit(SocketEvents.USER_ONLINE, {
        userId: socket.userId,
        userRole: socket.userRole,
        socketId: socket.id
      });

      // Send auth success
      socket.emit(SocketEvents.AUTH_SUCCESS, {
        userId: socket.userId,
        userRole: socket.userRole
      });
    }

    // Handle content creation events
    socket.on(SocketEvents.CONTENT_CREATED, (data: any) => {
      if (!socket.userId) return;
      
      io?.emit(SocketEvents.CONTENT_CREATED, {
        ...data,
        createdBy: socket.userId,
        createdAt: new Date()
      });
    });

    // Handle content update events
    socket.on(SocketEvents.CONTENT_UPDATED, (data: any) => {
      if (!socket.userId) return;
      
      io?.emit(SocketEvents.CONTENT_UPDATED, {
        ...data,
        updatedBy: socket.userId,
        updatedAt: new Date()
      });
    });

    // Handle content publishing events
    socket.on(SocketEvents.CONTENT_PUBLISHED, (data: any) => {
      if (!socket.userId) return;
      
      io?.emit(SocketEvents.CONTENT_PUBLISHED, {
        ...data,
        publishedBy: socket.userId,
        publishedAt: new Date()
      });
    });

    // Handle site connection events
    socket.on(SocketEvents.SITE_CONNECTED, (data: any) => {
      if (!socket.userId) return;
      
      io?.emit(SocketEvents.SITE_CONNECTED, {
        ...data,
        connectedBy: socket.userId,
        connectedAt: new Date()
      });
    });

    // Handle site sync events
    socket.on(SocketEvents.SITE_SYNCED, (data: any) => {
      if (!socket.userId) return;
      
      io?.emit(SocketEvents.SITE_SYNCED, {
        ...data,
        syncedBy: socket.userId,
        syncedAt: new Date()
      });
    });

    // Handle notification events
    socket.on(SocketEvents.NOTIFICATION, (data: any) => {
      if (!socket.userId) return;
      
      // Send to specific user if targetUserId is provided
      if (data.targetUserId) {
        io?.to(`user:${data.targetUserId}`).emit(SocketEvents.NOTIFICATION, {
          ...data,
          fromUserId: socket.userId,
          createdAt: new Date()
        });
      } else {
        // Broadcast to all users
        io?.emit(SocketEvents.NOTIFICATION, {
          ...data,
          fromUserId: socket.userId,
          createdAt: new Date()
        });
      }
    });

    socket.on(SocketEvents.DISCONNECT, () => {
      console.log('Client disconnected:', socket.id);
      
      // Remove from active users
      if (socket.userId) {
        activeUsers.delete(socket.id);
        
        // Notify others that user is offline
        socket.broadcast.emit(SocketEvents.USER_OFFLINE, {
          userId: socket.userId,
          socketId: socket.id
        });
      }
    });

    // Error handling
    socket.on('error', (error: any) => {
      console.error('Socket error:', error);
      socket.emit(SocketEvents.ERROR, {
        message: 'An error occurred',
        timestamp: new Date()
      });
    });
  });

  console.log('Socket.IO event handlers registered');
}

// Export utility functions for use in API routes
export const socketUtils = {
  sendNotificationToUser: (userId: string, notification: any) => {
    if (!io) return;
    io.to(`user:${userId}`).emit(SocketEvents.NOTIFICATION, {
      ...notification,
      createdAt: new Date()
    });
  },
  
  broadcastToAdmins: (event: string, data: any) => {
    if (!io) return;
    activeUsers.forEach((user) => {
      if (user.userRole === 'ADMIN' || user.userRole === 'SUPER_ADMIN') {
        io.to(`user:${user.userId}`).emit(event, data);
      }
    });
  },
  
  getActiveUsers: () => {
    return Array.from(activeUsers.values());
  }
};