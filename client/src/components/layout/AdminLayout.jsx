import { Outlet, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Activity, Users, Radio, Settings, LogOut, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

const adminNavItems = [
    { name: 'System Monitor', path: '/admin', icon: Activity },
    { name: 'Authorities', path: '/admin/authorities', icon: Users },
    { name: 'Broadcasts', path: '/admin/broadcasts', icon: Radio },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
];

const AdminSidebar = ({ onLogout }) => {
    const location = useLocation();

    return (
        <aside className="hidden md:flex flex-col w-20 lg:w-64 h-screen bg-red-950 border-r border-red-900 fixed left-0 top-0 transition-all duration-300 z-50 text-white">
            <div className="p-6 flex items-center justify-center lg:justify-start h-20 border-b border-red-900">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center font-black text-xl shadow-lg shadow-red-500/30">
                    S
                </div>
                <span className="hidden lg:block ml-3 font-black text-2xl tracking-tight text-red-50">
                    SuperAdmin
                </span>
            </div>
            
            <nav className="flex-1 mt-6 px-3 space-y-2 overflow-y-auto no-scrollbar">
                {adminNavItems.map((item) => {
                    const isExact = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                        <Link key={item.name} to={item.path} className="relative block">
                            {isExact && (
                                <motion.div 
                                    layoutId="admin-sidebar-active"
                                    className="absolute inset-0 bg-red-500/20 rounded-xl border border-red-500/30"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <div className={`relative flex flex-col lg:flex-row items-center p-3 rounded-xl transition-colors ${isExact ? 'text-red-400' : 'text-red-200/50 hover:text-white hover:bg-red-900/50'}`}>
                                <Icon size={24} className={`mb-1 lg:mb-0 lg:mr-4 ${isExact ? 'scale-110' : ''}`} strokeWidth={isExact ? 2.5 : 2} />
                                <span className={`text-[10px] lg:text-[15px] ${isExact ? 'font-bold' : 'font-medium'}`}>
                                    {item.name}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-red-900">
                <button onClick={onLogout} className="w-full flex items-center justify-center lg:justify-start p-3 rounded-xl text-red-200/50 hover:text-white hover:bg-red-900 transition-colors">
                    <LogOut size={20} />
                    <span className="hidden lg:block ml-3 font-bold text-sm">Logout</span>
                </button>
            </div>
        </aside>
    );
};

const AdminLayout = () => {
    const location = useLocation();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-red-950 rounded-3xl p-8 border border-red-900 shadow-[0_0_50px_rgba(220,38,38,0.15)] text-white relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-400"></div>
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 text-red-500">
                        <ShieldAlert size={32} />
                    </div>
                    <h1 className="text-3xl font-black mb-2">SuperAdmin Portal</h1>
                    <p className="text-red-200/50 mb-8">System-wide monitoring and control.</p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-red-100 mb-2">Username</label>
                            <input type="text" placeholder="admin" className="w-full bg-black/50 border border-red-900 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-red-100 mb-2">Master Password</label>
                            <input type="password" placeholder="••••••••" className="w-full bg-black/50 border border-red-900 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors text-white" />
                        </div>
                        <button 
                            onClick={() => setIsAuthenticated(true)}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-500/20 mt-4"
                        >
                            Authorize
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            <AdminSidebar onLogout={() => setIsAuthenticated(false)} />
            
            <main className="flex-1 pb-16 md:pb-0 md:ml-20 lg:ml-64 transition-all duration-300 relative z-0">
                <header className="h-20 border-b border-border/50 bg-white flex items-center px-6 md:px-10 justify-between sticky top-0 z-40 shadow-sm">
                    <div className="md:hidden font-black text-2xl tracking-tight text-red-950">
                        SuperAdmin
                    </div>
                </header>

                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="min-h-full"
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
