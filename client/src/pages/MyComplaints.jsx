import { motion } from 'framer-motion';
import { Search, Filter, AlertTriangle } from 'lucide-react';
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
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h1 className="text-3xl font-black text-text tracking-tight">My Reports</h1>
                <div className="flex gap-2">
                    {['All', 'Active', 'Resolved'].map(f => (
                        <button 
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${filter === f ? 'bg-text text-white shadow-lg' : 'bg-white text-text/60 border border-border/50 hover:bg-surface'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-4">
                {loading && <div className="text-center py-10">Loading your complaints...</div>}
                {!loading && filteredComplaints.length === 0 && (
                    <div className="text-center py-10 text-text/50">You haven't reported any complaints yet.</div>
                )}
                {!loading && filteredComplaints.map((c, i) => {
                    const slaRisk = isSlaBreached(c.createdAt, c.status);
                    return (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={c._id}
                            className={`bg-white rounded-[2rem] p-6 border transition-all ${slaRisk ? 'border-danger/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'border-border/50 shadow-sm'}`}
                        >
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-[10px] font-black tracking-widest text-text/40">ID: {c._id.slice(-6).toUpperCase()}</span>
                                        {slaRisk && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-danger bg-danger/10 px-2 py-0.5 rounded-full">
                                                <AlertTriangle size={12} /> SLA breached
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-text">{c.category} Issue</h3>
                                    <p className="text-sm text-text/50 mt-1">{c.description}</p>
                                    <p className="text-xs text-text/40 mt-2">Reported on {new Date(c.createdAt).toLocaleDateString()}</p>
                                </div>
                                
                                {/* Tracking Timeline Bar */}
                                <div className="w-full md:w-1/2 flex items-center justify-between relative mt-4 md:mt-0">
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-surface rounded-full -z-10"></div>
                                    {/* Active Line */}
                                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full -z-10 transition-all ${slaRisk ? 'bg-danger' : 'bg-primary'}`} style={{ width: c.status === 'Resolved' || c.status === 'Closed' ? '100%' : c.status === 'In Progress' ? '50%' : '10%' }}></div>
                                    
                                    {['Submitted', 'Assigned', 'Resolved'].map((step, idx) => {
                                        const isResolved = c.status === 'Resolved' || c.status === 'Closed';
                                        const isInProgress = c.status === 'In Progress';
                                        let isActive = false;
                                        if (idx === 0) isActive = true;
                                        if (idx === 1 && (isInProgress || isResolved)) isActive = true;
                                        if (idx === 2 && isResolved) isActive = true;

                                        return (
                                            <div key={step} className="flex flex-col items-center">
                                                <div className={`w-4 h-4 rounded-full border-4 mb-2 transition-colors ${isActive ? (slaRisk ? 'bg-danger border-danger/30' : 'bg-primary border-primary/30') : 'bg-surface border-white'}`}></div>
                                                <span className={`text-[10px] font-bold ${isActive ? 'text-text' : 'text-text/40'}`}>{step}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    );
};

export default MyComplaints;
