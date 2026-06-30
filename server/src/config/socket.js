import { Server } from 'socket.io';
import logger from '../utils/logger.js';
import Message from '../models/Message.js';

let io;

export const getIo = () => {
    if (!io) {
        throw new Error('Socket.io is not initialized');
    }
    return io;
};

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5000', '*'],
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        logger.info(`New client connected via Socket.io: ${socket.id}`);

        // Join a location-based room or complaint-specific room
        socket.on('joinRoom', (room) => {
            socket.join(room);
            logger.info(`Socket ${socket.id} joined room ${room}`);
            
            // Broadcast updated user count for this room
            const clients = io.sockets.adapter.rooms.get(room);
            const numClients = clients ? clients.size : 0;
            io.to(room).emit('roomData', { room, onlineCount: numClients });
        });

        // Join personal user room for real-time notifications
        socket.on('join', (userId) => {
            if (userId) {
                socket.join(userId);
                logger.info(`Socket ${socket.id} joined personal room ${userId}`);
            }
        });

        // Handle incoming messages
        socket.on('sendMessage', async (messageData) => {
            try {
                const { room, message } = messageData;
                const channelName = room === 'local-community-general' ? 'general' : 'ask-authority';
                
                // Save to database
                const newMessage = await Message.create({
                    sender: message.senderId,
                    senderName: message.sender, // Fix: frontend sends 'sender' not 'senderName'
                    channel: channelName,
                    content: message.text,
                    type: 'Text', // Or parse if you support image URLs directly
                });

                // Attach ID and timestamps to the emitted message
                const emittedMessage = {
                    ...message,
                    _id: newMessage._id,
                    createdAt: newMessage.createdAt,
                    channel: channelName
                };

                io.to(room).emit('receiveMessage', emittedMessage);
            } catch (error) {
                logger.error("Socket message error:", error);
            }
        });

        socket.on('typing', (data) => {
            socket.to(data.room).emit('userTyping', data.user);
        });

        socket.on('disconnecting', () => {
            // Broadcast count updates for rooms the user is leaving
            for (const room of socket.rooms) {
                if (room !== socket.id) {
                    const clients = io.sockets.adapter.rooms.get(room);
                    const numClients = clients ? clients.size - 1 : 0;
                    io.to(room).emit('roomData', { room, onlineCount: numClients });
                }
            }
        });

        socket.on('disconnect', () => {
            logger.info(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
