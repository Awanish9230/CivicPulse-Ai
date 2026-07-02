import React, { useContext, useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, CheckCircle2 } from 'lucide-react';
import { NotificationContext } from '../../context/NotificationContext';
import { NotificationCard } from './NotificationCard';

export const NotificationDropdown = ({ isOpen, onClose }) => {
    const { notifications, unreadCount, markAllAsRead, markAsRead } = useContext(NotificationContext);
    const dropdownRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const displayNotifications = notifications.slice(0, 5);

    return (
        <div 
            ref={dropdownRef}
            className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200"
        >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    Notifications
                    {unreadCount > 0 && (
                        <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                            {unreadCount} new
                        </span>
                    )}
                </h3>
                {unreadCount > 0 && (
                    <button 
                        onClick={markAllAsRead}
                        className="text-xs text-primary hover:text-primary-focus font-medium flex items-center gap-1 transition-colors"
                    >
                        <Check className="w-3 h-3" /> Mark all read
                    </button>
                )}
            </div>

            <div className="max-h-[360px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200">
                {displayNotifications.length > 0 ? (
                    displayNotifications.map((notif) => (
                        <NotificationCard 
                            key={notif._id} 
                            notification={notif} 
                            onRead={(id) => {
                                markAsRead(id);
                                onClose();
                            }} 
                        />
                    ))
                ) : (
                    <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-sm">You're all caught up!</p>
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
                <Link 
                    to="/notifications" 
                    onClick={onClose}
                    className="text-sm font-medium text-primary hover:text-primary-focus transition-colors inline-block w-full"
                >
                    View all notifications
                </Link>
            </div>
        </div>
    );
};
