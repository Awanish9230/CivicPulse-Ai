import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Filter, AlertTriangle, FileText, CheckCircle, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const MyComplaints = () => {
    const [filter, setFilter] = useState('All');
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMyComplaints = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/v1/complaint/my-complaints', {
                withCredentials: true
            });
            setComplaints(data.data || []);
        } catch (error) {
            console.error('MyComplaints fetch error:', error.response?.data || error.message);
            toast.error("Failed to load your complaints.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyComplaints();
    }, []);

    const filteredComplaints = complaints.filter(c => {
        if (filter === 'All') return true;
        if (filter === 'Active') return c.status !== 'Resolved' && c.status !== 'Closed';
        if (filter === 'Resolved') return c.status === 'Resolved' || c.status === 'Closed';
        return true;
    });

    const isSlaBreached = (createdAt, status) => {
        if (status === 'Resolved' || status === 'Closed') return false;
        const diffInHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
        return diffInHours > 48; // SLA breach if not resolved in 48h
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="max-w-5xl mx-auto space-y-8 pb-20 relative"
        >
            {/* Ambient background blur */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border/50 pb-6">
                <div>
                    <h1 className="text-4xl font-black text-text tracking-tight mb-2">My Reports</h1>
                    <p className="text-text/60 font-medium">Track and manage the civic issues you have reported.</p>
                </div>
                
                {/* Custom Tabs */}
                <div className="flex bg-surface p-1.5 rounded-2xl shadow-sm border border-border/50">
                    {['All', 'Active', 'Resolved'].map(f => (
                        <button 
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all relative ${
                                filter === f 
                                    ? 'bg-white text-primary shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-border/50' 
                                    : 'text-text/50 hover:text-text hover:bg-white/50'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-6">
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 text-primary">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                        <p className="font-bold">Syncing records...</p>
                    </div>
                )}
                
                {/* Beautiful Empty State */}
                {!loading && filteredComplaints.length === 0 && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/60 backdrop-blur-xl border border-white/50 shadow-lg rounded-[3rem] p-16 text-center max-w-2xl mx-auto mt-10"
                    >
                        <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 transform rotate-12 transition-transform hover:rotate-0">
                            <FileText size={40} className="text-primary" />
                        </div>
                        <h2 className="text-2xl font-black text-text mb-3">No Reports Yet</h2>
                        <p className="text-text/60 mb-8 max-w-md mx-auto leading-relaxed">
                            You haven't submitted any civic issues in this category yet. Be the change in your community by reporting local problems.
                        </p>
                        <Link to="/?report=true" className="inline-block bg-primary hover:bg-primary/90 text-white font-bold py-3.5 px-8 rounded-2xl transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5">
                            Report an Issue Now
                        </Link>
                    </motion.div>
                )}

                <AnimatePresence>
                    {!loading && filteredComplaints.map((c, i) => {
                        const slaRisk = isSlaBreached(c.createdAt, c.status);
                        const isResolved = c.status === 'Resolved' || c.status === 'Closed';
                        
                        return (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 24 }}
                                key={c._id}
                                className={`group bg-white rounded-[2rem] p-8 transition-all duration-300 relative overflow-hidden ${
                                    slaRisk 
                                        ? 'border-red-500/30 shadow-[0_8px_30px_rgba(239,68,68,0.08)]' 
                                        : 'border-border/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-primary/20'
                                }`}
                            >
                                {/* Decorative Accent */}
                                <div className={`absolute top-0 left-0 w-2 h-full ${
                                    isResolved ? 'bg-green-500' : slaRisk ? 'bg-red-500' : 'bg-primary'
                                }`}></div>

                                <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-3 mb-3">
                                            <span className="text-[10px] font-black tracking-widest text-text/40 bg-surface px-3 py-1.5 rounded-lg border border-border/50">
                                                ID: {c._id.slice(-6).toUpperCase()}
                                            </span>
                                            <span className={`text-[10px] font-black tracking-widest px-3 py-1.5 rounded-lg uppercase ${
                                                isResolved ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'
                                            }`}>
                                                {c.status}
                                            </span>
                                            {slaRisk && (
                                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 bg-red-500/10 px-3 py-1.5 rounded-lg animate-pulse border border-red-500/20">
                                                    <AlertTriangle size={12} /> SLA BREACHED
                                                </span>
                                            )}
                                        </div>
                                        
                                        <h3 className="text-2xl font-black text-text mb-2 line-clamp-1 group-hover:text-primary transition-colors">{c.category} Issue</h3>
                                        <p className="text-text/60 leading-relaxed mb-4 line-clamp-2 max-w-2xl">{c.description}</p>
                                        
                                        <div className="flex items-center gap-4 text-xs font-medium text-text/40">
                                            <div className="flex items-center gap-1.5"><Clock size={14} /> Reported on {new Date(c.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    
                                    {/* Tracking Timeline Component */}
                                    <div className="w-full lg:w-1/3 shrink-0 bg-surface/50 p-6 rounded-3xl border border-border/50">
                                        <h4 className="text-[10px] font-black text-text/40 tracking-widest uppercase mb-4 text-center">Resolution Tracker</h4>
                                        <div className="flex items-center justify-between relative">
                                            {/* Background Track */}
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-white rounded-full"></div>
                                            
                                            {/* Active Progress */}
                                            <div 
                                                className={`absolute left-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full transition-all duration-1000 ease-out ${
                                                    isResolved ? 'bg-green-500' : slaRisk ? 'bg-red-500' : 'bg-primary'
                                                }`} 
                                                style={{ width: isResolved ? '100%' : c.status === 'In Progress' ? '50%' : '5%' }}
                                            ></div>
                                            
                                            {/* Nodes */}
                                            {['Submitted', 'In Progress', 'Resolved'].map((step, idx) => {
                                                const isInProgress = c.status === 'In Progress';
                                                let isActive = false;
                                                if (idx === 0) isActive = true;
                                                if (idx === 1 && (isInProgress || isResolved)) isActive = true;
                                                if (idx === 2 && isResolved) isActive = true;

                                                return (
                                                    <div key={step} className="flex flex-col items-center relative z-10 group">
                                                        <div className={`w-6 h-6 rounded-full border-4 mb-2 flex items-center justify-center transition-all duration-300 ${
                                                            isActive 
                                                                ? (isResolved ? 'bg-green-500 border-green-200' : slaRisk ? 'bg-red-500 border-red-200' : 'bg-primary border-blue-200 shadow-[0_0_10px_rgba(37,99,235,0.5)]') 
                                                                : 'bg-surface border-white'
                                                        }`}>
                                                            {isActive && idx === 2 && <CheckCircle size={10} className="text-white" />}
                                                        </div>
                                                        <span className={`text-[10px] font-bold absolute -bottom-5 whitespace-nowrap transition-colors ${
                                                            isActive ? 'text-text' : 'text-text/40'
                                                        }`}>{step}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default MyComplaints;
