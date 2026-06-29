import { motion } from 'framer-motion';
import { ShieldCheck, UserSecret, Clock, AlertTriangle } from 'lucide-react';
// replacing UserSecret with generic User
import { User } from 'lucide-react';

const Profile = () => {
    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <h1 className="text-3xl font-black text-text tracking-tight mb-6">Anonymous Identity</h1>

            {/* ID Card */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-primary to-blue-600 rounded-[2rem] p-8 text-white shadow-2xl shadow-primary/20 relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute top-0 right-0 p-8 opacity-20"><User size={120} /></div>
                
                <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-white/70 font-medium text-sm tracking-widest uppercase mb-1">Current Identity</p>
                            <h2 className="text-4xl font-black font-mono tracking-wider">Citizen-X9K8A</h2>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2">
                            <ShieldCheck size={16} className="text-green-300" />
                            <span className="text-xs font-bold text-white">Verified Secure</span>
                        </div>
                    </div>

                    <div className="flex items-end justify-between border-t border-white/20 pt-6 mt-4">
                        <div>
                            <p className="text-white/70 text-xs mb-1">Next Rotation In</p>
                            <div className="flex items-center gap-2 font-mono text-xl font-bold">
                                <Clock size={20} />
                                14:22
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-white/70 text-xs mb-1">Network Status</p>
                            <p className="font-bold">Untraceable</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Strike System */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-border/50">
                <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-text">Community Strikes</h3>
                        <p className="text-text/60 text-xs">Maintain good behavior to avoid bans.</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    {[1, 2, 3].map((strike) => (
                        <div key={strike} className="flex-1 bg-surface h-12 rounded-xl border border-border/50 flex items-center justify-center font-black text-text/30 relative overflow-hidden">
                            {/* Empty strikes for now */}
                        </div>
                    ))}
                </div>
                <p className="text-center text-xs text-text/40 mt-4">
                    0 / 3 Strikes. You are in good standing!
                </p>
            </div>
        </div>
    );
};

export default Profile;
