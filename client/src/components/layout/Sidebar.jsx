import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, Users, Bell, User, Map, LogOut, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { NotificationContext } from '../../context/NotificationContext';

const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Complaints', path: '/complaints', icon: FileText },
    { name: 'Community', path: '/community', icon: Users },
    { name: 'Dashboard', path: '/dashboard', icon: Map },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Profile', path: '/profile', icon: User },
];

const Sidebar = ({ isOpen, setIsOpen }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);
    const { unreadCount } = useContext(NotificationContext);

    const handleLogout = async (e) => {
        e.preventDefault();
        await logout();
        navigate('/');
    };

    return (
        <aside className={`hidden md:flex flex-col ${isOpen ? 'w-64' : 'w-20'} h-screen bg-white/80 backdrop-blur-xl border-r border-border fixed left-0 top-0 transition-all duration-300 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}>
            <div className={`p-6 flex items-center ${isOpen ? 'justify-between' : 'justify-center'} h-20 border-b border-border/50`}>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2 rounded-xl bg-surface border border-border/50 hover:bg-border/50 transition-colors shrink-0"
                    >
                        <Menu size={24} className="text-text/70" />
                    </button>
                    {isOpen && (
                        <span className="font-black text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 truncate">
                            CivicPulse
                        </span>
                    )}
                </div>
            </div>
            
            <nav className="flex-1 mt-6 px-3 space-y-2 overflow-y-auto no-scrollbar">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                        <Link key={item.name} to={item.path} className="relative block">
                            {isActive && (
                                <motion.div 
                                    layoutId="sidebar-active"
                                    className="absolute inset-0 bg-primary/10 rounded-xl"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <div className={`relative flex items-center p-3 rounded-xl transition-colors ${isOpen ? 'flex-row' : 'flex-col justify-center'} ${isActive ? 'text-primary' : 'text-text/70 hover:text-primary hover:bg-surface/50'}`}>
                                <div className="relative">
                                    <Icon size={24} className={`transition-transform duration-200 ${isOpen ? 'mr-4' : 'mb-1'} ${isActive ? 'scale-110' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                                    {item.name === 'Notifications' && unreadCount > 0 && (
                                        <span className={`absolute ${isOpen ? '-top-1 right-3' : '-top-1 -right-1'} w-3 h-3 bg-rose-500 rounded-full border-2 border-white`}></span>
                                    )}
                                </div>
                                <span className={`transition-all ${isOpen ? 'text-[15px]' : 'text-[10px]'} ${isActive ? 'font-bold' : 'font-medium'}`}>
                                    {item.name}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border/50">
                {user ? (
                    <button onClick={handleLogout} className={`w-full flex items-center ${isOpen ? 'justify-start' : 'justify-center'} p-3 rounded-xl text-text/60 hover:text-danger hover:bg-danger/10 transition-colors`}>
                        <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-inherit shrink-0">
                            <LogOut size={16} />
                        </div>
                        {isOpen && (
                            <div className="ml-3 text-left truncate">
                                <p className="text-xs font-bold text-inherit">Logout</p>
                                <p className="text-[10px] text-text/50 truncate">{user.anonymousId || user.email}</p>
                            </div>
                        )}
                    </button>
                ) : (
                    <Link to="/auth" className={`flex items-center ${isOpen ? 'justify-start' : 'justify-center'} p-3 rounded-xl text-text/60 hover:text-primary hover:bg-surface transition-colors`}>
                        <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center shrink-0">
                            <User size={16} />
                        </div>
                        {isOpen && (
                            <div className="ml-3 truncate">
                                <p className="text-xs font-bold text-text">Auth Portal</p>
                                <p className="text-[10px] text-text/50">Login / Signup</p>
                            </div>
                        )}
                    </Link>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
