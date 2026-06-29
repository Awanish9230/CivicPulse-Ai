import { motion } from 'framer-motion';
import { Bell, CheckCircle2, FileWarning, ArrowRight } from 'lucide-react';

const mockNotifications = [
    {
        id: 1,
        title: 'Complaint Verified',
        message: 'Your report "Deep Pothole on Main Street" has been verified by the Roads department.',
        time: '2 mins ago',
        icon: CheckCircle2,
        color: 'text-secondary',
        bg: 'bg-secondary/10',
        unread: true
    },
    {
        id: 2,
        title: 'SLA Escalation',
        message: 'A complaint you supported has been escalated to the Municipal Commissioner due to 72h SLA breach.',
        time: '1 hour ago',
        icon: FileWarning,
        color: 'text-danger',
        bg: 'bg-danger/10',
        unread: false
    }
];

const Notifications = () => {
    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-20">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-black text-text tracking-tight">Notifications</h1>
                <button className="text-primary text-sm font-bold hover:underline">Mark all as read</button>
            </div>

            <div className="space-y-4">
                {mockNotifications.map((notif, i) => {
                    const Icon = notif.icon;
                    return (
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={notif.id}
                            className={`p-5 rounded-[2rem] border transition-all cursor-pointer group ${notif.unread ? 'bg-white border-primary/20 shadow-lg shadow-primary/5' : 'bg-surface border-border/50 hover:bg-white'}`}
                        >
                            <div className="flex gap-4">
                                <div className={`w-12 h-12 rounded-full ${notif.bg} flex items-center justify-center shrink-0`}>
                                    <Icon className={notif.color} size={24} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`font-bold ${notif.unread ? 'text-text' : 'text-text/80'}`}>{notif.title}</h3>
                                        <span className="text-[10px] font-bold text-text/40">{notif.time}</span>
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
