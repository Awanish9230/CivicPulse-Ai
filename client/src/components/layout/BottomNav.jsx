import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Users, Bell, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useContext } from 'react';
import { NotificationContext } from '../../context/NotificationContext';

const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Complaints', path: '/complaints', icon: FileText },
    { name: 'Community', path: '/community', icon: Users },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Profile', path: '/profile', icon: User },
];

const BottomNav = () => {
    const location = useLocation();
    const { unreadCount } = useContext(NotificationContext);

    return (
        <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 glass border-t border-border/50 flex justify-around items-center z-50 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                    <Link key={item.name} to={item.path} className="relative flex flex-col items-center justify-center w-full h-full">
                        <div className={`relative flex flex-col items-center justify-center transition-colors ${isActive ? 'text-primary' : 'text-text/60'}`}>
                            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={`mb-1 transition-transform ${isActive ? '-translate-y-1' : ''}`} />
                            {item.name === 'Notifications' && unreadCount > 0 && (
                                <span className="absolute -top-1 -right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white"></span>
                            )}
                            <span className={`text-[10px] transition-all ${isActive ? 'font-bold opacity-100' : 'font-medium opacity-70'}`}>
                                {item.name}
                            </span>
                        </div>
                        {isActive && (
                            <motion.div 
                                layoutId="bottomnav-indicator"
                                className="absolute top-0 w-8 h-1 bg-primary rounded-b-full shadow-[0_0_8px_rgba(37,99,235,0.5)]"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
};

export default BottomNav;
