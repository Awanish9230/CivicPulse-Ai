import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

const FloatingButtons: React.FC = () => {
    const [showScroll, setShowScroll] = useState<boolean>(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowScroll(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!showScroll) return null;

    return (
        <div className="fixed bottom-20 md:bottom-6 right-5 z-40">
            <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-11 h-11 bg-white text-slate-700 border border-slate-200 rounded-full flex items-center justify-center shadow-md hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer"
                aria-label="Scroll to top"
            >
                <ArrowUp size={18} />
            </button>
        </div>
    );
};

export default FloatingButtons;
