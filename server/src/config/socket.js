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

                const User = (await import('../models/User.js')).default;
                const Notification = (await import('../models/Notification.js')).default;
                const mongoose = (await import('mongoose')).default;
                
                // Save to database for all users (except sender) so it persists in /notifications
                const senderObjectId = new mongoose.Types.ObjectId(message.senderId);
                const users = await User.find({ _id: { $ne: senderObjectId } }).select('_id');
                const dbNotifications = users.map(u => ({
                    recipient: u._id,
                    sender: message.senderId,
                    title: `New message in ${channelName}`,
                    message: `${message.sender}: ${message.text.substring(0, 40)}${message.text.length > 40 ? '...' : ''}`,
                    type: 'Community Chat Mention',
                    actionUrl: '/community'
                }));
                
                let savedNotifications = [];
                if (dbNotifications.length > 0) {
                    savedNotifications = await Notification.insertMany(dbNotifications);
                }

                logger.info(`Saved ${savedNotifications.length} chat notifications to DB and broadcasting...`);
                
                // We emit using io.to(room) so EVERYONE in the room (including sender) gets the live notification.
                // This makes it much easier to test the app without needing two accounts!
                io.to(room).emit('notification', {
                    _id: 'chat_' + Date.now(),
                    title: `New message in ${channelName}`,
                    message: `${message.sender}: ${message.text.substring(0, 40)}${message.text.length > 40 ? '...' : ''}`,
                    type: 'Community Chat Mention',
                    createdAt: new Date().toISOString(),
                    isRead: false,
                    actionUrl: '/community'
                });
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
