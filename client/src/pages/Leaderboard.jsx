import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Medal, Award, Sparkles, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import PageLoader from '../components/common/PageLoader';

const Leaderboard = () => {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/user/leaderboard`, { withCredentials: true });
            setLeaders(data.data);
        } catch (error) {
            toast.error("Failed to load leaderboard");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <PageLoader />;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
                    <Trophy size={40} />
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Civic Leaderboard</h1>
                <p className="text-slate-500 mt-2 max-w-lg">
                    Top citizens making a difference in the community. Earn points by verifying issues, submitting valid complaints, and engaging with the community!
                </p>
            </div>

            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between font-bold text-slate-500 text-sm px-6">
                    <div className="flex items-center gap-12">
                        <span>Rank</span>
                        <span>Citizen (Anonymized)</span>
                    </div>
                    <div className="flex items-center gap-12">
                        <span className="hidden md:block">Badges</span>
                        <span>Points</span>
                    </div>
                </div>

                <div className="divide-y divide-slate-50">
                    {leaders.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                            <AlertCircle size={48} className="mb-4 text-slate-300" />
                            <p>No citizens on the leaderboard yet. Be the first!</p>
                        </div>
                    ) : (
                        leaders.map((leader, idx) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={leader.id} 
                                className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-10 flex justify-center">
                                        {leader.rank === 1 ? (
                                            <Medal className="text-yellow-500" size={28} />
                                        ) : leader.rank === 2 ? (
                                            <Medal className="text-slate-400" size={28} />
                                        ) : leader.rank === 3 ? (
                                            <Medal className="text-amber-700" size={28} />
                                        ) : (
                                            <span className="text-lg font-bold text-slate-400">#{leader.rank}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
                                            leader.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                                            leader.rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500' :
                                            leader.rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                                            'bg-gradient-to-br from-blue-500 to-indigo-600'
                                        }`}>
                                            {leader.displayName.charAt(9)}
                                        </div>
                                        <span className={`font-bold ${leader.rank <= 3 ? 'text-slate-800' : 'text-slate-600'}`}>
                                            {leader.displayName}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="hidden md:flex items-center gap-2">
                                        {leader.badges.slice(0, 3).map((badge, i) => (
                                            <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg border border-indigo-100 flex items-center gap-1">
                                                <Award size={12} /> {badge}
                                            </span>
                                        ))}
                                        {leader.badges.length > 3 && (
                                            <span className="text-xs text-slate-400 font-bold">+{leader.badges.length - 3}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100 w-24 justify-center">
                                        <Sparkles size={16} className="text-orange-500" />
                                        <span className="font-bold text-orange-600">{leader.points}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
