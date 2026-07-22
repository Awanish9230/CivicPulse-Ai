import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Clock, AlertTriangle, User, ShieldAlert, Fingerprint, Check, Award, Star, Zap, Info } from 'lucide-react';
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ROTATION_INTERVAL = 10 * 60 * 1000; // 10 minutes

const Profile = () => {
    const { user, fetchUser } = useContext(AuthContext);
    const [timeLeft, setTimeLeft] = useState(0);
    const [hoveredBadge, setHoveredBadge] = useState(null);

    const getNextRotationTime = () => {
        const storedTime = localStorage.getItem('nextRotationTime');
        if (storedTime && parseInt(storedTime) > Date.now()) {
            return parseInt(storedTime);
        }
        const newTime = Date.now() + ROTATION_INTERVAL;
        localStorage.setItem('nextRotationTime', newTime.toString());
        return newTime;
    };

    const rotateIdentity = async () => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/user/rotate-anonymous-id`, {}, {
                withCredentials: true
            });
            await fetchUser();
            toast.success("Identity auto-rotated successfully for security.", { icon: '🔄' });
            
            const newTime = Date.now() + ROTATION_INTERVAL;
            localStorage.setItem('nextRotationTime', newTime.toString());
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to rotate identity.");
        }
    };

    useEffect(() => {
        const nextTime = getNextRotationTime();
        
        const updateTimer = () => {
            const now = Date.now();
            const difference = nextTime - now;

            if (difference <= 0) {
                setTimeLeft(0); 
            } else {
                setTimeLeft(difference);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [user?.anonymousId]);

    const formatTime = (ms) => {
        if (ms <= 0) return "00:00";
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center min-h-[70vh]">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(0,0,0,0.05)] border border-border/50"
                >
                    <User size={40} className="text-text/30" />
                </motion.div>
                <h2 className="text-3xl font-black text-text mb-3">Access Denied</h2>
                <p className="text-text/60 max-w-md mx-auto text-lg">You must be logged in to view your secure profile dashboard.</p>
            </div>
        );
    }

    const isAuthority = user.role === 'Authority';

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <div className="relative min-h-[85vh] w-full overflow-hidden pb-20">
            {/* Dynamic Background Elements */}
            <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full mix-blend-multiply filter blur-[120px] opacity-30 animate-blob" 
                     style={{ background: isAuthority ? 'radial-gradient(circle, rgba(234,179,8,0.4) 0%, rgba(234,179,8,0) 70%)' : 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, rgba(59,130,246,0) 70%)' }}></div>
                <div className="absolute top-[20%] right-[-20%] w-[60vw] h-[60vw] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-blob animation-delay-2000"
                     style={{ background: isAuthority ? 'radial-gradient(circle, rgba(249,115,22,0.4) 0%, rgba(249,115,22,0) 70%)' : 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(168,85,247,0) 70%)' }}></div>
                {/* Subtle Grid overlay */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
            </div>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10 pt-4"
            >
                {/* Header */}
                <div className="border-b border-border/40 pb-6">
                    <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-text to-text/60 tracking-tight mb-2">
                        {isAuthority ? 'Command Center' : 'Secure Identity'}
                    </motion.h1>
                    <motion.p variants={itemVariants} className="text-text/60 font-medium text-lg">
                        Manage your {isAuthority ? 'official credentials' : 'anonymous footprint'} and civic impact.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    
                    {/* Ultimate Holographic ID Card */}
                    <motion.div 
                        variants={itemVariants}
                        whileHover={{ scale: 1.01, rotateX: 2, rotateY: -2 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className={`md:col-span-12 rounded-[2rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group perspective-1000 ${
                            isAuthority 
                                ? 'bg-gradient-to-br from-yellow-500 via-amber-600 to-yellow-900 shadow-[0_20px_50px_rgba(234,179,8,0.25)] border border-yellow-400/30' 
                                : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-900 shadow-[0_20px_50px_rgba(59,130,246,0.3)] border border-blue-400/30'
                        }`}
                    >
                        {/* Shimmer effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
                        
                        {/* Background Icon */}
                        <div className="absolute -top-16 -right-16 opacity-10 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 ease-out z-0">
                            {isAuthority ? <ShieldAlert size={320} /> : <Fingerprint size={320} />}
                        </div>
                        
                        <div className="relative z-10 flex flex-col h-full gap-10">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="space-y-2 flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <p className="text-white/80 font-bold text-xs md:text-sm tracking-[0.2em] uppercase">
                                            {user.role === 'Citizen' ? 'Encrypted Alias' : 'Official Designation'}
                                        </p>
                                        <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                            <span className="text-[10px] font-bold tracking-wider text-green-300">LIVE</span>
                                        </div>
                                    </div>
                                    <h2 className="text-4xl md:text-5xl font-black tracking-widest drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] truncate bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
                                        {user.role === 'Citizen' ? (user.anonymousId || "N/A") : (user.name || user.email)}
                                    </h2>
                                </div>
                                <div className="bg-white/10 backdrop-blur-xl px-5 py-3 rounded-2xl flex items-center gap-3 border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] shrink-0 group-hover:bg-white/20 transition-colors">
                                    <ShieldCheck size={24} className={isAuthority ? 'text-yellow-300' : 'text-blue-300'} />
                                    <div>
                                        <div className="text-xs font-bold text-white/70 uppercase tracking-wider mb-0.5">Status</div>
                                        <div className="text-sm font-black text-white uppercase tracking-widest">
                                            {isAuthority ? 'Verified Level 3' : 'Secure & Anonymous'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-white/10">
                                {/* Rotation Timer */}
                                {user.role === 'Citizen' ? (
                                    <div className="bg-black/10 rounded-2xl p-4 border border-white/5 backdrop-blur-sm relative overflow-hidden">
                                        <div className={`absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-1000`} style={{ width: `${(timeLeft / ROTATION_INTERVAL) * 100}%` }}></div>
                                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Clock size={14} /> Auto-Rotation In
                                        </p>
                                        <div className="font-mono text-3xl font-black tracking-wider">
                                            <span className={timeLeft < 60000 ? 'text-red-400 animate-pulse drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]' : 'text-white'}>
                                                {formatTime(timeLeft)}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-black/10 rounded-2xl p-4 border border-white/5 backdrop-blur-sm">
                                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Zap size={14} /> System Access
                                        </p>
                                        <div className="font-mono text-xl font-black text-yellow-300">
                                            {user.role === 'Admin' ? 'Super Admin' : (user.authorityLevel || 'Official')}
                                        </div>
                                    </div>
                                )}

                                {/* Network Status */}
                                <div className="bg-black/10 rounded-2xl p-4 border border-white/5 backdrop-blur-sm flex flex-col justify-center">
                                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Encryption</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <Check size={16} className="text-green-400" />
                                        </div>
                                        <div>
                                            <p className="font-black text-lg text-white">AES-256</p>
                                            <p className="text-xs font-medium text-green-300">Untraceable Routing</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Registration Date */}
                                <div className="bg-black/10 rounded-2xl p-4 border border-white/5 backdrop-blur-sm flex flex-col justify-center md:items-end">
                                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Initialization Date</p>
                                    <p className="font-mono text-xl font-bold text-white/90">
                                        {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Trust Score / Strikes */}
                    {user.role === 'Citizen' && (
                        <motion.div 
                            variants={itemVariants}
                            whileHover={{ y: -5 }}
                            className="md:col-span-5 bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white relative overflow-hidden group"
                        >
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-colors duration-500"></div>
                            
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div>
                                    <h3 className="font-black text-2xl text-text flex items-center gap-2">
                                        Trust Score
                                        <div className="group/tooltip relative">
                                            <Info size={16} className="text-text/30 cursor-help" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-text text-surface text-xs rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all shadow-xl text-center pointer-events-none">
                                                Maintained by civic behavior. 3 strikes result in a ban.
                                            </div>
                                        </div>
                                    </h3>
                                    <p className="text-text/50 font-medium text-sm mt-1">Community standing indicator</p>
                                </div>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${user.strikes === 0 ? 'bg-green-100 text-green-600' : user.strikes < 3 ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                                    {user.strikes === 0 ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
                                </div>
                            </div>

                            <div className="flex gap-4 relative z-10">
                                {[1, 2, 3].map((strike) => {
                                    const hasStrike = user.strikes >= strike;
                                    return (
                                        <div key={strike} className={`flex-1 h-20 rounded-2xl border-2 flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
                                            hasStrike 
                                                ? 'bg-red-50 border-red-400 shadow-[inset_0_0_20px_rgba(239,68,68,0.2),0_0_15px_rgba(239,68,68,0.2)]' 
                                                : 'bg-surface border-border/40 text-text/40 shadow-sm'
                                        }`}>
                                            {hasStrike ? (
                                                <AlertTriangle size={32} className="text-red-500 animate-pulse drop-shadow-sm" />
                                            ) : (
                                                <span className="font-black text-3xl opacity-60">{strike}</span>
                                            )}
                                            {/* Gloss reflection */}
                                            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none rounded-t-xl"></div>
                                        </div>
                                    )
                                })}
                            </div>
                            
                            <div className="mt-8 relative z-10 flex items-center justify-center">
                                <div className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-sm ${
                                    user.strikes === 0 ? 'bg-green-100/50 text-green-700 border border-green-200' : 
                                    user.strikes < 3 ? 'bg-orange-100/50 text-orange-700 border border-orange-200' : 
                                    'bg-red-100/50 text-red-700 border border-red-200'
                                }`}>
                                    <span className={`w-2 h-2 rounded-full ${user.strikes === 0 ? 'bg-green-500' : user.strikes < 3 ? 'bg-orange-500' : 'bg-red-500 animate-pulse'}`}></span>
                                    {user.strikes || 0} / 3 Strikes. {user.strikes < 3 ? 'Account in Good Standing.' : 'Account Suspended.'}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Gamification / Civic Impact */}
                    {user.role === 'Citizen' && (
                        <motion.div 
                            variants={itemVariants}
                            whileHover={{ y: -5 }}
                            className="md:col-span-7 bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white relative overflow-hidden group"
                        >
                            <div className="absolute -top-32 -left-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors duration-700"></div>
                            
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div>
                                    <h3 className="font-black text-2xl text-text flex items-center gap-2">Civic Impact</h3>
                                    <p className="text-text/50 font-medium text-sm mt-1">Earn points by verifying reports</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 px-4 py-2 rounded-xl text-white shadow-lg shadow-purple-500/20 flex items-center gap-2">
                                    <Star size={18} className="fill-current" />
                                    <span className="font-black text-xl">{user.points || 0} <span className="text-xs font-bold opacity-80 uppercase tracking-widest">XP</span></span>
                                </div>
                            </div>

                            <div className="bg-surface/50 rounded-2xl p-6 border border-border/40 relative z-10">
                                <p className="text-text/60 font-bold text-xs uppercase tracking-widest mb-4">Earned Honors</p>
                                
                                <div className="flex flex-wrap gap-3">
                                    {(!user.badges || user.badges.length === 0) ? (
                                        <div className="w-full py-8 border-2 border-dashed border-border/60 rounded-xl flex flex-col items-center justify-center text-text/40">
                                            <Award size={32} className="mb-2 opacity-50" />
                                            <span className="font-bold text-sm">Verify reports to unlock badges</span>
                                        </div>
                                    ) : (
                                        user.badges.map((badge, idx) => (
                                            <motion.div 
                                                key={idx}
                                                whileHover={{ scale: 1.05, y: -2 }}
                                                onHoverStart={() => setHoveredBadge(idx)}
                                                onHoverEnd={() => setHoveredBadge(null)}
                                                className="relative cursor-default"
                                            >
                                                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-[1px] rounded-full shadow-md shadow-purple-500/20">
                                                    <div className="bg-white px-4 py-2 rounded-full flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                                                            <Award size={14} className="text-purple-600" />
                                                        </div>
                                                        <span className="font-bold text-sm text-text">{badge}</span>
                                                    </div>
                                                </div>
                                                
                                                {/* Tooltip hint */}
                                                <AnimatePresence>
                                                    {hoveredBadge === idx && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: 5 }}
                                                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-text text-surface text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl"
                                                        >
                                                            Verified Contributor
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Account Settings / Meta - Authority spans full width if they don't have the other cards */}
                    <motion.div 
                        variants={itemVariants}
                        whileHover={{ y: -5 }}
                        className={`${isAuthority ? 'md:col-span-12' : 'md:col-span-12'} bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white relative overflow-hidden group`}
                    >
                        <div className="flex flex-col md:flex-row gap-8 items-center justify-between relative z-10">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-white shadow-inner flex items-center justify-center shrink-0">
                                    <User size={28} className="text-slate-500" />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-text">Account Meta</h3>
                                    <p className="text-text/50 font-medium text-sm">Role & Security Defaults</p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                <div className="bg-surface/80 px-6 py-4 rounded-2xl border border-border/40 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <ShieldCheck size={18} />
                                    </div>
                                    <div>
                                        <p className="text-text/50 font-bold text-[10px] uppercase tracking-widest">Assigned Role</p>
                                        <p className={`font-black text-sm uppercase tracking-wider ${isAuthority ? 'text-yellow-600' : 'text-blue-600'}`}>{user.role || 'Citizen'}</p>
                                    </div>
                                </div>
                                
                                <div className="bg-surface/80 px-6 py-4 rounded-2xl border border-border/40 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        <Check size={18} />
                                    </div>
                                    <div>
                                        <p className="text-text/50 font-bold text-[10px] uppercase tracking-widest">Data Policy</p>
                                        <p className="font-black text-sm text-green-600 uppercase tracking-wider">Zero-Trace</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </motion.div>
        </div>
    );
};

export default Profile;
