const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const os = require('os');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Prisma
const prisma = new PrismaClient();

// Prepare the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store active connections by room
const roomConnections = new Map();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-room', async (room, playerId) => {
      console.log(`Client ${socket.id} joining room: ${room}`);
      socket.join(room);
      
      // Track connection in room
      if (!roomConnections.has(room)) {
        roomConnections.set(room, new Set());
      }
      roomConnections.get(room).add(socket.id);
      
      // Send recent messages to the client
      try {
        const chatRoom = await prisma.chatRoom.findFirst({
          where: { name: room }
        });
        
        if (chatRoom) {
          const messages = await prisma.chatMessage.findMany({
            where: { roomId: chatRoom.id },
            include: {
              player: {
                select: { name: true }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
          });
          
          const formattedMessages = messages.reverse().map((msg) => ({
            id: msg.id,
            playerName: msg.player.name,
            content: msg.content,
            messageType: msg.messageType,
            createdAt: msg.createdAt.toISOString()
          }));
          
          socket.emit('message-history', formattedMessages);
        }
      } catch (error) {
        console.error('Failed to load message history:', error);
      }
      
      console.log(`Client ${socket.id} joined room: ${room}`);
    });

    socket.on('leave-room', (room) => {
      console.log(`Client ${socket.id} leaving room: ${room}`);
      socket.leave(room);
      
      // Remove from room tracking
      roomConnections.get(room)?.delete(socket.id);
      if (roomConnections.get(room)?.size === 0) {
        roomConnections.delete(room);
      }
      
      console.log(`Client ${socket.id} left room: ${room}`);
    });

    socket.on('send-message', async (data) => {
      console.log('Message received:', data);
      
      try {
        // Save message to database
        const chatRoom = await prisma.chatRoom.findFirst({
          where: { name: data.room }
        });
        
        if (chatRoom) {
          const message = await prisma.chatMessage.create({
            data: {
              roomId: chatRoom.id,
              playerId: parseInt(data.playerId),
              content: data.content.trim(),
              messageType: 'TEXT'
            },
            include: {
              player: {
                select: { name: true }
              }
            }
          });
          
          // Broadcast message to all clients in the room
          const messageData = {
            id: message.id,
            playerName: message.player.name,
            content: message.content,
            messageType: message.messageType,
            createdAt: message.createdAt.toISOString()
          };
          
          io.to(data.room).emit('new-message', messageData);
          
          console.log(`Message saved and broadcasted to room: ${data.room}`);
        }
      } catch (error) {
        console.error('Failed to save/broadcast message:', error);
        socket.emit('message-error', { error: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Clean up room tracking
      for (const [room, connections] of roomConnections.entries()) {
        if (connections.has(socket.id)) {
          connections.delete(socket.id);
          if (connections.size === 0) {
            roomConnections.delete(room);
          }
        }
      }
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    
    // Get network interfaces
    const interfaces = os.networkInterfaces();
    const addresses = [];
    
    // Collect all IPv4 addresses
    Object.keys(interfaces).forEach((name) => {
      interfaces[name].forEach((interface) => {
        if (interface.family === 'IPv4' && !interface.internal) {
          addresses.push(interface.address);
        }
      });
    });
    
    console.log('\n🚀 Server is running!');
    console.log(`\n📍 Local:            http://localhost:${port}`);
    
    if (addresses.length > 0) {
      addresses.forEach((address) => {
        console.log(`📍 On Your Network:  http://${address}:${port}`);
      });
    }
    
    console.log(`\n🔌 Socket.IO server running on port ${port}`);
    console.log(`\n📝 Press Ctrl+C to stop the server\n`);
  });
}); 