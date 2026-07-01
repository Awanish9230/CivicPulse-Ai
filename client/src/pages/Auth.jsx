import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, User, Shield, Loader2, Sparkles, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../config/api';
import { useNavigate, Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    
    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Input focus states for floating labels
    const [focusedField, setFocusedField] = useState(null);

    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const handleCitizenSubmit = async (e) => {
        e.preventDefault();
        
        if (!email || !password) {
            toast.error("Please enter both email and password");
            return;
        }

        setLoading(true);
        const endpoint = isLogin ? '/api/v1/user/login' : '/api/v1/user/register';

        try {
            const response = await api.post(isLogin ? '/user/login' : '/user/register', {
                email,
                password
            });

            if (isLogin) {
                login(response.data.data.user);
                toast.success("Welcome back! Login successful.");
                navigate('/');
            } else {
                toast.success("Account created successfully! Please login to continue.");
                setIsLogin(true); // Switch to login after signup
                setPassword('');
            }
        } catch (error) {
            const message = error.response?.data?.message || "An error occurred. Please try again.";
            toast.error(message);
        } finally {
            setLoading(false);
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
                className="w-full max-w-5xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-3xl overflow-hidden flex flex-col md:flex-row relative z-10"
            >
                {/* Left Side: Branding & Dynamic Info */}
                <div className="w-full md:w-5/12 bg-gradient-to-br from-primary/80 to-blue-900/80 p-5 sm:p-6 md:p-14 flex flex-col justify-between text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20 mix-blend-overlay"></div>
                    
                    <div className="relative z-10">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6"
                        >
                            <Sparkles size={14} className="text-blue-200" />
                            <span className="text-xs font-bold tracking-wider uppercase text-blue-50">Citizen Portal</span>
                        </motion.div>
                        
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="text-3xl md:text-5xl font-black mb-1 md:mb-4 tracking-tight leading-tight"
                        >
                            CivicPulse.
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="text-blue-100 text-lg font-medium leading-relaxed max-w-sm"
                        >
                            Report issues. Track progress. Transform your community anonymously.
                        </motion.p>
                    </div>
                    
                    <div className="relative z-10 mt-6 md:mt-0">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="space-y-4 md:space-y-6"
                        >
                            <div className="flex items-start gap-4 md:gap-5 bg-white/5 p-4 md:p-5 rounded-2xl backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="bg-primary/40 p-2 md:p-3 rounded-xl shadow-inner">
                                    <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base md:text-lg text-white mb-1">100% Anonymous</h3>
                                    <p className="text-blue-200 text-xs md:text-sm leading-relaxed">
                                        Your identity is never exposed. We rotate your Citizen ID securely every 30 minutes.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Right Side: Glassmorphism Auth Forms */}
                <div className="w-full md:w-7/12 p-5 sm:p-6 md:p-14 bg-slate-900/50 relative flex items-center">
                    <div className="w-full max-w-md mx-auto min-h-[450px] md:min-h-[500px] flex flex-col justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isLogin ? "login" : "signup"}
                                initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
                                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                            >
                                <div className="mb-4 md:mb-10 text-center md:text-left">
                                    <h2 className="text-2xl md:text-3xl font-black text-white mb-2 md:mb-3">
                                        {isLogin ? "Welcome Back" : "Join Anonymously"}
                                    </h2>
                                    <p className="text-slate-400 text-xs md:text-base">
                                        {isLogin ? "Login to access your citizen dashboard." : "Verify your email to prevent spam. We'll assign you a secure, rotating identity."}
                                    </p>
                                </div>

                                <form onSubmit={handleCitizenSubmit} className="space-y-4 md:space-y-6">
                                    {/* Email Field */}
                                    <div className="relative">
                                        <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${focusedField === 'email' ? 'bg-primary/20 blur-md' : 'opacity-0'}`}></div>
                                        <div className="relative bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl focus-within:border-primary/50 focus-within:bg-slate-800 transition-all duration-300">
                                            <input 
                                                id="email"
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
                                            <User size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 peer-focus:text-primary transition-colors" />
                                        </div>
                                    </div>

                                    {/* Password Field */}
                                    <div className="relative">
                                        <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${focusedField === 'password' ? 'bg-primary/20 blur-md' : 'opacity-0'}`}></div>
                                        <div className="relative bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl focus-within:border-primary/50 focus-within:bg-slate-800 transition-all duration-300">
                                            <input 
                                                id="password"
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
                                                htmlFor="password" 
                                                className="absolute text-slate-400 left-5 top-5 transition-all duration-300 peer-focus:text-xs peer-focus:text-primary peer-focus:top-2 peer-focus:font-bold peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:font-bold pointer-events-none"
                                            >
                                                Password
                                            </label>
                                            <button 
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>

                                    {isLogin && (
                                        <div className="flex justify-end mt-2">
                                            <Link to="/forgot-password" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors z-10 relative">
                                                Forgot Password?
                                            </Link>
                                        </div>
                                    )}

                                    <motion.button 
                                        type="submit" 
                                        disabled={loading}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="relative w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 md:py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2 group mt-2 md:mt-4 overflow-hidden disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
                                    >
                                        <motion.span 
                                            animate={{ x: ["-100%", "200%"] }}
                                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                            className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                        />
                                        <span className="relative flex items-center gap-2 z-10">
                                            {loading ? (
                                                <>
                                                    <Loader2 size={18} className="animate-spin" /> 
                                                    {isLogin ? "Authenticating..." : "Creating Identity..."}
                                                </>
                                            ) : (
                                                <>
                                                    {isLogin ? "Secure Login" : "Continue Anonymously"}
                                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </span>
                                    </motion.button>
                                </form>
                                
                                <div className="text-center md:text-left mt-8">
                                    <button 
                                        onClick={() => {
                                            setIsLogin(!isLogin);
                                            setEmail('');
                                            setPassword('');
                                        }}
                                        className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors"
                                        type="button"
                                    >
                                        {isLogin ? (
                                            <span className="flex items-center justify-center md:justify-start gap-2">
                                                New to CivicPulse? <span className="border-b border-blue-400/50 pb-0.5 hover:border-blue-300">Create an anonymous account</span>
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center md:justify-start gap-2">
                                                Already have an identity? <span className="border-b border-blue-400/50 pb-0.5 hover:border-blue-300">Login here</span>
                                            </span>
                                        )}
                                    </button>
                                </div>
                                
                                {!isLogin && (
                                    <motion.p 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-center md:text-left text-xs text-slate-500 mt-6 leading-relaxed"
                                    >
                                        By joining, you agree to our Community Guidelines. Spam or toxicity will result in an automated IP/Device ban to maintain platform integrity.
                                    </motion.p>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Auth;
