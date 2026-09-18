import React, { useState, useContext, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { NotificationContext } from '../../context/NotificationContext';
import { NotificationDropdown } from './NotificationDropdown';
import { useLocation } from 'react-router-dom';

export const NotificationBell = () => {
    const { unreadCount } = useContext(NotificationContext);
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    // Close dropdown on route change
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:text-primary transition-colors rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
                aria-label="Notifications"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
            </button>

            <NotificationDropdown isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </div>
    );
};
