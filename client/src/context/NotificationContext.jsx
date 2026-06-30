import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import api, { SOCKET_URL } from '../config/api';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { AuthContext } from './AuthContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user, isAuthenticated } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [socket, setSocket] = useState(null);

    const fetchUnreadCount = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const { data } = await api.get('/notification/unread-count');
            setUnreadCount(data.data.count);
        } catch (error) {
            console.error('Failed to fetch unread count', error);
        }
    }, [isAuthenticated]);

    const fetchInitialNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const { data } = await api.get('/notification?limit=10');
            setNotifications(data.data.notifications || []);
        } catch (error) {
            console.error('Failed to fetch initial notifications', error);
        }
    }, [isAuthenticated]);

    // Request browser notification permissions
    const requestBrowserPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Browser notifications enabled');
            }
        }
    };

    useEffect(() => {
        if (isAuthenticated && user) {
            fetchUnreadCount();
            fetchInitialNotifications();
            requestBrowserPermission();

            // Initialize socket
            const newSocket = io(SOCKET_URL);
            setSocket(newSocket);

            newSocket.on('connect', () => {
                newSocket.emit('join', user._id);
            });

            newSocket.on('notification', (notification) => {
                // Play sound or show browser notification
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(notification.title, {
                        body: notification.message,
                        icon: '/favicon.ico' // Ensure you have a favicon
                    });
                }
                
                // Show toast
                toast.custom((t) => (
                    <div className="bg-white border border-slate-100 shadow-xl rounded-2xl p-4 flex flex-col gap-1 cursor-pointer min-w-[300px] max-w-md animate-enter" onClick={() => toast.dismiss(t.id)}>
                        <p className="font-bold text-sm text-slate-800">{notification.title}</p>
                        <p className="text-xs text-slate-500">{notification.message}</p>
                    </div>
                ), { duration: 5000 });

                // Update state
                setUnreadCount(prev => prev + 1);
                setNotifications(prev => [notification, ...prev]);
            });

            return () => newSocket.disconnect();
        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            setUnreadCount(0);
            setNotifications([]);
        }
    }, [isAuthenticated, user, fetchUnreadCount, fetchInitialNotifications]);

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notification/${id}/read`);
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/notification/read-all');
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            setNotifications,
            unreadCount,
            setUnreadCount,
            markAsRead,
            markAllAsRead,
            fetchUnreadCount
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
