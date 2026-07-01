import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { BarChart, TrendingUp, AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

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
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/authority/tasks`, {
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

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
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
                {/* Category Breakdown (Bar Chart) */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
                    className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col"
                >
                    <h2 className="text-xl font-black text-slate-900 mb-6">Top Issue Categories</h2>
                    {topCategories.length > 0 ? (
                        <div className="space-y-6 flex-1 flex flex-col justify-center">
                            {topCategories.map((cat, idx) => (
                                <div key={cat.name}>
                                    <div className="flex justify-between text-sm font-bold mb-2">
                                        <span className="text-slate-700">{cat.name}</span>
                                        <span className="text-slate-400">{cat.count} ({Math.round(cat.percentage)}%)</span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${cat.percentage}%` }}
                                            transition={{ duration: 1, delay: 0.5 + (idx * 0.1) }}
                                            className="h-full bg-emerald-500 rounded-full"
                                        ></motion.div>
                                    </div>
                                </div>
                            ))}
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
        </motion.div>
    );
};

export default AuthorityAnalytics;
