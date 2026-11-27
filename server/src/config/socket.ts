import { Server as HttpServer } from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import logger from '../utils/logger.js';
import Message, { MessageChannel, MessageType } from '../modules/message/message.model.js';
import Notification from '../modules/notification/notification.model.js';
import User, { UserRole } from '../modules/user/user.model.js';
import { checkToxicity } from '../services/aiModeration.js';

interface SocketMessagePayload {
    room: string;
    message: {
        senderId: string;
        sender: string;
        role?: UserRole;
        text: string;
        type?: MessageType;
        lat?: string | number;
        lng?: string | number;
        [key: string]: unknown;
    };
}

let io: Server | undefined;

export const getIo = (): Server => {
    if (!io) {
        throw new Error('Socket.io is not initialized');
    }
    return io;
};

export const initSocket = (server: HttpServer): Server => {
    io = new Server(server, {
        cors: {
            origin: [
                process.env.CLIENT_URL || 'http://localhost:5173',
                'http://localhost:5173',
                'http://localhost:5000',
                '*'
            ],
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        logger.info(`New client connected via Socket.io: ${socket.id}`);

        socket.on('joinRoom', (room: string) => {
            socket.join(room);
            logger.info(`Socket ${socket.id} joined room ${room}`);

            const clients = io?.sockets.adapter.rooms.get(room);
            const numClients = clients ? clients.size : 0;
            io?.to(room).emit('roomData', { room, onlineCount: numClients });
        });

        socket.on('join', (userId: string) => {
            if (userId) {
                socket.join(userId);
                logger.info(`Socket ${socket.id} joined personal room ${userId}`);
            }
        });

        socket.on('joinAdminRoom', () => {
            socket.join('admin_room');
            logger.info(`Socket ${socket.id} joined admin_room`);
        });

        socket.on('sendMessage', async (messageData: SocketMessagePayload) => {
            try {
                const { room, message } = messageData;
                let channelName: MessageChannel = 'general';
                if (room === 'local-community-authority') channelName = 'ask-authority';
                if (room === 'local-community-announcements') channelName = 'announcements';

                const toxicityCheck = await checkToxicity(message.text);
                if (toxicityCheck.isToxic) {
                    const user = await User.findById(message.senderId);

                    if (user) {
                        user.strikes = (user.strikes || 0) + 1;
                        if (user.strikes === 1) {
                            user.banUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
                        } else if (user.strikes === 2) {
                            user.banUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                        } else if (user.strikes >= 3) {
                            user.isBanned = true;
                        }

                        user.restrictedFeatures = ['community'];

                        await user.save({ validateBeforeSave: false });
                    }

                    socket.emit('bannedNotification', {
                        message: "Your message was flagged as highly toxic or abusive. A strike has been added to your account.",
                        reason: toxicityCheck.reason,
                        strikes: user?.strikes || 1
                    });

                    logger.warn(`User ${message.senderId} message blocked for toxicity. Strikes: ${user?.strikes}`);
                    return;
                }

                let locationObj: { type: 'Point'; coordinates: [number, number] } | undefined;
                if (message.lat && message.lng) {
                    locationObj = {
                        type: 'Point',
                        coordinates: [parseFloat(String(message.lng)), parseFloat(String(message.lat))]
                    };
                }

                const newMessage = await Message.create({
                    sender: new mongoose.Types.ObjectId(message.senderId),
                    senderName: message.sender,
                    senderRole: message.role || 'Citizen',
                    channel: channelName,
                    content: message.text,
                    type: message.type || 'Text',
                    ...(locationObj && { location: locationObj })
                });

                const emittedMessage = {
                    ...message,
                    _id: newMessage._id,
                    createdAt: newMessage.createdAt,
                    channel: channelName,
                    type: newMessage.type
                };

                io?.to(room).emit('receiveMessage', emittedMessage);

                const senderObjectId = new mongoose.Types.ObjectId(message.senderId);
                const users = await User.find({ _id: { $ne: senderObjectId } }).select('_id');
                const dbNotifications = users.map((u) => ({
                    recipient: u._id.toString(),
                    sender: senderObjectId,
                    title: `New message in ${channelName}`,
                    message: `${message.sender}: ${message.text.substring(0, 40)}${message.text.length > 40 ? '...' : ''}`,
                    type: 'Community Chat Mention' as const,
                    actionUrl: '/community'
                }));

                let savedNotifications: unknown[] = [];
                if (dbNotifications.length > 0) {
                    savedNotifications = await Notification.insertMany(dbNotifications);
                }

                logger.info(`Saved ${savedNotifications.length} chat notifications to DB and broadcasting...`);

                socket.to(room).emit('notification', {
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

        socket.on('typing', (data: { room: string; user: unknown }) => {
            socket.to(data.room).emit('userTyping', data.user);
        });

        socket.on('editMessage', (data: { room: string; messageId: string; newText: string; channel: string }) => {
            const { room, messageId, newText, channel } = data;
            io?.to(room).emit('messageEdited', { _id: messageId, text: newText, channel, isEdited: true });
        });

        socket.on('deleteMessage', (data: { room: string; messageId: string; channel: string }) => {
            const { room, messageId, channel } = data;
            io?.to(room).emit('messageDeleted', { _id: messageId, channel });
        });

        socket.on('disconnecting', () => {
            for (const room of socket.rooms) {
                if (room !== socket.id) {
                    const clients = io?.sockets.adapter.rooms.get(room);
                    const numClients = clients ? clients.size - 1 : 0;
                    io?.to(room).emit('roomData', { room, onlineCount: numClients });
                }
            }
        });

        socket.on('disconnect', () => {
            logger.info(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = (): Server => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
