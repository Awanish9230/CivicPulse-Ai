import { motion } from 'framer-motion';
import { Bell, CheckCircle2, FileWarning, ArrowRight } from 'lucide-react';
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

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-20">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-black text-text tracking-tight">Notifications</h1>
                <button onClick={markAsRead} className="text-primary text-sm font-bold hover:underline">Mark all as read</button>
            </div>

            <div className="space-y-4">
                {loading && <div className="text-center py-10">Loading notifications...</div>}
                {!loading && notifications.length === 0 && (
                    <div className="text-center py-10 text-text/50 border border-border/50 rounded-3xl bg-white shadow-sm">
                        <Bell className="mx-auto mb-2 text-text/30" size={32} />
                        You have no notifications yet.
                    </div>
                )}
                {!loading && notifications.map((notif, i) => {
                    const Icon = getIcon(notif.icon);
                    return (
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={notif._id}
                            className={`p-5 rounded-[2rem] border transition-all cursor-pointer group ${notif.unread ? 'bg-white border-primary/20 shadow-lg shadow-primary/5' : 'bg-surface border-border/50 hover:bg-white'}`}
                        >
                            <div className="flex gap-4">
                                <div className={`w-12 h-12 rounded-full ${notif.bg} flex items-center justify-center shrink-0`}>
                                    <Icon className={notif.color} size={24} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`font-bold ${notif.unread ? 'text-text' : 'text-text/80'}`}>{notif.title}</h3>
                                        <span className="text-[10px] font-bold text-text/40">{getTimeAgo(notif.createdAt)}</span>
                                    </div>
                                    <p className="text-sm text-text/70 leading-relaxed pr-6">{notif.message}</p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default Notifications;
