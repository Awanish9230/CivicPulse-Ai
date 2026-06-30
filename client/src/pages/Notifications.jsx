import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Trash2, Filter, Inbox } from 'lucide-react';
import { NotificationCard } from '../components/notifications/NotificationCard';
import { NotificationContext } from '../context/NotificationContext';
import toast from 'react-hot-toast';
import PageLoader from '../components/common/PageLoader';

const Notifications = () => {
    const { markAllAsRead, markAsRead, fetchUnreadCount, unreadCount } = useContext(NotificationContext);
    
    const [notifications, setNotifications] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState('All'); // All, Unread
    
    const observer = useRef();
    
    const fetchNotifications = useCallback(async (pageNum, filter, append = false) => {
        setLoading(true);
        try {
            const endpoint = `http://localhost:5000/api/v1/notification?page=${pageNum}&limit=10${filter === 'Unread' ? '&unread=true' : ''}`;
            const { data } = await axios.get(endpoint, { withCredentials: true });
            
            const newNotifs = data.data.notifications;
            
            if (append) {
                setNotifications(prev => {
                    // Prevent duplicates when appending
                    const existingIds = new Set(prev.map(n => n._id));
                    const uniqueNew = newNotifs.filter(n => !existingIds.has(n._id));
                    return [...prev, ...uniqueNew];
                });
            } else {
                setNotifications(newNotifs);
            }
            
            setHasMore(data.data.currentPage < data.data.totalPages);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setPage(1);
        setNotifications([]);
        fetchNotifications(1, filterType, false);
    }, [filterType, fetchNotifications]);

    // Infinite scrolling
    const lastNotificationRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => {
                    const nextPage = prevPage + 1;
                    fetchNotifications(nextPage, filterType, true);
                    return nextPage;
                });
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore, fetchNotifications, filterType]);

    const handleMarkAllRead = async () => {
        await markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const handleClearAll = async () => {
        try {
            await axios.delete('http://localhost:5000/api/v1/notification', { withCredentials: true });
            setNotifications([]);
            setHasMore(false);
            fetchUnreadCount();
            toast.success("Notifications cleared");
        } catch (error) {
            toast.error("Failed to clear notifications");
        }
    };

    const handleRead = (id) => {
        markAsRead(id);
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    };

    return (
        <div className="max-w-3xl mx-auto py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        Notifications
                        {unreadCount > 0 && (
                            <span className="bg-primary text-white text-xs px-2.5 py-0.5 rounded-full font-medium">
                                {unreadCount}
                            </span>
                        )}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Stay updated with your latest activity</p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <select 
                        className="bg-white border border-slate-200 text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-primary cursor-pointer text-slate-700"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="All">All Notifications</option>
                        <option value="Unread">Unread Only</option>
                    </select>

                    <button 
                        onClick={handleMarkAllRead}
                        className="p-2 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors tooltip-trigger"
                        title="Mark all as read"
                    >
                        <Check size={20} />
                    </button>

                    <button 
                        onClick={handleClearAll}
                        className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors tooltip-trigger"
                        title="Clear all"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-2 md:p-6 min-h-[500px]">
                {notifications.length === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
                        <Inbox className="w-16 h-16 mb-4 text-slate-300" />
                        <p className="text-lg font-medium text-slate-600 mb-1">No notifications yet</p>
                        <p className="text-sm">When you get notifications, they'll show up here</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        <AnimatePresence>
                            {notifications.map((notification, index) => {
                                if (notifications.length === index + 1) {
                                    return (
                                        <motion.div 
                                            key={notification._id}
                                            ref={lastNotificationRef}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            <NotificationCard notification={notification} onRead={handleRead} />
                                        </motion.div>
                                    );
                                }
                                return (
                                    <motion.div 
                                        key={notification._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <NotificationCard notification={notification} onRead={handleRead} />
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                        {loading && (
                            <div className="py-6 flex justify-center">
                                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
