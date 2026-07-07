import { motion } from 'framer-motion';
import { ShieldCheck, Clock, AlertTriangle, User, ShieldAlert, Fingerprint, Check, Award, Star } from 'lucide-react';
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ROTATION_INTERVAL = 10 * 60 * 1000; // 10 minutes

const Profile = () => {
    const { user, fetchUser } = useContext(AuthContext);
    const [timeLeft, setTimeLeft] = useState(0);

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
            await fetchUser(); // Refresh user info to get new ID
            toast.success("Identity auto-rotated successfully for security.", { icon: '🔄' });
            
            // Reset timer
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
                // If it hits 0, AuthContext will handle the actual rotation API call in the background.
                // We just keep checking until the time updates.
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
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-6">
                    <User size={40} className="text-text/30" />
                </div>
                <h2 className="text-2xl font-black text-text mb-2">Access Denied</h2>
                <p className="text-text/60 max-w-md mx-auto">You must be logged in to view your anonymous profile and trust score.</p>
            </div>
        );
    }

    const isAuthority = user.role === 'Authority';

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="max-w-3xl mx-auto space-y-8 pb-20 relative"
        >
            {/* Ambient background (Optimized) */}
            <div className={`absolute top-[10%] left-[-10%] w-[50%] h-[50%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${isAuthority ? 'from-yellow-500/10' : 'from-primary/10'} to-transparent pointer-events-none -z-10`}></div>

            {/* Header */}
            <div className="border-b border-border/50 pb-6">
                <h1 className="text-4xl font-black text-text tracking-tight mb-2">Profile & Security</h1>
                <p className="text-text/60 font-medium">Manage your {isAuthority ? 'official' : 'anonymous'} identity and network trust score.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* ID Card */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    className={`md:col-span-2 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden group ${
                        isAuthority ? 'bg-gradient-to-br from-yellow-600 to-yellow-800 shadow-yellow-500/20' : 'bg-gradient-to-br from-primary to-blue-700 shadow-primary/20'
                    }`}
                >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="absolute -top-10 -right-10 opacity-10 transform group-hover:scale-110 transition-transform duration-700">
                        {isAuthority ? <ShieldAlert size={240} /> : <Fingerprint size={240} />}
                    </div>
                    
                    <div className="relative z-10 flex flex-col h-full justify-between gap-8 md:gap-10">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="min-w-0">
                                <p className="text-white/70 font-bold text-xs md:text-sm tracking-widest uppercase mb-1 md:mb-2 flex items-center gap-2">
                                    {isAuthority ? 'Official Designation' : 'Current Identity'}
                                    <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-400 animate-pulse shrink-0"></span>
                                </p>
                                <h2 className="text-3xl md:text-5xl font-black font-mono tracking-wider drop-shadow-md truncate">{user.anonymousId || "N/A"}</h2>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl flex items-center gap-2 border border-white/20 shadow-inner shrink-0">
                                <ShieldCheck size={16} className={isAuthority ? 'text-yellow-300' : 'text-green-300'} />
                                <span className="text-xs md:text-sm font-bold text-white tracking-wide uppercase">
                                    {isAuthority ? 'Verified' : 'Secure'}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-t border-white/20 pt-6 gap-4">
                            {!isAuthority ? (
                                <div className="w-full sm:w-auto">
                                    <p className="text-white/70 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-2">Next Auto-Rotation</p>
                                    <div className="flex items-center gap-2 font-mono text-xl md:text-2xl font-bold bg-black/20 px-3 py-1.5 md:px-4 md:py-2 rounded-xl backdrop-blur-sm border border-white/10 w-fit">
                                        <Clock size={16} className={timeLeft < 60000 ? 'text-red-400 animate-pulse' : 'text-white/80'} />
                                        <span className={timeLeft < 60000 ? 'text-red-400' : 'text-white'}>{formatTime(timeLeft)}</span>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-white/70 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-2">Clearance Level</p>
                                    <div className="font-mono text-lg md:text-xl font-bold">Admin-Level 3</div>
                                </div>
                            )}
                            <div className="sm:text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-end items-center sm:items-end">
                                <p className="text-white/70 text-[10px] md:text-xs font-bold uppercase tracking-widest sm:mb-2">Network Status</p>
                                <p className="font-bold text-green-300 flex items-center gap-1.5 md:gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Untraceable
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Strike System / Trust Score */}
                {!isAuthority && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-[2rem] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-border/50 relative overflow-hidden group hover:border-orange-500/30 transition-colors"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-[100px] pointer-events-none transition-all group-hover:scale-110"></div>
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border/50 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                                <AlertTriangle size={28} />
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-text">Trust Score</h3>
                                <p className="text-text/50 font-medium text-sm mt-0.5">Maintain good behavior.</p>
                            </div>
                        </div>

                        <div className="flex gap-3 relative z-10">
                            {[1, 2, 3].map((strike) => {
                                const hasStrike = user.strikes >= strike;
                                return (
                                    <div key={strike} className={`flex-1 h-14 rounded-2xl border-2 flex items-center justify-center relative overflow-hidden transition-all ${
                                        hasStrike 
                                            ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                                            : 'bg-surface border-transparent text-text/20'
                                    }`}>
                                        {hasStrike ? (
                                            <AlertTriangle size={24} className="text-red-500 animate-pulse" />
                                        ) : (
                                            <span className="font-black text-2xl opacity-50">{strike}</span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                        <p className="text-center text-sm font-bold mt-6 relative z-10">
                            {user.strikes || 0} / 3 Strikes. 
                            <span className={user.strikes < 3 ? 'text-green-500 ml-1' : 'text-red-500 ml-1'}>
                                {user.strikes < 3 ? 'Standing is Good.' : 'Account Banned.'}
                            </span>
                        </p>
                    </motion.div>
                )}

                {/* Gamification / Points & Badges */}
                {!isAuthority && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-white rounded-[2rem] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-border/50 relative overflow-hidden group hover:border-purple-500/30 transition-colors md:col-span-2"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-[100px] pointer-events-none transition-all group-hover:scale-110"></div>
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border/50 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                                <Award size={28} />
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-text">Civic Impact</h3>
                                <p className="text-text/50 font-medium text-sm mt-0.5">Points & Achievements</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            {/* Points */}
                            <div className="bg-surface rounded-2xl p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-text/50 font-bold text-xs uppercase tracking-wider mb-1">Total Points</p>
                                    <h4 className="text-3xl font-black text-purple-600">{user.points || 0} <span className="text-sm font-bold text-purple-400">XP</span></h4>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-500">
                                    <Star size={24} />
                                </div>
                            </div>

                            {/* Badges */}
                            <div className="bg-surface rounded-2xl p-6">
                                <p className="text-text/50 font-bold text-xs uppercase tracking-wider mb-3">Earned Badges</p>
                                <div className="flex flex-wrap gap-2">
                                    {(!user.badges || user.badges.length === 0) ? (
                                        <div className="text-text/40 text-sm font-medium">Verify resolved reports to earn badges!</div>
                                    ) : (
                                        user.badges.map((badge, idx) => (
                                            <div key={idx} className="bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm shadow-purple-500/20">
                                                <Award size={12} /> {badge}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Additional Stats/Info */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`bg-white rounded-[2rem] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-border/50 relative overflow-hidden group hover:border-primary/30 transition-colors ${isAuthority ? 'md:col-span-2' : ''}`}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] pointer-events-none transition-all group-hover:scale-110"></div>
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border/50 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <h3 className="font-black text-xl text-text">Account Details</h3>
                            <p className="text-text/50 font-medium text-sm mt-0.5">Registration & Settings</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-center bg-surface p-4 rounded-2xl">
                            <span className="font-bold text-text/60 text-sm">Role</span>
                            <span className={`font-black text-sm uppercase tracking-wider ${isAuthority ? 'text-yellow-600' : 'text-primary'}`}>{user.role || 'Citizen'}</span>
                        </div>
                        <div className="flex justify-between items-center bg-surface p-4 rounded-2xl">
                            <span className="font-bold text-text/60 text-sm">Joined</span>
                            <span className="font-bold text-text text-sm">{new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-center bg-surface p-4 rounded-2xl">
                            <span className="font-bold text-text/60 text-sm">Data Policy</span>
                            <span className="font-bold text-green-500 text-sm flex items-center gap-1"><Check size={14}/> Encrypted</span>
                        </div>
                    </div>
                </motion.div>

            </div>
        </motion.div>
    );
};

export default Profile;
