import { Outlet, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { NotificationBell } from '../notifications/NotificationBell';

import InstallPromptBanner from './InstallPromptBanner';

const AppLayout = () => {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user } = useContext(AuthContext);

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            
            <main className={`flex-1 min-w-0 pb-16 md:pb-0 transition-all duration-300 relative z-0 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
                <header className="h-16 md:h-20 border-b border-border/50 glass flex items-center px-4 md:px-10 justify-between sticky top-0 z-40 gap-2 md:gap-4">
                    <div className="flex items-center gap-2 md:gap-4 truncate">
                        <div className="md:hidden font-black text-xl md:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 tracking-tight truncate">
                            CivicPulse
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                        {!user && (
                            <Link to="/auth" className="md:hidden bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center whitespace-nowrap">
                                Login
                            </Link>
                        )}
                        <NotificationBell />
                    </div>
                </header>

                <div className="p-4 md:p-8 max-w-6xl mx-auto">
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
            
            <BottomNav />
            <InstallPromptBanner />
        </div>
    );
};

export default AppLayout;
