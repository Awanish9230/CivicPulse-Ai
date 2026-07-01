import React, { useState, useContext } from 'react';
import { Outlet, useLocation, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import { 
    LayoutDashboard, AlertTriangle, UserCheck, Users, 
    Building2, Map, Tag, CheckSquare, MessageSquare, 
    BrainCircuit, Bell, Radio, BarChart3, FileText, 
    Activity, ClipboardList, Settings, ShieldAlert, 
    Database, MessageCircle, Webhook, Link as LinkIcon, 
    History, UserCircle, Search, LogOut, ChevronDown, ChevronRight, Eye, EyeOff
} from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';

const adminNavGroups = [
    {
        title: "Overview",
        items: [
            { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
            { name: 'AI Dashboard', path: '/admin/ai', icon: BrainCircuit },
            { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
            { name: 'System Monitor', path: '/admin/monitor', icon: Activity },
        ]
    },
    {
        title: "Entity Management",
        items: [
            { name: 'Complaints', path: '/admin/complaints', icon: AlertTriangle },
            { name: 'Authorities', path: '/admin/authorities', icon: UserCheck },
            { name: 'Citizens', path: '/admin/citizens', icon: Users },
            { name: 'Departments', path: '/admin/departments', icon: Building2 },
            { name: 'Locations', path: '/admin/locations', icon: Map },
            { name: 'Categories', path: '/admin/categories', icon: Tag },
        ]
    },
    {
        title: "Engagement & Support",
        items: [
            { name: 'Tasks', path: '/admin/tasks', icon: CheckSquare },
            { name: 'Community', path: '/admin/community', icon: MessageSquare },
            { name: 'Feedback', path: '/admin/feedback', icon: MessageCircle },
        ]
    },
    {
        title: "Communications",
        items: [
            { name: 'Notifications', path: '/admin/notifications', icon: Bell },
            { name: 'Broadcasts', path: '/admin/broadcasts', icon: Radio },
            { name: 'Reports', path: '/admin/reports', icon: FileText },
        ]
    },
    {
        title: "System & Security",
        items: [
            { name: 'Security Center', path: '/admin/security', icon: ShieldAlert },
            { name: 'Audit Logs', path: '/admin/audit', icon: ClipboardList },
            { name: 'Database', path: '/admin/database', icon: Database },
            { name: 'API Manager', path: '/admin/api', icon: Webhook },
            { name: 'Integrations', path: '/admin/integrations', icon: LinkIcon },
            { name: 'Backups', path: '/admin/backups', icon: History },
            { name: 'Settings', path: '/admin/settings', icon: Settings },
        ]
    }
];

const AdminSidebar = ({ onLogout }) => {
    const location = useLocation();

    return (
        <aside className="hidden md:flex flex-col w-20 lg:w-72 h-screen bg-orange-950 border-r border-orange-900 fixed left-0 top-0 transition-all duration-300 z-50 text-white">
            <div className="p-6 flex items-center justify-center lg:justify-start h-20 border-b border-orange-900 shrink-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center font-black text-xl shadow-lg shadow-orange-500/30">
                    SA
                </div>
                <span className="hidden lg:block ml-3 font-black text-2xl tracking-tight text-white">
                    SuperAdmin
                </span>
            </div>
            
            <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-orange-800 scrollbar-track-transparent">
                {adminNavGroups.map((group, idx) => (
                    <div key={idx}>
                        <h4 className="hidden lg:block text-xs font-bold text-orange-200/50 uppercase tracking-wider mb-2 px-3">
                            {group.title}
                        </h4>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isExact = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/admin');
                                const Icon = item.icon;
                                return (
                                    <Link key={item.name} to={item.path} className="relative block group">
                                        {isExact && (
                                            <motion.div 
                                                layoutId="admin-sidebar-active"
                                                className="absolute inset-0 bg-orange-500/20 rounded-xl border border-orange-500/30"
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                        <div className={`relative flex flex-col lg:flex-row items-center p-3 rounded-xl transition-colors ${isExact ? 'text-orange-400' : 'text-orange-200/70 hover:text-white hover:bg-orange-900/50'}`}>
                                            <Icon size={20} className={`mb-1 lg:mb-0 lg:mr-3 ${isExact ? 'scale-110' : ''}`} strokeWidth={isExact ? 2.5 : 2} />
                                            <span className={`text-[10px] lg:text-[14px] ${isExact ? 'font-bold' : 'font-medium'}`}>
                                                {item.name}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-orange-900 shrink-0">
                <Link to="/admin/profile" className="flex items-center p-3 mb-2 rounded-xl text-orange-200/70 hover:text-white hover:bg-orange-900 transition-colors">
                    <UserCircle size={20} />
                    <span className="hidden lg:block ml-3 font-bold text-sm">My Profile</span>
                </Link>
                <button onClick={onLogout} className="w-full flex items-center justify-center lg:justify-start p-3 rounded-xl text-orange-200/70 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <LogOut size={20} />
                    <span className="hidden lg:block ml-3 font-bold text-sm">Logout</span>
                </button>
            </div>
        </aside>
    );
};

const AdminLayout = () => {
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const { user, loading, login, logout } = useContext(AuthContext);

    const isAdmin = user && user.role === 'Admin';

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        try {
            const axios = (await import('axios')).default;
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/user/login`, { email, password }, {
                withCredentials: true
            });
            if (data.data.user.role === 'Admin') {
                login(data.data.user);
            } else {
                alert("Unauthorized: Not a Super Admin account");
            }
        } catch (error) {
            alert(error.response?.data?.message || "Login failed");
        } finally {
            setIsLoggingIn(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <div className="w-16 h-16 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">Verifying Credentials...</p>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-orange-950 flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md bg-orange-900 rounded-3xl p-8 border border-orange-800 shadow-2xl shadow-orange-900/50 text-white"
                >
                    <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center mb-6 text-orange-400">
                        <ShieldAlert size={32} />
                    </div>
                    <h1 className="text-3xl font-black mb-2">Super Admin Login</h1>
                    <p className="text-slate-400 mb-8">Access restricted to system administrators.</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">Admin Email</label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@admin.com" 
                                required
                                className="w-full bg-orange-950 border border-orange-800 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400 transition-colors text-white" 
                            />
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-bold text-slate-300 mb-2">Password</label>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••" 
                                required
                                className="w-full bg-orange-950 border border-orange-800 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-orange-400 transition-colors text-white" 
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-10 text-orange-700 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        <div className="flex justify-end mt-2">
                            <Link to="/forgot-password?role=admin" className="text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors">
                                Forgot Password?
                            </Link>
                        </div>
                        <button 
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-600/20 mt-4 disabled:opacity-50"
                        >
                            {isLoggingIn ? 'Authenticating...' : 'Secure Admin Login'}
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            <AdminSidebar onLogout={() => logout()} />
            
            <main className="flex-1 min-w-0 pb-16 md:pb-0 md:ml-20 lg:ml-72 transition-all duration-300">
                <header className="h-20 border-b border-border/50 bg-white flex items-center px-6 md:px-10 justify-between sticky top-0 z-40 shadow-sm gap-4">
                    <div className="md:hidden font-black text-2xl tracking-tight text-slate-900">
                        SuperAdmin
                    </div>
                    <div className="hidden md:flex w-full max-w-2xl mx-auto items-center relative group">
                        <Search className="absolute left-4 text-slate-400 group-focus-within:text-orange-600 transition-colors" size={20} />
                        <input 
                            type="text" 
                            placeholder="Global Search (Users, Authorities, Complaints, Departments...)" 
                            className="w-full bg-slate-100 border border-transparent rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:bg-white focus:border-orange-500 transition-all shadow-inner text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                        <NotificationBell />
                        <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-200">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <div className="text-sm">
                                <p className="font-bold text-slate-800 leading-tight">{user.name || 'Admin User'}</p>
                                <p className="text-slate-500 text-xs">Super Administrator</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-[calc(100vh-5rem)]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
