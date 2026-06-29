import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, User, Shield, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Auth = () => {
    const [isAuthority, setIsAuthority] = useState(false);
    const [isLogin, setIsLogin] = useState(false); // Toggle for Citizen login/signup
    
    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
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
            // Using absolute URL for now or relative if proxy is set. Assuming server runs on 5000 and proxy might not be configured, wait, let's use full URL if proxy isn't there, or just /api. Let's assume standard Vite proxy or absolute URL. 
            // We should use `http://localhost:5000` just in case.
            const response = await axios.post(`http://localhost:5000${endpoint}`, {
                email,
                password
            }, {
                withCredentials: true // to set cookies
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

    const handleAuthoritySubmit = async (e) => {
        e.preventDefault();
        toast.error("Authority login is currently under maintenance.");
        // In the future, this will connect to authority endpoints
    };

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-4">
            {/* Ambient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px]"></div>
            </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-4xl bg-white/70 backdrop-blur-2xl border border-white/50 shadow-2xl rounded-[2rem] overflow-hidden flex flex-col md:flex-row relative z-10"
            >
                {/* Left Side: Branding & Info */}
                <div className="w-full md:w-5/12 bg-gradient-to-br from-primary to-blue-600 p-10 flex flex-col justify-between text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="relative z-10">
                        <h1 className="text-4xl font-black mb-2 tracking-tight">CivicPulse</h1>
                        <p className="text-white/80 text-sm font-medium">Report. Track. Collaborate.</p>
                    </div>
                    
                    <div className="relative z-10 mt-12 md:mt-0">
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                                    <User size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">100% Anonymous</h3>
                                    <p className="text-white/70 text-sm leading-relaxed mt-1">
                                        Your identity is never exposed. We rotate your Citizen ID every 30 minutes.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Auth Forms */}
                <div className="w-full md:w-7/12 p-8 md:p-12 bg-white relative">
                    <div className="flex bg-surface p-1 rounded-2xl mb-8 relative">
                        <div 
                            className={`absolute inset-y-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out ${isAuthority ? 'left-[calc(50%+2px)]' : 'left-1'}`}
                        ></div>
                        <button 
                            onClick={() => { setIsAuthority(false); setEmail(''); setPassword(''); }}
                            className={`flex-1 py-3 text-sm font-bold relative z-10 transition-colors ${!isAuthority ? 'text-primary' : 'text-text/50'}`}
                        >
                            Citizen Access
                        </button>
                        <button 
                            onClick={() => { setIsAuthority(true); setEmail(''); setPassword(''); }}
                            className={`flex-1 py-3 text-sm font-bold relative z-10 transition-colors ${isAuthority ? 'text-primary' : 'text-text/50'}`}
                        >
                            Authority Login
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {!isAuthority ? (
                            <motion.div
                                key="citizen"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-5"
                            >
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-black text-text mb-2">
                                        {isLogin ? "Welcome Back" : "Join Anonymously"}
                                    </h2>
                                    <p className="text-text/60 text-sm">
                                        {isLogin ? "Login to access your citizen dashboard." : "Verify your email to prevent spam. We will assign you a secure, rotating identity publicly."}
                                    </p>
                                </div>

                                <form onSubmit={handleCitizenSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-text/80 mb-2">Email Address</label>
                                        <input 
                                            type="email" 
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-surface border border-border/50 rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-text/80 mb-2">Password</label>
                                        <input 
                                            type="password" 
                                            placeholder="••••••••" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-surface border border-border/50 rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        />
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 flex items-center justify-center gap-2 group mt-2 disabled:opacity-70 disabled:hover:translate-y-0"
                                    >
                                        {loading ? <Loader2 size={18} className="animate-spin" /> : (isLogin ? "Login Securely" : "Continue Anonymously")}
                                        {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                                    </button>
                                </form>
                                
                                <div className="text-center mt-4">
                                    <button 
                                        onClick={() => setIsLogin(!isLogin)}
                                        className="text-sm font-bold text-primary hover:underline"
                                    >
                                        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
                                    </button>
                                </div>
                                
                                {!isLogin && (
                                    <p className="text-center text-xs text-text/40 mt-4">
                                        By continuing, you agree to our Community Guidelines. Spam or toxicity will result in an IP/Device ban.
                                    </p>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="authority"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-5"
                            >
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-black text-text mb-2">Authority Portal</h2>
                                    <p className="text-text/60 text-sm">Authorized personnel only.</p>
                                </div>

                                <form onSubmit={handleAuthoritySubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-text/80 mb-2">Official Email</label>
                                        <input 
                                            type="email" 
                                            placeholder="officer@city.gov" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-surface border border-border/50 rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-text/80 mb-2">Password</label>
                                        <input 
                                            type="password" 
                                            placeholder="••••••••" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-surface border border-border/50 rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        />
                                    </div>

                                    <button 
                                        type="submit"
                                        className="w-full bg-text hover:bg-text/90 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:-translate-y-0.5 flex items-center justify-center mt-4"
                                    >
                                        Secure Login
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default Auth;
