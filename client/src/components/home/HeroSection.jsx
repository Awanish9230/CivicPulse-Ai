import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MessageSquare, ShieldCheck, Search, Activity } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const HeroSection = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleReportClick = (e) => {
        e.preventDefault();
        if (user) {
            navigate('/complaints');
        } else {
            navigate('/auth?mode=register');
        }
    };

    return (
        <section className="relative w-full rounded-[2rem] md:rounded-[40px] bg-[#F8FAFC] border border-slate-200 overflow-hidden py-16 sm:py-20 md:py-32 px-4 md:px-6 text-center shadow-inner">
            {/* Optimized Static Background (No animated huge blurs) */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 to-transparent pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400/20 to-transparent pointer-events-none" />

            {/* Floating Cards (Moved to section root to avoid text overlap) */}
            <div className="absolute hidden lg:block left-12 top-1/4 animate-bounce z-20 pointer-events-none" style={{ animationDuration: '4s' }}>
                <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-[0_10px_40px_rgb(0,0,0,0.1)] border border-slate-100 flex items-center gap-3 transform -rotate-6">
                    <div className="p-3 bg-red-100 text-red-600 rounded-xl"><Activity size={24} /></div>
                    <div className="text-left">
                        <p className="text-xs text-slate-400 font-bold uppercase">Status</p>
                        <p className="font-bold text-slate-800">Verified by AI</p>
                    </div>
                </div>
            </div>

            <div className="absolute hidden lg:block right-12 bottom-1/4 animate-bounce z-20 pointer-events-none" style={{ animationDuration: '5s', animationDelay: '1s' }}>
                <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-[0_10px_40px_rgb(0,0,0,0.1)] border border-slate-100 flex items-center gap-3 transform rotate-6">
                    <div className="p-3 bg-green-100 text-green-600 rounded-xl"><ShieldCheck size={24} /></div>
                    <div className="text-left">
                        <p className="text-xs text-slate-400 font-bold uppercase">Identity</p>
                        <p className="font-bold text-slate-800">100% Anonymous</p>
                    </div>
                </div>
            </div>

            <div className="relative z-30 max-w-4xl mx-auto space-y-8 md:space-y-10">
                
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white shadow-sm border border-slate-200 text-indigo-600 font-bold text-sm mb-4"
                >
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                    </span>
                    Join 10,000+ citizens resolving civic issues
                </motion.div>
                
                {/* Headline */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="space-y-4"
                >
                    <h1 className="text-[2.5rem] leading-[1.1] sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-800 tracking-tight">
                        Report. Resolve. <br className="hidden md:block" />
                        <span className="block mt-1 md:mt-0 md:inline text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
                            Rebuild Together.
                        </span>
                    </h1>
                </motion.div>
                
                {/* Description */}
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-base sm:text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium px-2"
                >
                    CivicPulse AI empowers citizens to report local issues, track resolution in real-time, and hold authorities accountable—all while ensuring 100% untraceable anonymity.
                </motion.p>

                {/* CTAs */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 pt-4 px-2"
                >
                    <button onClick={handleReportClick} className="w-full sm:w-auto px-6 py-3.5 md:px-8 md:py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-1 text-sm md:text-base">
                        Report Issue <ArrowRight size={18} className="md:w-5 md:h-5" />
                    </button>
                    <Link to="/community" className="w-full sm:w-auto px-6 py-3.5 md:px-8 md:py-4 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 text-sm md:text-base">
                        Explore Community
                    </Link>
                </motion.div>

            </div>
        </section>
    );
};

export default HeroSection;
