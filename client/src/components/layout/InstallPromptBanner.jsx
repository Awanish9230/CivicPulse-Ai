import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, X, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InstallPromptBanner = () => {
    const { isInstallable, handleInstallClick, isIOS, isStandalone } = usePWAInstall();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isMobile = /android|iphone|ipad|ipod/.test(userAgent);
        
        // Show banner if they are on a mobile device (or emulator) and not already installed
        if (isMobile && !isStandalone) {
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [isStandalone]);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-0 md:bottom-6 left-0 w-full md:w-auto md:left-1/2 md:-translate-x-1/2 z-[100] p-4"
                >
                    <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 max-w-lg mx-auto w-full relative">
                        <button 
                            onClick={() => setIsVisible(false)}
                            className="absolute top-2 right-2 p-1.5 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X size={16} />
                        </button>
                        
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                            <Download size={24} className="text-indigo-600" />
                        </div>
                        
                        <div className="flex-1 text-center sm:text-left pr-4">
                            <h4 className="font-bold text-slate-800 text-sm">Install CivicPulse AI</h4>
                            <p className="text-xs text-slate-500 mt-1">
                                {isIOS ? "Tap Share below, then 'Add to Home Screen' for quick access." : "Add to your home screen for quick and easy access."}
                            </p>
                        </div>
                        
                        <div className="w-full sm:w-auto flex justify-center">
                            {isIOS ? (
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold">
                                    Tap <Share size={16} /> to install
                                </div>
                            ) : (
                                <button 
                                    onClick={() => {
                                        handleInstallClick();
                                        setIsVisible(false);
                                    }}
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-indigo-200 w-full sm:w-auto"
                                >
                                    Install Now
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default InstallPromptBanner;
