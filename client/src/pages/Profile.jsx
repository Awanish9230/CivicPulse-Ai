import { motion } from 'framer-motion';
import { ShieldCheck, Clock, AlertTriangle, User, ShieldAlert, Fingerprint, Check } from 'lucide-react';
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
            await axios.post('http://localhost:5000/api/v1/user/rotate-anonymous-id', {}, {
                withCredentials: true
            });
            await fetchUser(); // Refresh user info to get new ID
            toast.success("Identity rotated successfully for security.", { icon: '🔄' });
            
            // Reset timer
            const newTime = Date.now() + ROTATION_INTERVAL;
            localStorage.setItem('nextRotationTime', newTime.toString());
        } catch (error) {
            toast.error("Failed to rotate identity.");
        }
    };

    useEffect(() => {
        const nextTime = getNextRotationTime();
        
        const updateTimer = () => {
            const now = Date.now();
            const difference = nextTime - now;

            if (difference <= 0) {
                rotateIdentity();
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
            {/* Ambient background */}
            <div className={`absolute top-[10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none -z-10 ${isAuthority ? 'bg-yellow-500/10' : 'bg-primary/10'}`}></div>

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
                    className={`md:col-span-2 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group ${
                        isAuthority ? 'bg-gradient-to-br from-yellow-600 to-yellow-800 shadow-yellow-500/20' : 'bg-gradient-to-br from-primary to-blue-700 shadow-primary/20'
                    }`}
                >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="absolute -top-10 -right-10 opacity-10 transform group-hover:scale-110 transition-transform duration-700">
                        {isAuthority ? <ShieldAlert size={240} /> : <Fingerprint size={240} />}
                    </div>
                    
                    <div className="relative z-10 flex flex-col h-full justify-between gap-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-white/70 font-bold text-sm tracking-widest uppercase mb-2 flex items-center gap-2">
                                    {isAuthority ? 'Official Designation' : 'Current Identity'}
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                </p>
                                <h2 className="text-5xl font-black font-mono tracking-wider drop-shadow-md">{user.anonymousId || "N/A"}</h2>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 border border-white/20 shadow-inner">
                                <ShieldCheck size={18} className={isAuthority ? 'text-yellow-300' : 'text-green-300'} />
                                <span className="text-sm font-bold text-white tracking-wide uppercase">
                                    {isAuthority ? 'Verified Authority' : 'Verified Secure'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-end justify-between border-t border-white/20 pt-6">
                            {!isAuthority ? (
                                <div>
                                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">Next Auto-Rotation</p>
                                    <div className="flex items-center gap-2 font-mono text-2xl font-bold bg-black/20 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                                        <Clock size={20} className={timeLeft < 60000 ? 'text-red-400 animate-pulse' : 'text-white/80'} />
                                        <span className={timeLeft < 60000 ? 'text-red-400' : 'text-white'}>{formatTime(timeLeft)}</span>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">Clearance Level</p>
                                    <div className="font-mono text-xl font-bold">Admin-Level 3</div>
                                </div>
                            )}
                            <div className="text-right">
                                <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">Network Status</p>
                                <p className="font-bold text-green-300 flex items-center gap-2 justify-end">
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
