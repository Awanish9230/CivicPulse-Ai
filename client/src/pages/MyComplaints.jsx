import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Filter, AlertTriangle, FileText, CheckCircle, Clock, Map, ShieldAlert, Edit2, Trash2, X, Camera } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import CameraCapture from '../components/complaints/CameraCapture';
import ReportModal from '../components/complaints/ReportModal';

const MyComplaints = () => {
    const [filter, setFilter] = useState('All');
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedMapId, setExpandedMapId] = useState(null);
    const [editingComplaint, setEditingComplaint] = useState(null); // Holds the complaint being edited
    const [isHoveringCamera, setIsHoveringCamera] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [captureData, setCaptureData] = useState(null); // Holds { photos, gps }

    const fetchMyComplaints = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/complaint/my-complaints`, {
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

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this complaint? This cannot be undone.")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/complaint/${id}`, {
                withCredentials: true
            });
            toast.success("Complaint deleted successfully");
            fetchMyComplaints();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete complaint");
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.patch(`${import.meta.env.VITE_API_URL}/api/v1/complaint/${editingComplaint._id}`, 
                {
                    category: editingComplaint.category,
                    description: editingComplaint.description
                }, 
                { withCredentials: true }
            );
            toast.success("Complaint updated successfully");
            setEditingComplaint(null);
            fetchMyComplaints();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update complaint");
        }
    };

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

    const handlePhotoCaptured = (data) => {
        setCaptureData(data);
        setIsCameraOpen(false); // Close camera, open modal
    };

    const handleReportSuccess = () => {
        setCaptureData(null);
        fetchMyComplaints(); // Refresh the list
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
                
                <motion.button 
                    onClick={() => setIsCameraOpen(true)}
                    onHoverStart={() => setIsHoveringCamera(true)}
                    onHoverEnd={() => setIsHoveringCamera(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative bg-gradient-to-r from-primary to-blue-600 p-1 rounded-2xl shadow-lg shadow-primary/30 w-full md:w-auto"
                >
                    <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-xl flex items-center justify-center gap-3">
                        <Camera className="text-white" size={20} />
                        <span className="text-white font-bold text-base">Raise Complaint</span>
                    </div>
                    {/* Animated Glow on Hover */}
                    {isHoveringCamera && (
                        <motion.div 
                            layoutId="glow"
                            className="absolute -inset-2 bg-gradient-to-r from-primary to-blue-600 rounded-3xl blur-xl opacity-40 -z-10"
                        />
                    )}
                </motion.button>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
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
                                className={`group bg-white rounded-3xl p-6 transition-all duration-300 relative overflow-hidden ${
                                    slaRisk 
                                        ? 'border-red-500/30 shadow-[0_8px_30px_rgba(239,68,68,0.08)]' 
                                        : 'border-border/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-primary/20'
                                }`}
                            >
                                {/* Decorative Accent */}
                                <div className={`absolute top-0 left-0 w-2 h-full ${
                                    isResolved ? 'bg-green-500' : slaRisk ? 'bg-red-500' : 'bg-primary'
                                }`}></div>

                                <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
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
                                            {c.expectedCompletionDate && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
                                                    <Clock size={12} /> Est: {new Date(c.expectedCompletionDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <h3 className="text-2xl font-black text-text mb-4 line-clamp-1 group-hover:text-primary transition-colors">{c.category} Issue</h3>
                                        
                                        {(c.imageUrls?.[0] || c.imageUrl) && (
                                            <div className="mb-4 rounded-xl overflow-hidden border border-border/50 max-w-sm h-40 bg-surface shadow-sm">
                                                <img src={c.imageUrls?.[0] || c.imageUrl} alt="Issue" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                                            </div>
                                        )}

                                        <p className="text-text/70 text-sm leading-relaxed mb-4 max-w-2xl">{c.description}</p>
                                        
                                        <div className="flex items-center gap-4 text-xs font-medium text-text/40 mb-4">
                                            <div className="flex items-center gap-1.5"><Clock size={14} /> Reported on {new Date(c.createdAt).toLocaleDateString()}</div>
                                        </div>
                                        
                                        {/* Actions for Active complaints */}
                                        {(c.status !== 'Resolved' && c.status !== 'Closed') && (
                                            <div className="flex items-center gap-3 mb-4">
                                                <button 
                                                    onClick={() => setEditingComplaint({ ...c })}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                                                >
                                                    <Edit2 size={14} /> Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(c._id)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                                                >
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </div>
                                        )}
                                        
                                        <div className="mt-2 border-t border-border/30 pt-4">
                                            <button 
                                                onClick={() => setExpandedMapId(expandedMapId === c._id ? null : c._id)}
                                                className="flex items-center gap-2 text-sm font-bold text-primary hover:text-blue-700 transition-colors bg-blue-50 px-4 py-2 rounded-xl"
                                            >
                                                <Map size={16} />
                                                {expandedMapId === c._id ? 'Hide Location Map' : 'View Location Map'}
                                            </button>
                                            
                                            <AnimatePresence>
                                                {expandedMapId === c._id && c.location?.coordinates && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="mt-4 rounded-xl overflow-hidden border border-border/50 bg-slate-100"
                                                    >
                                                        <div className="h-64 w-full">
                                                            <MapContainer 
                                                                center={[c.location.coordinates[1], c.location.coordinates[0]]} 
                                                                zoom={16} 
                                                                scrollWheelZoom={false} 
                                                                className="h-full w-full z-0"
                                                            >
                                                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                                <Marker position={[c.location.coordinates[1], c.location.coordinates[0]]} />
                                                            </MapContainer>
                                                        </div>
                                                        {c.address && (
                                                            <div className="p-3 bg-white text-xs font-bold text-slate-600 border-t border-border/50">
                                                                📍 {c.address.line1}, {c.address.line2 ? `${c.address.line2}, ` : ''}{c.address.district}
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Official Replies Section */}
                                        {c.officialReplies && c.officialReplies.length > 0 && (
                                            <div className="mt-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl p-5">
                                                <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-600 mb-4">
                                                    <ShieldAlert size={16} /> Official Responses
                                                </h4>
                                                <div className="space-y-4">
                                                    {c.officialReplies.map((reply, idx) => (
                                                        <div key={idx} className="bg-white/60 rounded-xl p-4 shadow-sm border border-blue-500/10">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="font-bold text-sm text-text">{reply.authorityName}</span>
                                                                <span className="text-[10px] text-text/40">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="text-sm text-text/80 leading-relaxed">{reply.content}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Tracking Timeline Component */}
                                    <div className="w-full lg:w-48 shrink-0 bg-surface/50 p-5 rounded-2xl border border-border/50">
                                        <h4 className="text-[10px] font-black text-text/40 tracking-widest uppercase mb-5 text-center">Status Tracker</h4>
                                        <div className="flex flex-col relative space-y-6">
                                            {/* Background Track */}
                                            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-white rounded-full"></div>
                                            
                                            {/* Active Progress */}
                                            {(() => {
                                                const steps = ['Submitted', 'Verified', 'Assigned', 'In Progress', 'Resolved'];
                                                const currentIdx = steps.indexOf(c.status) !== -1 ? steps.indexOf(c.status) : (c.status === 'Closed' ? 4 : 0);
                                                const isRejected = c.status === 'Rejected';
                                                
                                                return (
                                                    <>
                                                        <div 
                                                            className={`absolute left-[11px] top-2 w-0.5 rounded-full transition-all duration-1000 ease-out ${
                                                                isResolved ? 'bg-green-500' : isRejected ? 'bg-red-500' : slaRisk ? 'bg-red-500' : 'bg-primary'
                                                            }`} 
                                                            style={{ height: isRejected ? '100%' : `${(currentIdx / 4) * 100}%` }}
                                                        ></div>
                                                        
                                                        {steps.map((step, idx) => {
                                                            let isActive = idx <= currentIdx;
                                                            if (isRejected) isActive = true;
                                                            let displayStep = step;
                                                            if (isRejected && idx === 4) displayStep = 'Rejected';
                                                            if (c.status === 'Closed' && idx === 4) displayStep = 'Closed';

                                                            return (
                                                                <div key={step} className="flex items-center relative z-10 group pl-0">
                                                                    <div className={`w-6 h-6 rounded-full border-4 shrink-0 flex items-center justify-center transition-all duration-300 ${
                                                                        isActive 
                                                                            ? (isResolved ? 'bg-green-500 border-green-200' : isRejected ? 'bg-red-500 border-red-200' : slaRisk ? 'bg-red-500 border-red-200' : 'bg-primary border-blue-200 shadow-[0_0_10px_rgba(37,99,235,0.5)]') 
                                                                            : 'bg-surface border-white'
                                                                    }`}>
                                                                        {isActive && idx === 4 && <CheckCircle size={10} className="text-white" />}
                                                                    </div>
                                                                    <span className={`text-[11px] font-bold ml-3 transition-colors ${
                                                                        isActive ? 'text-text' : 'text-text/40'
                                                                    }`}>{displayStep}</span>
                                                                </div>
                                                            )
                                                        })}
                                                    </>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingComplaint && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
                        >
                            <button 
                                onClick={() => setEditingComplaint(null)}
                                className="absolute top-4 right-4 text-text/40 hover:text-red-500 transition-colors"
                            >
                                <X size={24} />
                            </button>
                            <h2 className="text-2xl font-black text-text mb-6">Edit Complaint</h2>
                            
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-text/70 mb-1">Category</label>
                                    <select 
                                        value={editingComplaint.category}
                                        onChange={(e) => setEditingComplaint({...editingComplaint, category: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-border/50 bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
                                        required
                                    >
                                        <option value="Pothole">Pothole</option>
                                        <option value="Garbage">Garbage / Waste</option>
                                        <option value="Water Leak">Water Leak</option>
                                        <option value="Streetlight">Streetlight</option>
                                        <option value="Noise">Noise</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-text/70 mb-1">Description</label>
                                    <textarea 
                                        value={editingComplaint.description}
                                        onChange={(e) => setEditingComplaint({...editingComplaint, description: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-border/50 bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium h-32 resize-none"
                                        required
                                    ></textarea>
                                </div>
                                
                                <div className="flex gap-3 pt-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setEditingComplaint(null)}
                                        className="flex-1 px-4 py-3 bg-surface hover:bg-slate-200 text-text rounded-xl font-bold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 px-4 py-3 bg-primary hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Camera Overlay Modal */}
            <AnimatePresence>
                {isCameraOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed inset-0 z-[100]"
                    >
                        <CameraCapture 
                            onClose={() => setIsCameraOpen(false)}
                            onCapture={handlePhotoCaptured}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Report Submission Modal */}
            <AnimatePresence>
                {captureData && (
                    <ReportModal 
                        captureData={captureData}
                        onClose={() => setCaptureData(null)}
                        onSuccess={handleReportSuccess}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default MyComplaints;
