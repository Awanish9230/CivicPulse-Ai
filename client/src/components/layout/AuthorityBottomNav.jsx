import { Link, useLocation } from 'react-router-dom';
import { Map, CheckSquare, MessageSquare, Users, BarChart, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const authNavItems = [
    { name: 'Dashboard', path: '/authority', icon: Map },
    { name: 'Tasks', path: '/authority/tasks', icon: CheckSquare },
    { name: 'Chat', path: '/authority/chat', icon: MessageSquare },
    { name: 'Members', path: '/authority/members', icon: Users },
    { name: 'Analytics', path: '/authority/analytics', icon: BarChart },
    { name: 'Settings', path: '/authority/settings', icon: Settings },
];

const AuthorityBottomNav = () => {
    const location = useLocation();

    return (
        <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-slate-900 border-t border-slate-800 flex justify-around items-center z-50 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.5)] overflow-x-auto no-scrollbar px-2">
            {authNavItems.map((item) => {
                const isExact = location.pathname === item.path;
                const Icon = item.icon;
                return (
                    <Link key={item.name} to={item.path} className="relative flex flex-col items-center justify-center min-w-[60px] h-full shrink-0">
                        <div className={`flex flex-col items-center justify-center transition-colors ${isExact ? 'text-blue-400' : 'text-slate-400'}`}>
                            <Icon size={20} strokeWidth={isExact ? 2.5 : 2} className={`mb-1 transition-transform ${isExact ? '-translate-y-1' : ''}`} />
                            <span className={`text-[10px] transition-all ${isExact ? 'font-bold opacity-100' : 'font-medium opacity-70'}`}>
                                {item.name}
                            </span>
                        </div>
                        {isExact && (
                            <motion.div 
                                layoutId="auth-bottomnav-indicator"
                                className="absolute top-0 w-8 h-1 bg-blue-500 rounded-b-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
};

export default AuthorityBottomNav;
