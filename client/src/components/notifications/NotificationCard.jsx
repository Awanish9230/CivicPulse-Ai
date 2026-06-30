import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from '../../utils/dateUtils';
import { 
    Bell, CheckCircle, AlertTriangle, 
    MessageSquare, AlertCircle, Calendar 
} from 'lucide-react';

export const NotificationCard = ({ notification, onRead }) => {
    const navigate = useNavigate();
    const { _id, title, message, type, priority, isRead, createdAt, actionUrl } = notification;

    const handleClick = () => {
        if (!isRead && onRead) {
            onRead(_id);
        }
        if (actionUrl) {
            navigate(actionUrl);
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'Complaint Submitted':
            case 'Complaint Resolved':
                return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case 'Complaint Escalated':
            case 'Alert':
                return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'Authority Commented':
            case 'Community Chat Mention':
                return <MessageSquare className="w-5 h-5 text-blue-500" />;
            case 'System Notification':
            case 'Security Alert':
                return <AlertCircle className="w-5 h-5 text-rose-500" />;
            case 'Task Assigned':
                return <Calendar className="w-5 h-5 text-indigo-500" />;
            default:
                return <Bell className="w-5 h-5 text-primary" />;
        }
    };

    const getBgColor = () => {
        if (!isRead) return 'bg-primary/5 border-l-4 border-primary';
        return 'bg-white border border-slate-100';
    };

    return (
        <div 
            onClick={handleClick}
            className={`p-4 mb-2 rounded-xl transition-all hover:bg-slate-50 cursor-pointer flex gap-3 ${getBgColor()}`}
        >
            <div className="shrink-0 mt-1">
                {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-slate-800 text-sm truncate pr-2">{title}</h4>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                        {formatDistanceToNow(new Date(createdAt))}
                    </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{message}</p>
            </div>
            {!isRead && (
                <div className="shrink-0 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                </div>
            )}
        </div>
    );
};
