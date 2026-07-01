import React, { useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Lock, Loader2, CheckCircle2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../config/api';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const role = searchParams.get('role') || 'citizen';
    
    // Determine styles and links based on role
    const isAuthority = role === 'authority';
    const isAdmin = role === 'admin';
    
    let returnLink = '/auth';
    
    if (isAdmin) {
        returnLink = '/admin';
    } else if (isAuthority) {
        returnLink = '/authority';
    }
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    // Password strength validation
    const validatePassword = (pass) => {
        if (pass.length < 8) return "Password must be at least 8 characters long";
        if (!/[A-Z]/.test(pass)) return "Password must contain an uppercase letter";
        if (!/[a-z]/.test(pass)) return "Password must contain a lowercase letter";
        if (!/[0-9]/.test(pass)) return "Password must contain a number";
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return "Password must contain a special character";
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            return toast.error("Passwords do not match");
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            return toast.error(passwordError);
        }

        setIsLoading(true);
        try {
            const { data } = await api.post(`/user/reset-password/${token}`, { password });
            toast.success(data.message || "Password updated successfully!");
            setIsSuccess(true);
            setTimeout(() => navigate(returnLink), 3000);
        } catch (error) {
            toast.error(error.response?.data?.message || "Invalid or expired reset token.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`min-h-screen relative overflow-hidden flex items-center justify-center p-2 sm:p-4 md:p-8 ${isAdmin ? 'bg-orange-950' : isAuthority ? 'bg-emerald-950' : 'bg-[#0F172A]'}`}>
            {/* Immersive Animated Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className={`absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full blur-[120px] mix-blend-screen ${isAdmin ? 'bg-orange-500/10' : isAuthority ? 'bg-emerald-500/10' : 'bg-primary/10'}`}
                />
                <motion.div 
                    animate={{ 
                        scale: [1, 1.5, 1],
                        rotate: [0, -90, 0],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className={`absolute top-[40%] -right-[20%] w-[60vw] h-[60vw] rounded-full blur-[120px] mix-blend-screen ${isAdmin ? 'bg-red-600/10' : isAuthority ? 'bg-teal-600/10' : 'bg-blue-600/10'}`}
                />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`w-full max-w-lg backdrop-blur-2xl border shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-3xl overflow-hidden relative z-10 p-5 sm:p-6 md:p-12 ${isAdmin ? 'bg-orange-900/50 border-orange-500/20' : isAuthority ? 'bg-emerald-900/50 border-emerald-500/20' : 'bg-slate-900/50 border-white/10'}`}
            >
                <AnimatePresence mode="wait">
                    {isSuccess ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4 }}
                            className="text-center"
                        >
                            <div className={`mx-auto flex items-center justify-center h-12 w-12 md:h-16 md:w-16 rounded-full border mb-4 md:mb-6 ${isAdmin ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-emerald-500/20 border-emerald-500/30'}`}>
                                <CheckCircle2 className="h-6 w-6 md:h-8 md:w-8 text-emerald-400" />
                            </div>
                            <h3 className="text-xl md:text-2xl font-black text-white mb-2 md:mb-3">Password Updated</h3>
                            <p className="text-slate-400 text-xs md:text-base mb-6 md:mb-8 leading-relaxed">
                                Your password has been successfully reset. You can now use your new password to log in.
                            </p>
                            <Link to={returnLink} className={`relative w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 font-bold py-3 md:py-4 px-4 rounded-2xl transition-all flex items-center justify-center focus:outline-none`}>
                                Redirecting to Login...
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
                                <div className={`mx-auto flex items-center justify-center h-12 w-12 md:h-16 md:w-16 rounded-full border mb-4 md:mb-6 ${isAdmin ? 'bg-orange-500/10 border-orange-500/20' : isAuthority ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                                    <ShieldCheck className={`h-6 w-6 md:h-8 md:w-8 ${isAdmin ? 'text-orange-400' : isAuthority ? 'text-emerald-400' : 'text-blue-400'}`} />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-white mb-2 md:mb-3">
                                    Create New Password
                                </h2>
                                <p className="text-slate-400 text-xs md:text-base">
                                    Your new {isAuthority ? 'official ' : isAdmin ? 'admin ' : ''}password must be strong and different from previous ones.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                                {/* New Password Field */}
                                <div className="relative">
                                    <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${focusedField === 'password' ? (isAdmin ? 'bg-orange-500/20 blur-md' : isAuthority ? 'bg-emerald-500/20 blur-md' : 'bg-primary/20 blur-md') : 'opacity-0'}`}></div>
                                    <div className={`relative bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl transition-all duration-300 ${isAdmin ? 'focus-within:border-orange-500/50' : isAuthority ? 'focus-within:border-emerald-500/50' : 'focus-within:border-primary/50'}`}>
                                        <input 
                                            id="new-password"
                                            type={showPassword ? "text" : "password"} 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onFocus={() => setFocusedField('password')}
                                            onBlur={() => setFocusedField(null)}
                                            className="w-full bg-transparent px-5 pt-7 pb-3 pr-12 text-white focus:outline-none peer [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s]"
                                            placeholder=" "
                                            required
                                        />
                                        <label 
                                            htmlFor="new-password" 
                                            className={`absolute text-slate-400 left-5 top-5 transition-all duration-300 peer-focus:text-xs peer-focus:top-2 peer-focus:font-bold peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:font-bold pointer-events-none ${isAdmin ? 'peer-focus:text-orange-400 peer-[:not(:placeholder-shown)]:text-orange-400' : isAuthority ? 'peer-focus:text-emerald-400 peer-[:not(:placeholder-shown)]:text-emerald-400' : 'peer-focus:text-primary peer-[:not(:placeholder-shown)]:text-primary'}`}
                                        >
                                            New Password
                                        </label>
                                        <button 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className={`absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors ${isAdmin ? 'peer-focus:text-orange-400' : isAuthority ? 'peer-focus:text-emerald-400' : 'peer-focus:text-primary'}`}
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Confirm Password Field */}
                                <div className="relative">
                                    <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${focusedField === 'confirm' ? (isAdmin ? 'bg-orange-500/20 blur-md' : isAuthority ? 'bg-emerald-500/20 blur-md' : 'bg-primary/20 blur-md') : 'opacity-0'}`}></div>
                                    <div className={`relative bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl transition-all duration-300 ${isAdmin ? 'focus-within:border-orange-500/50' : isAuthority ? 'focus-within:border-emerald-500/50' : 'focus-within:border-primary/50'}`}>
                                        <input 
                                            id="confirm-password"
                                            type={showPassword ? "text" : "password"} 
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            onFocus={() => setFocusedField('confirm')}
                                            onBlur={() => setFocusedField(null)}
                                            className="w-full bg-transparent px-5 pt-7 pb-3 pr-12 text-white focus:outline-none peer [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s]"
                                            placeholder=" "
                                            required
                                        />
                                        <label 
                                            htmlFor="confirm-password" 
                                            className={`absolute text-slate-400 left-5 top-5 transition-all duration-300 peer-focus:text-xs peer-focus:top-2 peer-focus:font-bold peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:font-bold pointer-events-none ${isAdmin ? 'peer-focus:text-orange-400 peer-[:not(:placeholder-shown)]:text-orange-400' : isAuthority ? 'peer-focus:text-emerald-400 peer-[:not(:placeholder-shown)]:text-emerald-400' : 'peer-focus:text-primary peer-[:not(:placeholder-shown)]:text-primary'}`}
                                        >
                                            Confirm Password
                                        </label>
                                        <Lock size={20} className={`absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors ${isAdmin ? 'peer-focus:text-orange-400' : isAuthority ? 'peer-focus:text-emerald-400' : 'peer-focus:text-primary'}`} />
                                    </div>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-400">
                                    <span className="font-semibold text-slate-300 mb-2 block">Password Requirements:</span>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Minimum 8 characters</li>
                                        <li>At least one uppercase & lowercase letter</li>
                                        <li>At least one number & special character</li>
                                    </ul>
                                </div>

                                <motion.button 
                                    type="submit" 
                                    disabled={isLoading}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`relative w-full text-white font-bold py-3 md:py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group mt-2 md:mt-4 overflow-hidden disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed ${isAdmin ? 'bg-orange-600 hover:bg-orange-500 shadow-[0_0_20px_rgba(234,88,12,0.3)]' : isAuthority ? 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-primary hover:bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)]'}`}
                                >
                                    <span className="relative flex items-center gap-2 z-10">
                                        {isLoading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" /> 
                                                Resetting Password...
                                            </>
                                        ) : (
                                            "Reset Password"
                                        )}
                                    </span>
                                </motion.button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
