import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { BarChart, TrendingUp, AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

const AuthorityAnalytics = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/authority/analytics`, {
                withCredentials: true
            });
            if (data.success || data.data) {
                setComplaints(data.data || []);
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to fetch analytics data');
            toast.error(error.response?.data?.message || 'Failed to fetch analytics data');
        } finally {
            setLoading(false);
        }
    };

    // Analytics Calculations
    const totalComplaints = complaints.length;
    const resolvedCount = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
    const criticalCount = complaints.filter(c => c.priority === 'Critical').length;
    const pendingCount = complaints.filter(c => c.status === 'Submitted' || c.status === 'Verified').length;
    const resolutionRate = totalComplaints ? Math.round((resolvedCount / totalComplaints) * 100) : 0;

    // Category Breakdown
    const categoryCounts = complaints.reduce((acc, c) => {
        acc[c.category] = (acc[c.category] || 0) + 1;
        return acc;
    }, {});
    
    // Sort categories by highest count
    const topCategories = Object.entries(categoryCounts)
        .map(([name, count]) => ({ name, count, percentage: totalComplaints ? (count / totalComplaints) * 100 : 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Status Pipeline
    const statusCounts = complaints.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
    }, {});

    // Chart 1: Time-Series Trend Data
    const processTrendData = () => {
        const trend = {};
        const sorted = [...complaints].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        sorted.forEach(c => {
            if(!c.createdAt) return;
            const dateObj = new Date(c.createdAt);
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!trend[dateStr]) {
                trend[dateStr] = { date: dateStr, New: 0, Resolved: 0 };
            }
            trend[dateStr].New += 1;
            if (c.status === 'Resolved' || c.status === 'Closed') {
                trend[dateStr].Resolved += 1;
            }
        });
        return Object.values(trend);
    };
    const trendData = processTrendData();

    // Chart 2: Donut Data for Categories
    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b'];
    const pieData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    if (loading) {
        return (
            <div className="flex flex-col gap-6 w-full h-full p-4">
                <div className="flex justify-between items-end mb-4">
                    <div className="space-y-2">
                        <div className="w-48 h-8 bg-slate-200 rounded animate-pulse"></div>
                        <div className="w-64 h-4 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-96 bg-slate-200 rounded-3xl animate-pulse"></div>
                    <div className="h-96 bg-slate-200 rounded-3xl animate-pulse"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col h-full items-center justify-center min-h-[400px] text-center">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Failed to load analytics</h2>
                <p className="text-slate-500 mb-6">{error}</p>
                <button 
                    onClick={fetchData}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (complaints.length === 0) {
        return (
            <div className="flex flex-col h-full items-center justify-center min-h-[400px] text-center">
                <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                    <BarChart size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">No Data Available</h2>
                <p className="text-slate-500">You don't have any assigned complaints to analyze yet.</p>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8 pb-12 w-full overflow-x-hidden"
        >
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <BarChart className="text-emerald-600" size={32} />
                        Analytics & Reports
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">System-wide performance and incident metrics</p>
                </div>
            </div>

            {/* KPI Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div 
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <Activity size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">TOTAL</span>
                    </div>
                    <h3 className="text-4xl font-black text-slate-900">{totalComplaints}</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">Active Incidents</p>
                </motion.div>

                <motion.div 
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                            <CheckCircle size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">SUCCESS</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <h3 className="text-4xl font-black text-slate-900">{resolutionRate}%</h3>
                        <span className="text-sm font-bold text-green-500 mb-1 flex items-center"><TrendingUp size={14} className="mr-1"/></span>
                    </div>
                    <p className="text-sm font-medium text-slate-500 mt-1">Resolution Rate</p>
                </motion.div>

                <motion.div 
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                    className="bg-white p-6 rounded-[2rem] border border-red-50 shadow-sm relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                            <AlertTriangle size={24} />
                        </div>
                        <span className="text-xs font-bold text-red-400 bg-red-50 px-2 py-1 rounded-lg">URGENT</span>
                    </div>
                    <h3 className="text-4xl font-black text-slate-900 relative z-10">{criticalCount}</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1 relative z-10">Critical Priority</p>
                </motion.div>

                <motion.div 
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
                    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                            <Clock size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">QUEUE</span>
                    </div>
                    <h3 className="text-4xl font-black text-slate-900">{pendingCount}</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">Pending Verification</p>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                {/* Category Breakdown (Donut Chart) */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
                    className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-[400px]"
                >
                    <h2 className="text-xl font-black text-slate-900 mb-2">Issue Categories</h2>
                    {pieData.length > 0 ? (
                        <div className="flex-1 w-full h-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip 
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ fontWeight: 'bold' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400 font-medium">
                            No data available
                        </div>
                    )}
                </motion.div>

                {/* Status Pipeline */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
                    className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl flex flex-col relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <h2 className="text-xl font-black mb-8 relative z-10">Resolution Pipeline</h2>
                    <div className="flex-1 flex flex-col justify-center gap-6 relative z-10">
                        {['Submitted', 'Verified', 'In Progress', 'Resolved'].map((status, idx, arr) => {
                            const count = statusCounts[status] || 0;
                            const isLast = idx === arr.length - 1;
                            
                            return (
                                <div key={status} className="flex items-center gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                                            status === 'Resolved' ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]' :
                                            status === 'In Progress' ? 'bg-emerald-500 text-white' :
                                            'bg-slate-800 text-slate-400 border border-slate-700'
                                        }`}>
                                            {count}
                                        </div>
                                        {!isLast && <div className="w-0.5 h-6 bg-slate-800 my-1"></div>}
                                    </div>
                                    <div className={`flex-1 p-4 rounded-2xl border ${
                                        status === 'Resolved' ? 'border-green-500/30 bg-green-500/5' :
                                        status === 'In Progress' ? 'border-emerald-500/30 bg-emerald-500/5' :
                                        'border-slate-800 bg-slate-800/30'
                                    }`}>
                                        <h4 className={`font-bold ${status === 'Resolved' ? 'text-green-400' : status === 'In Progress' ? 'text-emerald-400' : 'text-slate-300'}`}>
                                            {status}
                                        </h4>
                                        <p className="text-xs font-medium text-slate-500 mt-1">
                                            {status === 'Submitted' && 'Awaiting verification by authority'}
                                            {status === 'Verified' && 'Validated, pending assignment'}
                                            {status === 'In Progress' && 'Actively being resolved'}
                                            {status === 'Resolved' && 'Successfully completed'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>

            {/* Time-Series Trend Chart */}
            <motion.div 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-[400px]"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-slate-900">Incident Trends Over Time</h2>
                </div>
                {trendData.length > 0 ? (
                    <div className="flex-1 w-full h-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} dx={-10} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ fontWeight: 'bold' }}
                                    labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '8px' }}
                                />
                                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }} />
                                <Area type="monotone" dataKey="New" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorNew)" activeDot={{r: 6, strokeWidth: 0, fill: '#ef4444'}} />
                                <Area type="monotone" dataKey="Resolved" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorResolved)" activeDot={{r: 6, strokeWidth: 0, fill: '#10b981'}} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400 font-medium">
                        Not enough data points to generate trend chart.
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default AuthorityAnalytics;
