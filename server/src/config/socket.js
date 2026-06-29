import { Server } from 'socket.io';
import logger from '../utils/logger.js';

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || '*',
            methods: ['GET', 'POST']
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

        // Handle incoming messages
        socket.on('sendMessage', async (messageData) => {
            // Note: Toxicity check and DB save would happen here
            const { room, message } = messageData;
            io.to(room).emit('receiveMessage', message);
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
