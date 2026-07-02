import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Map, Clock, CheckCircle, Bell, Filter, User, Send, MessageSquare, ThumbsUp, Shield, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const Dashboard = () => {
    const [filter, setFilter] = useState('All');
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        today: 0,
        pending: 0,
        critical: 0,
        resolved: 0
    });
    
    // Reply State
    const [activeReplyId, setActiveReplyId] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [replying, setReplying] = useState(false);

    const handleReply = async (complaintId) => {
        if (!replyContent.trim()) return;
        setReplying(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/complaint/${complaintId}/reply`, {
                content: replyContent
            }, { withCredentials: true });
            
            toast.success("Reply posted successfully");
            setReplyContent('');
            setActiveReplyId(null);
            fetchComplaints(); // Refresh to see updates
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to post reply");
        } finally {
            setReplying(false);
        }
    };

    const fetchComplaints = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/complaint/all`, {
                withCredentials: true
            });
            const fetchedComplaints = data.data;
            setComplaints(fetchedComplaints);
            calculateStats(fetchedComplaints);
        } catch (error) {
            console.error("Failed to fetch complaints:", error);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
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

    const getTimeAgo = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    useEffect(() => {
        fetchComplaints();

        // Socket.io connection for real-time updates
        const socket = io(`${import.meta.env.VITE_API_URL}`);
        
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

    const MetricSkeleton = () => (
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-border/50 overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl skeleton-box"></div>
            </div>
            <div className="h-3 w-24 mb-3 skeleton-box skeleton-text"></div>
            <div className="h-10 w-16 skeleton-box skeleton-text"></div>
        </motion.div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
            className="flex flex-col h-full max-w-7xl mx-auto space-y-8 pb-12 w-full overflow-x-hidden"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/50 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-text tracking-tight mb-1">Civic Dashboard</h1>
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
                {loading ? (
                    <>
                        <MetricSkeleton />
                        <MetricSkeleton />
                        <MetricSkeleton />
                        <MetricSkeleton />
                    </>
                ) : (
                    <>
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
                    </>
                )}
            </motion.div>            {/* Main Content Area */}
            <div className="flex flex-col gap-8 flex-1">
                
                {/* Map Area Placeholder */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="w-full bg-white rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-border/50 flex flex-col overflow-hidden h-[500px]"
                >
                    <div className="p-6 border-b border-border/50 flex justify-between items-center bg-white z-10">
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
                        <MapContainer 
                            center={[28.6139, 77.2090]} // default center (New Delhi)
                            zoom={12} 
                            scrollWheelZoom={true} 
                            className="h-full w-full z-0"
                        >
                            <TileLayer 
                                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            />
                            {filteredComplaints.map(c => {
                                if (!c.location?.coordinates) return null;
                                const isCritical = c.priority === 'Critical';
                                const isResolved = c.status === 'Resolved' || c.status === 'Closed';
                                const color = isResolved ? '#22c55e' : isCritical ? '#ef4444' : '#f97316';
                                
                                return (
                                    <React.Fragment key={c._id}>
                                        {/* Heatmap Glow (large, transparent) */}
                                        <CircleMarker 
                                            center={[c.location.coordinates[1], c.location.coordinates[0]]}
                                            pathOptions={{ color: 'transparent', fillColor: color, fillOpacity: 0.15 }}
                                            radius={25}
                                        />
                                        {/* Core Point (small, solid) */}
                                        <CircleMarker 
                                            center={[c.location.coordinates[1], c.location.coordinates[0]]}
                                            pathOptions={{ color: 'white', weight: 1, fillColor: color, fillOpacity: 0.8 }}
                                            radius={6}
                                        >
                                            <Popup>
                                                <div className="font-bold text-sm text-slate-800">{c.category} Issue</div>
                                                <div className="text-xs text-slate-500 mb-2">{c.status} | {c.priority} Priority</div>
                                                <div className="text-[10px] text-slate-400">ID: {c._id.slice(-6).toUpperCase()}</div>
                                            </Popup>
                                        </CircleMarker>
                                    </React.Fragment>
                                );
                            })}
                        </MapContainer>
                    </div>
                </motion.div>

                {/* Complaint Feed (Cards) */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="w-full flex flex-col"
                >
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="font-black text-2xl text-slate-800 tracking-tight">Live Issue Feed</h2>
                            <p className="text-sm font-medium text-slate-500 mt-1">Real-time reports awaiting authority action</p>
                        </div>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/60">
                            {['All', 'Pending', 'Critical'].map(f => (
                                <button 
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${filter === f ? 'bg-white text-primary shadow-sm border border-slate-100' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6 w-full pt-2 pb-6">
                        {filteredComplaints.length === 0 && (
                            <div className="text-center text-slate-500 py-24 bg-white/60 backdrop-blur-xl rounded-[3rem] border border-slate-200/60 w-full col-span-full shadow-sm">
                                <div className="bg-primary/5 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle size={40} className="text-primary opacity-80" />
                                </div>
                                <p className="font-black text-2xl text-slate-800 mb-2">Inbox Zero</p>
                                <p className="text-sm font-medium">No active complaints found matching the filter.</p>
                            </div>
                        )}
                        {filteredComplaints.map((c, i) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={c._id} 
                                className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-5 shadow-sm border border-slate-200/60 group hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300 w-full flex flex-col"
                            >
                                {/* Image */}
                                <div className="w-full h-52 rounded-[2rem] overflow-hidden relative bg-slate-50 mb-5 shrink-0 border border-slate-100">
                                    {(c.imageUrls?.[0] || c.imageUrl) ? (
                                        <img 
                                            src={c.imageUrls?.[0] || c.imageUrl} 
                                            alt={c.description} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">No Image Provided</div>
                                    )}
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md border border-white text-slate-800 shadow-sm px-4 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-2 tracking-wide uppercase">
                                        <div className={`w-2 h-2 rounded-full animate-pulse ${
                                            c.status === 'Resolved' || c.status === 'Closed' ? 'bg-green-500' :
                                            c.status === 'In Progress' ? 'bg-blue-500' : 'bg-orange-500'
                                        }`}></div>
                                        {c.status}
                                    </div>
                                    <div className={`absolute top-4 right-4 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm border ${
                                        c.priority === 'Critical' ? 'bg-red-500 text-white border-red-400' :
                                        c.priority === 'High' ? 'bg-orange-500 text-white border-orange-400' :
                                        'bg-white text-slate-700 border-white'
                                    }`}>
                                        {c.priority}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 flex flex-col justify-between px-1">
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                                                {c.category}
                                            </span>
                                            <div className="flex items-center text-slate-400 text-xs font-bold">
                                                <Clock size={12} className="mr-1.5" />
                                                {getTimeAgo(c.createdAt)}
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-black text-slate-800 mb-2 leading-tight line-clamp-2">{c.description}</h3>
                                        <div className="flex items-center text-slate-500 text-xs mb-4 font-bold line-clamp-1">
                                            <MapPin size={14} className="mr-1.5 text-primary shrink-0" />
                                            <span className="truncate">{c.address?.ward ? `${c.address.ward}, ${c.address.district}` : 'Location Attached'}</span>
                                        </div>
                                        {c.assignedTo && (
                                            <div className="mb-2 bg-indigo-50/50 rounded-lg p-2 border border-indigo-100/50 flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black shrink-0">
                                                    {c.assignedTo.name.substring(0,2).toUpperCase()}
                                                </div>
                                                <div className="flex items-center text-xs">
                                                    <span className="text-slate-500 font-medium mr-1">Handling:</span>
                                                    <span className="font-bold text-indigo-700">{c.assignedTo.name}</span>
                                                    <span className="text-[9px] bg-indigo-100 text-indigo-600 px-1 py-0.5 rounded ml-1 font-bold">
                                                        {c.assignedTo.authorityLevel}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                            <button className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-bold text-xs bg-slate-50 hover:bg-primary/5 px-3 py-1.5 rounded-xl">
                                                <ThumbsUp size={16} />
                                                <span>{c.supportCount || 0}</span>
                                            </button>
                                            
                                            <button 
                                                onClick={() => setActiveReplyId(activeReplyId === c._id ? null : c._id)}
                                                className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors font-bold text-xs bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:border-primary hover:shadow-md"
                                            >
                                                <MessageSquare size={16} />
                                                <span>Add Update</span>
                                            </button>
                                        </div>
                                        
                                        <AnimatePresence>
                                            {activeReplyId === c._id && (
                                                <motion.div 
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="mt-3 pt-3 border-t border-border/30 overflow-hidden"
                                                >
                                                    <div className="flex flex-col gap-2">
                                                        <textarea 
                                                            value={replyContent}
                                                            onChange={(e) => setReplyContent(e.target.value)}
                                                            placeholder="Official update..."
                                                            className="w-full bg-surface border border-border/50 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 min-h-[60px] resize-none"
                                                        />
                                                        <button 
                                                            onClick={() => handleReply(c._id)}
                                                            disabled={replying || !replyContent.trim()}
                                                            className="bg-primary text-white px-3 py-2 rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors disabled:opacity-50 w-full flex items-center justify-center gap-2"
                                                        >
                                                            <Send size={12} />
                                                            {replying ? 'Posting...' : 'Post Update'}
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
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
