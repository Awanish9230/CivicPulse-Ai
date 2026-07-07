import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const CustomSelect = ({ 
    value, 
    onChange, 
    options, 
    disabled = false, 
    className = "",
    placeholder = "Select..."
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedOption = options.find(opt => String(opt.value) === String(value));
    const displayValue = selectedOption ? selectedOption.label : placeholder;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative inline-block w-full" ref={containerRef}>
            <button 
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-bold text-slate-700 outline-none transition-all disabled:opacity-50 ${isOpen ? 'ring-2 ring-primary/20 border-primary shadow-sm' : 'hover:bg-slate-50'} ${className}`}
            >
                <span className="truncate">{displayValue}</span>
                <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 top-full mt-2 min-w-full w-max max-h-60 overflow-y-auto bg-white/95 backdrop-blur-xl border border-slate-200 shadow-[0_10px_40px_rgb(0,0,0,0.1)] rounded-2xl z-[100] flex flex-col p-1 no-scrollbar"
                    >
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    // Mock the event object for drop-in compatibility with native <select> onChange handlers
                                    onChange({ target: { value: opt.value } });
                                    setIsOpen(false);
                                }}
                                className={`px-4 py-2.5 text-sm font-medium rounded-xl text-left transition-colors whitespace-nowrap ${
                                    String(value) === String(opt.value) 
                                        ? 'bg-primary text-white font-bold' 
                                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomSelect;
