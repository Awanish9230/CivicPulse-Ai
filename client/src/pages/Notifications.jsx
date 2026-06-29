import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, FileWarning, Check, Inbox } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/v1/notification', {
                withCredentials: true
            });
            setNotifications(data.data || []);
        } catch (error) {
            toast.error("Failed to fetch notifications");
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async () => {
        try {
            await axios.post('http://localhost:5000/api/v1/notification/mark-read', {}, {
                withCredentials: true
            });
            fetchNotifications(); // Refresh list to reflect read status
            toast.success("All notifications marked as read");
        } catch (error) {
            toast.error("Failed to mark notifications as read");
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const getTimeAgo = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    const getIcon = (iconName) => {
        switch (iconName) {
            case 'CheckCircle2': return CheckCircle2;
            case 'FileWarning': return FileWarning;
            default: return Bell;
        }
    };

    const unreadCount = notifications.filter(n => n.unread).length;

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="max-w-3xl mx-auto space-y-8 pb-20 relative"
        >
            {/* Ambient background */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none -z-10"></div>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border/50 pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-4xl font-black text-text tracking-tight">Inbox</h1>
                        {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce">
                                {unreadCount} New
                            </span>
                        )}
                    </div>
                    <p className="text-text/60 font-medium">Stay updated on your civic impact and community alerts.</p>
                </div>
                
                <button 
                    onClick={markAsRead}
                    disabled={unreadCount === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all bg-surface border border-border/50 text-text/60 hover:text-primary hover:border-primary/30 disabled:opacity-50 disabled:hover:text-text/60 disabled:hover:border-border/50"
                >
                    <Check size={16} /> Mark all as read
                </button>
            </div>

            <div className="space-y-4">
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 text-primary">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                        <p className="font-bold">Fetching alerts...</p>
                    </div>
                )}
                
                {/* Beautiful Empty State */}
                {!loading && notifications.length === 0 && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/60 backdrop-blur-xl border border-white/50 shadow-lg rounded-[3rem] p-16 text-center max-w-xl mx-auto mt-10"
                    >
                        <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 border border-border/50">
                            <Inbox size={40} className="text-text/30" />
                        </div>
                        <h2 className="text-2xl font-black text-text mb-2">All Caught Up!</h2>
                        <p className="text-text/60 mb-0 max-w-sm mx-auto leading-relaxed">
                            You have no new notifications right now. We'll alert you here when there are updates to your reported issues.
                        </p>
                    </motion.div>
                )}
                
                <AnimatePresence>
                    {!loading && notifications.map((notif, i) => {
                        const Icon = getIcon(notif.icon);
                        return (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.05 }}
                                key={notif._id}
                                className={`p-6 rounded-[2rem] border transition-all cursor-pointer group relative overflow-hidden ${
                                    notif.unread 
                                        ? 'bg-white border-primary/20 shadow-[0_8px_30px_rgba(37,99,235,0.08)] hover:border-primary/40' 
                                        : 'bg-surface/50 border-border/50 hover:bg-white hover:shadow-sm'
                                }`}
                            >
                                {/* Unread indicator dot */}
                                {notif.unread && (
                                    <div className="absolute top-6 right-6 w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_rgba(37,99,235,0.8)]"></div>
                                )}

                                <div className="flex gap-5">
                                    <div className={`w-14 h-14 rounded-2xl ${notif.bg} flex items-center justify-center shrink-0 shadow-sm`}>
                                        <Icon className={notif.color} size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0 pr-8">
                                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mb-1.5">
                                            <h3 className={`text-lg font-black truncate ${notif.unread ? 'text-text' : 'text-text/70'}`}>{notif.title}</h3>
                                            <span className="text-xs font-bold text-text/40">{getTimeAgo(notif.createdAt)}</span>
                                        </div>
                                        <p className={`text-sm leading-relaxed ${notif.unread ? 'text-text/80 font-medium' : 'text-text/60'}`}>{notif.message}</p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default Notifications;
