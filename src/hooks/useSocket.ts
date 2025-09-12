"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '@/lib/socket';

interface UseSocketOptions {
  autoConnect?: boolean;
  enableReconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  lastMessage: any;
  activeUsers: any[];
  notifications: any[];
  connect: () => void;
  disconnect: () => void;
  sendMessage: (event: string, data: any) => void;
  sendNotification: (data: any) => void;
  onContentCreated: (callback: (data: any) => void) => void;
  onContentUpdated: (callback: (data: any) => void) => void;
  onContentPublished: (callback: (data: any) => void) => void;
  onNotification: (callback: (data: any) => void) => void;
  onUserOnline: (callback: (data: any) => void) => void;
  onUserOffline: (callback: (data: any) => void) => void;
  onError: (callback: (data: any) => void) => void;
}

export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const {
    autoConnect = true,
    enableReconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Initialize socket connection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      path: '/api/socketio',
      autoConnect: false,
      reconnection: enableReconnection,
      reconnectionAttempts,
      reconnectionDelay,
      auth: {
        token
      }
    });

    socketRef.current = socket;

    // Connection events
    socket.on(SocketEvents.CONNECT, () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socket.on(SocketEvents.DISCONNECT, () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    // Authentication events
    socket.on(SocketEvents.AUTH_SUCCESS, (data) => {
      console.log('Socket authenticated:', data);
    });

    socket.on(SocketEvents.AUTH_ERROR, (error) => {
      console.error('Socket authentication error:', error);
    });

    // Content events
    socket.on(SocketEvents.CONTENT_CREATED, (data) => {
      setLastMessage({ event: SocketEvents.CONTENT_CREATED, data });
    });

    socket.on(SocketEvents.CONTENT_UPDATED, (data) => {
      setLastMessage({ event: SocketEvents.CONTENT_UPDATED, data });
    });

    socket.on(SocketEvents.CONTENT_PUBLISHED, (data) => {
      setLastMessage({ event: SocketEvents.CONTENT_PUBLISHED, data });
    });

    // User events
    socket.on(SocketEvents.USER_ONLINE, (data) => {
      setActiveUsers(prev => {
        const exists = prev.find(user => user.userId === data.userId);
        if (!exists) {
          return [...prev, data];
        }
        return prev;
      });
    });

    socket.on(SocketEvents.USER_OFFLINE, (data) => {
      setActiveUsers(prev => prev.filter(user => user.userId !== data.userId));
    });

    // Notification events
    socket.on(SocketEvents.NOTIFICATION, (data) => {
      setNotifications(prev => [...prev, data]);
      setLastMessage({ event: SocketEvents.NOTIFICATION, data });
    });

    // Error events
    socket.on(SocketEvents.ERROR, (error) => {
      console.error('Socket error:', error);
      setLastMessage({ event: SocketEvents.ERROR, error });
    });

    // Auto-connect if enabled
    if (autoConnect) {
      socket.connect();
    }

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [autoConnect, enableReconnection, reconnectionAttempts, reconnectionDelay]);

  const connect = useCallback(() => {
    if (socketRef.current && !isConnected) {
      socketRef.current.connect();
    }
  }, [isConnected]);

  const disconnect = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.disconnect();
    }
  }, [isConnected]);

  const sendMessage = useCallback((event: string, data: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  }, [isConnected]);

  const sendNotification = useCallback((data: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(SocketEvents.NOTIFICATION, data);
    }
  }, [isConnected]);

  // Event listeners
  const onContentCreated = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(SocketEvents.CONTENT_CREATED, callback);
    }
  }, []);

  const onContentUpdated = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(SocketEvents.CONTENT_UPDATED, callback);
    }
  }, []);

  const onContentPublished = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(SocketEvents.CONTENT_PUBLISHED, callback);
    }
  }, []);

  const onNotification = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(SocketEvents.NOTIFICATION, callback);
    }
  }, []);

  const onUserOnline = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(SocketEvents.USER_ONLINE, callback);
    }
  }, []);

  const onUserOffline = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(SocketEvents.USER_OFFLINE, callback);
    }
  }, []);

  const onError = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(SocketEvents.ERROR, callback);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    lastMessage,
    activeUsers,
    notifications,
    connect,
    disconnect,
    sendMessage,
    sendNotification,
    onContentCreated,
    onContentUpdated,
    onContentPublished,
    onNotification,
    onUserOnline,
    onUserOffline,
    onError
  };
}

// Hook for sending real-time updates from API routes
export function useSocketServer() {
  const sendRealTimeUpdate = useCallback(async (event: string, data: any) => {
    try {
      await fetch('/api/socket/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ event, data })
      });
    } catch (error) {
      console.error('Failed to send real-time update:', error);
    }
  }, []);

  return { sendRealTimeUpdate };
}