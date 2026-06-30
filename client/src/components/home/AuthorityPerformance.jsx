import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, TrendingUp, Minus } from 'lucide-react';

const AuthorityPerformance = () => {
    const [leaderboard, setLeaderboard] = useState([]);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const { data } = await axios.get('http://localhost:5000/api/v1/public/leaderboard');
                if (data.success) {
                    setLeaderboard(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch leaderboard", error);
            }
        };
        fetchLeaderboard();
    }, []);
    return (
        <section className="py-20">
            <div className="flex flex-col md:flex-row gap-12 items-center">
                <div className="w-full md:w-1/2 space-y-6">
                    <h2 className="text-3xl md:text-4xl font-black text-slate-800">Gamifying Civic Responsibility</h2>
                    <p className="text-lg text-slate-500 leading-relaxed">
                        We hold authorities accountable through a transparent performance leaderboard. Departments are ranked based on their resolution speed and citizen feedback scores.
                    </p>
                    <button className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:-translate-y-1 transition-transform">
                        View Full Rankings
                    </button>
                </div>
                
                <div className="w-full md:w-1/2">
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden">
                        <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Trophy className="text-amber-500" /> Authority Leaderboard</h3>
                            <span className="text-sm font-bold text-indigo-600">This Month</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {leaderboard.map((dept, index) => {
                                const rank = index + 1;
                                return (
                                <div key={rank} className="p-4 flex items-center hover:bg-slate-50 transition-colors">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black mr-4 ${rank === 1 ? 'bg-amber-100 text-amber-600' : rank === 2 ? 'bg-slate-200 text-slate-600' : rank === 3 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                                        {rank}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-800">{dept._id || "General"} Department</h4>
                                        <p className="text-xs text-slate-500">{dept.resolved} issues resolved</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="font-black text-slate-800">Top</div>
                                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Performer</div>
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AuthorityPerformance;
