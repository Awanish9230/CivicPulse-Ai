import { Outlet, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Map, CheckSquare, BarChart, Settings, LogOut, Lock } from 'lucide-react';
import { useState } from 'react';

const authNavItems = [
    { name: 'Dashboard', path: '/authority', icon: Map },
    { name: 'Tasks', path: '/authority/tasks', icon: CheckSquare },
    { name: 'Analytics', path: '/authority/analytics', icon: BarChart },
    { name: 'Settings', path: '/authority/settings', icon: Settings },
];

const AuthoritySidebar = ({ onLogout }) => {
    const location = useLocation();

    return (
        <aside className="hidden md:flex flex-col w-20 lg:w-64 h-screen bg-slate-900 border-r border-slate-800 fixed left-0 top-0 transition-all duration-300 z-50 text-white">
            <div className="p-6 flex items-center justify-center lg:justify-start h-20 border-b border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-xl shadow-lg">
                    A
                </div>
                <span className="hidden lg:block ml-3 font-black text-2xl tracking-tight">
                    Authority
                </span>
            </div>
            
            <nav className="flex-1 mt-6 px-3 space-y-2 overflow-y-auto no-scrollbar">
                {authNavItems.map((item) => {
                    const isExact = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                        <Link key={item.name} to={item.path} className="relative block">
                            {isExact && (
                                <motion.div 
                                    layoutId="auth-sidebar-active"
                                    className="absolute inset-0 bg-blue-500/20 rounded-xl border border-blue-500/30"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <div className={`relative flex flex-col lg:flex-row items-center p-3 rounded-xl transition-colors ${isExact ? 'text-blue-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                                <Icon size={24} className={`mb-1 lg:mb-0 lg:mr-4 ${isExact ? 'scale-110' : ''}`} strokeWidth={isExact ? 2.5 : 2} />
                                <span className={`text-[10px] lg:text-[15px] ${isExact ? 'font-bold' : 'font-medium'}`}>
                                    {item.name}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button onClick={onLogout} className="w-full flex items-center justify-center lg:justify-start p-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <LogOut size={20} />
                    <span className="hidden lg:block ml-3 font-bold text-sm">Logout</span>
                </button>
            </div>
        </aside>
    );
};

const AuthorityLayout = () => {
    const location = useLocation();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl text-white"
                >
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-6 text-blue-400">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-3xl font-black mb-2">Authority Login</h1>
                    <p className="text-slate-400 mb-8">Access restricted to authorized personnel.</p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">Official Email</label>
                            <input type="email" placeholder="officer@city.gov" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">Password</label>
                            <input type="password" placeholder="••••••••" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-white" />
                        </div>
                        <button 
                            onClick={() => setIsAuthenticated(true)}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg mt-4"
                        >
                            Secure Login
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            <AuthoritySidebar onLogout={() => setIsAuthenticated(false)} />
            
            <main className="flex-1 pb-16 md:pb-0 md:ml-20 lg:ml-64 transition-all duration-300 relative z-0">
                <header className="h-20 border-b border-border/50 bg-white flex items-center px-6 md:px-10 justify-between sticky top-0 z-40 shadow-sm">
                    <div className="md:hidden font-black text-2xl tracking-tight text-slate-900">
                        Authority
                    </div>
                    <div className="hidden md:flex w-full max-w-2xl mx-auto items-center relative group">
                        <Search className="absolute left-4 text-text/40 group-focus-within:text-blue-600 transition-colors" size={20} />
                        <input 
                            type="text" 
                            placeholder="Search tasks, wards, officers..." 
                            className="w-full bg-slate-100 border border-transparent rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner"
                        />
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

export default AuthorityLayout;
