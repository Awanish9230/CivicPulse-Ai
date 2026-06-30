import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { useState } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

const AppLayout = () => {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            
            <main className={`flex-1 min-w-0 pb-16 md:pb-0 transition-all duration-300 relative z-0 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
                <header className="h-20 border-b border-border/50 glass flex items-center px-6 md:px-10 justify-between sticky top-0 z-40 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="md:hidden font-black text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 tracking-tight">
                            CivicPulse
                        </div>
                    </div>
                    <div className="hidden md:flex w-full max-w-2xl mx-auto items-center relative group">
                        <Search className="absolute left-4 text-text/40 group-focus-within:text-primary transition-colors" size={20} />
                        <input 
                            type="text" 
                            placeholder="Search complaints, categories, or locations..." 
                            className="w-full bg-white/50 border border-border/50 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all shadow-sm"
                        />
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
        </div>
    );
};

export default AppLayout;
