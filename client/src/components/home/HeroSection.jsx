import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MessageSquare, ShieldCheck, Search, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
    return (
        <section className="relative w-full rounded-[40px] bg-[#F8FAFC] border border-slate-200 overflow-hidden py-24 px-6 text-center shadow-inner mt-4">
            {/* Animated Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

            <div className="relative z-10 max-w-5xl mx-auto space-y-8">
                
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
                    AI-Powered Civic Engagement
                </motion.div>
                
                {/* Headline */}
                <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[1.1]"
                >
                    Report Issues. <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
                        Stay Anonymous.
                    </span>
                </motion.h1>
                
                {/* Description */}
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium"
                >
                    CivicPulse AI empowers citizens to report local issues, track resolution in real-time, and hold authorities accountable—all while ensuring 100% untraceable anonymity.
                </motion.p>

                {/* CTAs */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
                >
                    <Link to="/auth?mode=register" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-1">
                        Report Issue <ArrowRight size={20} />
                    </Link>
                    <Link to="/community" className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1">
                        Explore Community
                    </Link>
                    <button className="w-full sm:w-auto px-8 py-4 text-slate-500 font-bold hover:text-slate-700 transition-colors">
                        Learn More
                    </button>
                </motion.div>

                {/* Floating Cards (Background Details) */}
                <div className="absolute hidden lg:block -left-12 top-20 animate-bounce" style={{ animationDuration: '4s' }}>
                    <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 transform -rotate-6">
                        <div className="p-3 bg-red-100 text-red-600 rounded-xl"><Activity size={24} /></div>
                        <div className="text-left">
                            <p className="text-xs text-slate-400 font-bold uppercase">Status</p>
                            <p className="font-bold text-slate-800">Verified by AI</p>
                        </div>
                    </div>
                </div>

                <div className="absolute hidden lg:block -right-12 bottom-0 animate-bounce" style={{ animationDuration: '5s' }}>
                    <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 transform rotate-6">
                        <div className="p-3 bg-green-100 text-green-600 rounded-xl"><ShieldCheck size={24} /></div>
                        <div className="text-left">
                            <p className="text-xs text-slate-400 font-bold uppercase">Identity</p>
                            <p className="font-bold text-slate-800">100% Anonymous</p>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default HeroSection;
