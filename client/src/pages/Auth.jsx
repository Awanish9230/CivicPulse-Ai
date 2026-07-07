import { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, User, Loader2, Sparkles, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../config/api';
import { useNavigate, Link } from 'react-router-dom';
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

        try {
            const response = await api.post(isLogin ? '/user/login' : '/user/register', {
                email,
                password,
                role: 'Citizen'
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
        <div className="min-h-[100dvh] md:h-screen relative overflow-hidden bg-[#0a0f1c] flex items-center justify-center p-4 md:p-0">
            
            {/* Abstract Background Image */}
            <div className="absolute inset-0 pointer-events-none">
                <div 
                    className="absolute inset-0 bg-[url('/abstract-city-bg.png')] bg-cover bg-center"
                ></div>
                <div className="absolute inset-0 bg-[#0a0f1c]/60"></div>
                <motion.div 
                    animate={{ opacity: [0.15, 0.25, 0.15], scale: [1, 1.05, 1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-3xl h-[80vw] max-h-3xl rounded-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent blur-3xl"
                />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-3xl overflow-hidden p-6 md:p-8">
                    
                    {/* Header */}
                    <div className="text-center mb-6 md:mb-8">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                            className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4 shadow-inner"
                        >
                            <ShieldCheck size={24} />
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="text-2xl font-bold text-white mb-2 tracking-tight"
                        >
                            CivicPulse
                        </motion.h1>
                        <div className="h-10 flex items-center justify-center">
                            <motion.p 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.5 }}
                                className="text-slate-400 text-sm font-medium"
                            >
                                {isLogin ? "Sign in to your anonymous dashboard" : "Join the anonymous citizen network"}
                            </motion.p>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.form
                            key={isLogin ? "login" : "signup"}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            onSubmit={handleCitizenSubmit}
                            className="space-y-4"
                        >
                            {/* Email Field */}
                            <div className="relative group">
                                <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${focusedField === 'email' ? 'bg-blue-500/10 blur-md' : 'opacity-0'}`}></div>
                                <div className="relative bg-[#0f172a]/80 border border-slate-700/50 rounded-xl focus-within:border-blue-500/50 transition-all duration-300">
                                    <input 
                                        id="email"
                                        type="email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        className="w-full bg-transparent px-4 pt-6 pb-2 text-white text-sm focus:outline-none peer [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s]"
                                        placeholder=" "
                                        required
                                    />
                                    <label 
                                        htmlFor="email" 
                                        className="absolute text-slate-500 left-4 top-4 transition-all duration-300 peer-focus:text-[11px] peer-focus:text-blue-400 peer-focus:top-1.5 peer-focus:font-semibold peer-not-placeholder-shown:text-[11px] peer-not-placeholder-shown:text-blue-400 peer-not-placeholder-shown:top-1.5 peer-not-placeholder-shown:font-semibold pointer-events-none"
                                    >
                                        Email Address
                                    </label>
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="relative group">
                                <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${focusedField === 'password' ? 'bg-blue-500/10 blur-md' : 'opacity-0'}`}></div>
                                <div className="relative bg-[#0f172a]/80 border border-slate-700/50 rounded-xl focus-within:border-blue-500/50 transition-all duration-300">
                                    <input 
                                        id="password"
                                        type={showPassword ? "text" : "password"} 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        className="w-full bg-transparent px-4 pt-6 pb-2 pr-12 text-white text-sm focus:outline-none peer [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s]"
                                        placeholder=" "
                                        required
                                    />
                                    <label 
                                        htmlFor="password" 
                                        className="absolute text-slate-500 left-4 top-4 transition-all duration-300 peer-focus:text-[11px] peer-focus:text-blue-400 peer-focus:top-1.5 peer-focus:font-semibold peer-not-placeholder-shown:text-[11px] peer-not-placeholder-shown:text-blue-400 peer-not-placeholder-shown:top-1.5 peer-not-placeholder-shown:font-semibold pointer-events-none"
                                    >
                                        Password
                                    </label>
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between items-center px-1 h-5">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">100% Anonymous</span>
                                </div>
                                <Link to="/forgot-password" className={`text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors ${!isLogin && 'invisible pointer-events-none'}`}>
                                    Forgot password?
                                </Link>
                            </div>

                            <motion.button 
                                type="submit" 
                                disabled={loading}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 group mt-2 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin text-slate-600" /> 
                                        <span className="text-sm">{isLogin ? "Authenticating..." : "Creating Identity..."}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-sm">{isLogin ? "Sign In" : "Join Anonymously"}</span>
                                        <ArrowRight size={16} className="text-slate-600 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </motion.button>
                        </motion.form>
                    </AnimatePresence>
                    
                    <div className="mt-6 pt-5 border-t border-white/5 text-center">
                        <button 
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setEmail('');
                                setPassword('');
                            }}
                            className="text-sm text-slate-400 hover:text-white transition-colors group"
                            type="button"
                        >
                            {isLogin ? (
                                <span>Don't have an identity? <span className="text-blue-400 font-semibold group-hover:text-blue-300">Create one</span></span>
                            ) : (
                                <span>Already have an identity? <span className="text-blue-400 font-semibold group-hover:text-blue-300">Sign in</span></span>
                            )}
                        </button>

                        <p className={`mt-4 text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto ${isLogin ? 'invisible' : ''}`}>
                            By joining, you agree to our Community Guidelines. Spam or toxicity will result in an automated ban.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Auth;
