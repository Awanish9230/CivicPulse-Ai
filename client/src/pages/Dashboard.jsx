import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { AlertTriangle, Map, Clock, CheckCircle, Bell, Filter, User } from 'lucide-react';

const Dashboard = () => {
    const [filter, setFilter] = useState('All');
    const [complaints, setComplaints] = useState([]);
    const [stats, setStats] = useState({
        today: 0,
        pending: 0,
        critical: 0,
        resolved: 0
    });

    const fetchComplaints = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/v1/complaint/all', {
                withCredentials: true
            });
            const fetchedComplaints = data.data;
            setComplaints(fetchedComplaints);
            calculateStats(fetchedComplaints);
        } catch (error) {
            console.error("Failed to fetch complaints:", error);
            toast.error("Failed to load dashboard data");
        }
    };

    const calculateStats = (data) => {
        const today = new Date().toDateString();
        let tCount = 0, pCount = 0, cCount = 0, rCount = 0;

        data.forEach(c => {
            if (new Date(c.createdAt).toDateString() === today) tCount++;
            if (c.status === 'Submitted' || c.status === 'In Progress') pCount++;
            if (c.priority === 'Critical') cCount++;
            if (c.status === 'Resolved' || c.status === 'Closed') rCount++;
        });

        setStats({ today: tCount, pending: pCount, critical: cCount, resolved: rCount });
    };

    useEffect(() => {
        fetchComplaints();

        // Socket.io connection for real-time updates
        const socket = io('http://localhost:5000');
        
        socket.on('new_complaint', (newComplaint) => {
            toast.success('New emergency complaint received!', { icon: '🚨' });
            setComplaints(prev => {
                const updated = [newComplaint, ...prev];
                calculateStats(updated);
                return updated;
            });
        });

        return () => socket.disconnect();
    }, []);

    const filteredComplaints = complaints.filter(c => {
        if (filter === 'All') return true;
        if (filter === 'Pending') return c.status === 'Submitted' || c.status === 'In Progress';
        if (filter === 'Critical') return c.priority === 'Critical';
        return true;
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
            className="flex flex-col h-full max-w-7xl mx-auto space-y-8 pb-12"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/50 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-text tracking-tight mb-1">Authority Command Center</h1>
                    <p className="text-text/50 font-medium">Real-time overview of civic issues and SLA metrics.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-2.5 rounded-xl bg-white border border-border/50 text-text/60 hover:text-primary hover:border-primary/30 transition-all shadow-sm">
                        <Bell size={20} />
                    </button>
                    <div className="flex items-center gap-3 bg-white border border-border/50 px-4 py-2 rounded-xl shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User size={16} className="text-primary" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-text leading-tight">AUTH-8291</div>
                            <div className="text-[10px] text-text/50 font-bold uppercase tracking-wider">City Admin</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats - Bento Box */}
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <motion.div variants={itemVariants} className="bg-white p-6 rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-border/50 group hover:border-primary/30 transition-colors relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] pointer-events-none transition-all group-hover:scale-110"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                            <Map size={24} />
                        </div>
                    </div>
                    <h3 className="text-text/60 font-bold text-sm mb-1 relative z-10">Today's Reports</h3>
                    <p className="text-4xl font-black text-text relative z-10">{stats.today}</p>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white p-6 rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-border/50 group hover:border-orange-500/30 transition-colors relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-[100px] pointer-events-none transition-all group-hover:scale-110"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500">
                            <Clock size={24} />
                        </div>
                    </div>
                    <h3 className="text-text/60 font-bold text-sm mb-1 relative z-10">Pending Resolution</h3>
                    <p className="text-4xl font-black text-text relative z-10">{stats.pending}</p>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white p-6 rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-border/50 group hover:border-red-500/30 transition-colors relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-bl-[100px] pointer-events-none transition-all group-hover:scale-110"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-3 rounded-2xl bg-red-500/10 text-red-500">
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                    <h3 className="text-text/60 font-bold text-sm mb-1 relative z-10">Critical SLA Breaches</h3>
                    <p className="text-4xl font-black text-text relative z-10">{stats.critical}</p>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white p-6 rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-border/50 group hover:border-green-500/30 transition-colors relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-bl-[100px] pointer-events-none transition-all group-hover:scale-110"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-3 rounded-2xl bg-green-500/10 text-green-500">
                            <CheckCircle size={24} />
                        </div>
                    </div>
                    <h3 className="text-text/60 font-bold text-sm mb-1 relative z-10">Successfully Resolved</h3>
                    <p className="text-4xl font-black text-text relative z-10">{stats.resolved}</p>
                </motion.div>

            </motion.div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1">
                
                {/* Map Area Placeholder */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="xl:col-span-2 bg-white rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-border/50 flex flex-col overflow-hidden min-h-[500px]"
                >
                    <div className="p-6 border-b border-border/50 flex justify-between items-center">
                        <div>
                            <h2 className="font-black text-xl text-text">Live Operations Map</h2>
                            <p className="text-xs font-medium text-text/50">Tracking active incidents across the city</p>
                        </div>
                        <select className="bg-surface border border-border/50 rounded-xl px-4 py-2.5 text-sm font-bold text-text outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                            <option>All Wards</option>
                            <option>Ward 1 (Downtown)</option>
                            <option>Ward 2 (Northside)</option>
                        </select>
                    </div>
                    <div className="flex-1 bg-surface relative overflow-hidden group">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <Map size={48} className="mx-auto text-border mb-4 opacity-50" />
                                <p className="text-text/40 font-bold tracking-widest uppercase text-sm">Interactive Map Engine Loading...</p>
                            </div>
                        </div>
                        
                        {/* Animated Fake Map Grid */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
                        
                        {/* Fake Map Markers with Radar Effect */}
                        <div className="absolute top-1/4 left-1/4">
                            <span className="relative flex h-4 w-4">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 shadow-lg border-2 border-white"></span>
                            </span>
                        </div>
                        <div className="absolute top-1/2 right-1/3">
                            <span className="relative flex h-4 w-4">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" style={{ animationDelay: '0.5s' }}></span>
                              <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 shadow-lg border-2 border-white"></span>
                            </span>
                        </div>
                        <div className="absolute bottom-1/3 left-1/2">
                            <span className="relative flex h-4 w-4">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" style={{ animationDelay: '1s' }}></span>
                              <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 shadow-lg border-2 border-white"></span>
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Complaint Feed */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-border/50 flex flex-col max-h-[600px] xl:max-h-full"
                >
                    <div className="p-6 border-b border-border/50">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-black text-xl text-text">Incident Feed</h2>
                            <Filter size={18} className="text-text/40" />
                        </div>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                            {['All', 'Pending', 'Critical'].map(f => (
                                <button 
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filter === f ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-surface border border-border/50 text-text/60 hover:bg-surface/80 hover:text-text'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {filteredComplaints.length === 0 && (
                            <div className="text-center text-text/40 mt-10">
                                <div className="bg-surface w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle size={24} className="opacity-50" />
                                </div>
                                <p className="font-bold text-sm">Inbox Zero</p>
                                <p className="text-xs">No active complaints found.</p>
                            </div>
                        )}
                        {filteredComplaints.map((c, i) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={c._id} 
                                className="p-4 rounded-2xl bg-surface/50 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-sm text-text bg-white px-2.5 py-1 rounded-lg border border-border/50 shadow-sm">{c.category}</span>
                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                                        c.priority === 'Critical' ? 'bg-red-500/10 text-red-600' :
                                        c.priority === 'High' ? 'bg-orange-500/10 text-orange-600' :
                                        'bg-primary/10 text-primary'
                                    }`}>
                                        {c.priority}
                                    </span>
                                </div>
                                <h4 className="font-bold text-text text-sm mb-1 leading-snug line-clamp-2">{c.description}</h4>
                                <div className="text-[11px] text-text/50 font-medium mb-3">{c.address?.ward || 'Unknown location'} • {new Date(c.createdAt).toLocaleDateString()}</div>
                                <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                                    <span className="relative flex h-2.5 w-2.5">
                                        {(c.status === 'Submitted' || c.status === 'In Progress') && (
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                        )}
                                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                                            c.status === 'Resolved' || c.status === 'Closed' ? 'bg-green-500' :
                                            c.status === 'In Progress' ? 'bg-blue-500' : 'bg-orange-500'
                                        }`}></span>
                                    </span>
                                    <span className="text-xs font-bold text-text/70">{c.status}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

            </div>
        </motion.div>
    );
};

export default Dashboard;
