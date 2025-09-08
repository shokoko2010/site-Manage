import { Server } from 'socket.io';

export function setupSocket(io: Server) {
  console.log('Socket.IO server setup complete');

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Handle custom events
    socket.on('message', (data) => {
      console.log('Message received:', data);
      // Broadcast to all clients
      io.emit('message', data);
    });
  });
}