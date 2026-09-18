import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import api, { SOCKET_URL } from '../config/api';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { AuthContext } from './AuthContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const isAuthenticated = !!user;
    
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
            const { data } = await api.get('/notification?limit=5');
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
                if ('serviceWorker' in navigator && 'PushManager' in window) {
                    try {
                        const registration = await navigator.serviceWorker.ready;
                        
                        const urlBase64ToUint8Array = (base64String) => {
                            const padding = '='.repeat((4 - base64String.length % 4) % 4);
                            const base64 = (base64String + padding)
                                .replace(/\-/g, '+')
                                .replace(/_/g, '/');
                            
                            const rawData = window.atob(base64);
                            const outputArray = new Uint8Array(rawData.length);
                            
                            for (let i = 0; i < rawData.length; ++i) {
                                outputArray[i] = rawData.charCodeAt(i);
                            }
                            return outputArray;
                        }

                        let subscription = await registration.pushManager.getSubscription();
                        if (!subscription) {
                            subscription = await registration.pushManager.subscribe({
                                userVisibleOnly: true,
                                applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)
                            });
                        }
                        
                        // Send subscription to server
                        await api.post('/notification/subscribe', { subscription });
                        console.log('Subscribed to web push!');
                    } catch (err) {
                        console.error('Failed to subscribe to push manager', err);
                    }
                }
            }
        }
    };

    useEffect(() => {
        let newSocket = null;

        if (isAuthenticated && user) {
            fetchUnreadCount();
            fetchInitialNotifications();
            requestBrowserPermission();
            
            // Connect socket
            newSocket = io(SOCKET_URL);
            setSocket(newSocket);

            newSocket.on('connect', () => {
                newSocket.emit('join', user._id);
                if (user.anonymousId) {
                    newSocket.emit('join', user.anonymousId);
                }
                if (user.pastAnonymousIds && user.pastAnonymousIds.length > 0) {
                    user.pastAnonymousIds.forEach(id => {
                        newSocket.emit('join', id);
                    });
                }
                newSocket.emit('joinRoom', 'local-community-general');
                newSocket.emit('joinRoom', 'local-community-authority');
            });

            newSocket.on('notification', (notification) => {
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(notification.title, {
                        body: notification.message,
                        icon: '/favicon.ico'
                    });
                }
                
                toast.custom((t) => (
                    <div className="bg-white border border-slate-100 shadow-xl rounded-2xl p-4 flex flex-col gap-1 cursor-pointer min-w-[300px] max-w-md animate-enter" onClick={() => toast.dismiss(t.id)}>
                        <p className="font-bold text-sm text-slate-800">{notification.title}</p>
                        <p className="text-xs text-slate-500">{notification.message}</p>
                    </div>
                ), { duration: 5000 });

                setUnreadCount(prev => prev + 1);
                setNotifications(prev => {
                    if (prev.some(n => n._id === notification._id)) return prev;
                    return [notification, ...prev];
                });
            });
        } else {
            setUnreadCount(0);
            setNotifications([]);
            setSocket(null);
        }
        
        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
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

    const clearAllNotifications = async () => {
        try {
            await api.delete('/notification');
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to clear notifications', error);
        }
    };

    const contextValue = React.useMemo(() => ({
        notifications,
        setNotifications,
        unreadCount,
        setUnreadCount,
        markAsWindowAsRead: markAsRead,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        fetchUnreadCount,
        socket
    }), [notifications, unreadCount, socket, fetchUnreadCount]);

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
};
