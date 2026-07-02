import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Users, AlertTriangle, UserCheck, Activity, 
    TrendingUp, ShieldAlert, CheckCircle2, Clock
} from 'lucide-react';

const StatCard = ({ title, value, trend, icon: Icon, colorClass }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start justify-between">
        <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">{title}</p>
            <h3 className="text-3xl font-black text-slate-800">{value}</h3>
            {trend && (
                <div className="flex items-center gap-1 mt-2 text-emerald-600 text-sm font-medium">
                    <TrendingUp size={16} />
                    <span>{trend} this week</span>
                </div>
            )}
        </div>
        <div className={`p-4 rounded-xl ${colorClass}`}>
            <Icon size={24} />
        </div>
    </div>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalComplaints: 0,
        activeAuthorities: 0,
        registeredCitizens: 0,
        systemHealth: 100
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/admin/stats`, { withCredentials: true });
                setStats(data.data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            }
        };
        fetchStats();
    }, []);

    const statCards = [
        { title: 'Total Complaints', value: stats.totalComplaints, trend: '+12%', icon: AlertTriangle, colorClass: 'bg-rose-100 text-rose-600' },
        { title: 'Active Authorities', value: stats.activeAuthorities, trend: '+4', icon: UserCheck, colorClass: 'bg-indigo-100 text-indigo-600' },
        { title: 'Registered Citizens', value: stats.registeredCitizens, trend: '+850', icon: Users, colorClass: 'bg-blue-100 text-blue-600' },
        { title: 'System Health', value: `${stats.systemHealth}%`, trend: 'Optimal', icon: Activity, colorClass: 'bg-emerald-100 text-emerald-600' }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800">System Overview</h1>
                    <p className="text-slate-500 mt-1">Monitor all platform metrics and activities in real-time.</p>
                </div>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {statCards.map((stat, idx) => (
                    <StatCard key={idx} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                {/* AI Insights & System Health */}
                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-3xl p-6 shadow-lg text-white">
                        <div className="flex items-center gap-3 mb-6">
                            <ShieldAlert className="text-indigo-400" size={24} />
                            <h2 className="text-xl font-bold">System Health</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-400">Database Load</span>
                                    <span className="font-bold text-emerald-400">Normal (24%)</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-2">
                                    <div className="bg-emerald-400 h-2 rounded-full" style={{ width: '24%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-400">API Latency</span>
                                    <span className="font-bold text-emerald-400">45ms</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-2">
                                    <div className="bg-emerald-400 h-2 rounded-full" style={{ width: '15%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activities */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Recent Platform Activity</h2>
                    <div className="space-y-4">
                        {[
                            { title: 'New Authority Registered', time: '10 mins ago', desc: 'Rahul Verma registered as Junior Authority (Water Dept)', icon: UserCheck, color: 'text-indigo-500 bg-indigo-50' },
                            { title: 'High Priority Complaint', time: '1 hour ago', desc: 'Severe water logging reported in Ward 42.', icon: AlertTriangle, color: 'text-rose-500 bg-rose-50' },
                            { title: 'Complaint Escalated', time: '2 hours ago', desc: 'System automatically escalated Complaint #492 to Senior Level.', icon: TrendingUp, color: 'text-amber-500 bg-amber-50' },
                            { title: 'Bulk Resolution', time: '3 hours ago', desc: '14 complaints marked as resolved by Waste Management Dept.', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50' }
                        ].map((activity, idx) => (
                            <div key={idx} className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${activity.color}`}>
                                    <activity.icon size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-slate-800 truncate pr-4">{activity.title}</h4>
                                        <span className="text-xs font-medium text-slate-400 whitespace-nowrap flex items-center gap-1">
                                            <Clock size={12} /> {activity.time}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 truncate">{activity.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
