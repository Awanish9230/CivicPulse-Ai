import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Mail, Loader2, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../config/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return toast.error("Please enter your email");

        setIsLoading(true);
        try {
            const { data } = await api.post('/user/forgot-password', { email });
            toast.success(data.message || "Reset link sent!");
            setIsSent(true);
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#0F172A] flex items-center justify-center p-2 sm:p-4 md:p-8">
            {/* Immersive Animated Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-primary/10 blur-[120px] mix-blend-screen"
                />
                <motion.div 
                    animate={{ 
                        scale: [1, 1.5, 1],
                        rotate: [0, -90, 0],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[40%] -right-[20%] w-[60vw] h-[60vw] rounded-full bg-blue-600/10 blur-[120px] mix-blend-screen"
                />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-lg bg-slate-900/50 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-3xl overflow-hidden relative z-10 p-5 sm:p-6 md:p-12"
            >
                <AnimatePresence mode="wait">
                    {isSent ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4 }}
                            className="text-center"
                        >
                            <div className="mx-auto flex items-center justify-center h-12 w-12 md:h-16 md:w-16 rounded-full bg-primary/20 border border-primary/30 mb-4 md:mb-6">
                                <Mail className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                            </div>
                            <h3 className="text-xl md:text-2xl font-black text-white mb-2 md:mb-3">Check your inbox</h3>
                            <p className="text-slate-400 text-xs md:text-base mb-6 md:mb-8 leading-relaxed">
                                If an account exists for <span className="font-semibold text-white">{email}</span>, you will receive a password reset link shortly.
                            </p>
                            <Link to="/auth" className="relative w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/50 font-bold py-3 md:py-4 px-4 rounded-2xl transition-all flex items-center justify-center focus:outline-none">
                                Return to login
                            </Link>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="mb-6 md:mb-10 text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 md:h-16 md:w-16 rounded-full bg-white/5 border border-white/10 mb-4 md:mb-6">
                                    <KeyRound className="h-6 w-6 md:h-8 md:w-8 text-blue-400" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-white mb-2 md:mb-3">
                                    Forgot Password?
                                </h2>
                                <p className="text-slate-400 text-xs md:text-base">
                                    Enter your email address and we'll send you a link to securely reset your password.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                                <div className="relative">
                                    <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${focusedField === 'email' ? 'bg-primary/20 blur-md' : 'opacity-0'}`}></div>
                                    <div className="relative bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl focus-within:border-primary/50 focus-within:bg-slate-800 transition-all duration-300">
                                        <input 
                                            id="email"
                                            name="email"
                                            type="email" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            onFocus={() => setFocusedField('email')}
                                            onBlur={() => setFocusedField(null)}
                                            className="w-full bg-transparent px-5 pt-7 pb-3 text-white focus:outline-none peer [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s]"
                                            placeholder=" "
                                            required
                                        />
                                        <label 
                                            htmlFor="email" 
                                            className="absolute text-slate-400 left-5 top-5 transition-all duration-300 peer-focus:text-xs peer-focus:text-primary peer-focus:top-2 peer-focus:font-bold peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:font-bold pointer-events-none"
                                        >
                                            Email Address
                                        </label>
                                        <Mail size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 peer-focus:text-primary transition-colors" />
                                    </div>
                                </div>

                                    <motion.button 
                                        type="submit" 
                                        disabled={isLoading}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="relative w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 md:py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2 group mt-2 md:mt-4 overflow-hidden disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
                                    >
                                    <span className="relative flex items-center gap-2 z-10">
                                        {isLoading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" /> 
                                                Sending Link...
                                            </>
                                        ) : (
                                            "Send Reset Link"
                                        )}
                                    </span>
                                </motion.button>
                            </form>
                            
                            <div className="text-center mt-6 md:mt-8">
                                <Link to="/auth" className="inline-flex items-center text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors">
                                    <ArrowLeft className="h-4 w-4 mr-2" /> Return to Login
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
