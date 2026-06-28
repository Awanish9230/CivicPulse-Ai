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
