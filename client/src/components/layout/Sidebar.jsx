import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, Users, Bell, User, Map, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Complaints', path: '/complaints', icon: FileText },
    { name: 'Community', path: '/community', icon: Users },
    { name: 'Dashboard', path: '/dashboard', icon: Map },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Profile', path: '/profile', icon: User },
];

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);

    const handleLogout = async (e) => {
        e.preventDefault();
        await logout();
        navigate('/');
    };

    return (
        <aside className="hidden md:flex flex-col w-20 lg:w-64 h-screen bg-white/80 backdrop-blur-xl border-r border-border fixed left-0 top-0 transition-all duration-300 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            <div className="p-6 flex items-center justify-center lg:justify-start h-20 border-b border-border/50">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/30">
                    C
                </div>
                <span className="hidden lg:block ml-3 font-black text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                    CivicPulse
                </span>
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
                            <div className={`relative flex flex-col lg:flex-row items-center p-3 rounded-xl transition-colors ${isActive ? 'text-primary' : 'text-text/70 hover:text-primary hover:bg-surface/50'}`}>
                                <Icon size={24} className={`mb-1 lg:mb-0 lg:mr-4 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                                <span className={`text-[10px] lg:text-[15px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                                    {item.name}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border/50">
                {user ? (
                    <button onClick={handleLogout} className="w-full flex items-center justify-center lg:justify-start p-3 rounded-xl text-text/60 hover:text-danger hover:bg-danger/10 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-inherit">
                            <LogOut size={16} />
                        </div>
                        <div className="hidden lg:block ml-3 text-left">
                            <p className="text-xs font-bold text-inherit">Logout</p>
                            <p className="text-[10px] text-text/50">{user.anonymousId || user.email}</p>
                        </div>
                    </button>
                ) : (
                    <Link to="/auth" className="flex items-center justify-center lg:justify-start p-3 rounded-xl text-text/60 hover:text-primary hover:bg-surface transition-colors">
                        <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center">
                            <User size={16} />
                        </div>
                        <div className="hidden lg:block ml-3">
                            <p className="text-xs font-bold text-text">Auth Portal</p>
                            <p className="text-[10px] text-text/50">Login / Signup</p>
                        </div>
                    </Link>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
