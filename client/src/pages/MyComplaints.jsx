import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Filter, AlertTriangle, FileText, CheckCircle, Clock, Map, ShieldAlert, Edit2, Trash2, X, Camera, ChevronDown, ChevronUp, MapPin, ThumbsUp, MessageCircle, MoreVertical } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import CameraCapture from '../components/complaints/CameraCapture';
import ReportModal from '../components/complaints/ReportModal';

const MyComplaints = () => {
    const [filter, setFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedMapComplaint, setExpandedMapComplaint] = useState(null);
    const [editingComplaint, setEditingComplaint] = useState(null);
    const [isHoveringCamera, setIsHoveringCamera] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [captureData, setCaptureData] = useState(null);
    const [expandedReplies, setExpandedReplies] = useState({});

    const toggleReplies = (id) => {
        setExpandedReplies(prev => ({ ...prev, [id]: !prev[id] }));
    };

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
        const matchesFilter = filter === 'All' 
            ? true 
            : filter === 'Active' ? c.status !== 'Resolved' && c.status !== 'Closed'
            : c.status === filter;
        const matchesSearch = c.description?.toLowerCase().includes(searchQuery.toLowerCase()) || c.category?.toLowerCase().includes(searchQuery.toLowerCase()) || c._id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const isSlaBreached = (createdAt, status) => {
        if (status === 'Resolved' || status === 'Closed') return false;
        const diffInHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
        return diffInHours > 48;
    };

    const handlePhotoCaptured = (data) => {
        setCaptureData(data);
        setIsCameraOpen(false);
    };

    const handleReportSuccess = () => {
        setCaptureData(null);
        fetchMyComplaints();
    };

    const renderStatusDots = (status, isRejected, slaRisk) => {
        const steps = ['Submitted', 'Verified', 'In Progress', 'Resolved'];
        const currentIdx = isRejected ? 4 : steps.indexOf(status) !== -1 ? steps.indexOf(status) : (status === 'Closed' ? 3 : 0);
        
        return (
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar py-1">
                {steps.map((step, idx) => {
                    const isActive = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;
                    const isFailed = isRejected || slaRisk;
                    
                    let bg = 'bg-slate-200';
                    if (isActive) {
                        if (isFailed && isCurrent) bg = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]';
                        else if (idx === 3) bg = 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]';
                        else bg = 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]';
                    }

                    return (
                        <div key={step} className="flex items-center gap-1.5 shrink-0 group relative">
                            <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${bg} ${isCurrent ? 'scale-125' : ''}`}></div>
                            <span className={`text-[10px] font-bold ${isActive ? 'text-slate-700' : 'text-slate-400'}`}>
                                {isRejected && isCurrent ? 'Rejected' : step}
                            </span>
                            {idx < steps.length - 1 && <div className={`w-4 h-[2px] rounded-full mx-1 ${idx < currentIdx ? (isFailed ? 'bg-red-200' : 'bg-blue-200') : 'bg-slate-100'}`}></div>}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="max-w-[1600px] mx-auto pb-20 px-4 md:px-6">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-[#F8FAFC]/90 backdrop-blur-xl pt-6 pb-4 border-b border-slate-200/50 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">My Reports</h1>
                        <p className="text-sm text-slate-500 font-medium mt-0.5">Track your complaints</p>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                        <button 
                            onClick={() => setIsCameraOpen(true)}
                            className="shrink-0 bg-primary hover:bg-blue-700 text-white font-bold h-10 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shadow-primary/20"
                        >
                            <Camera size={16} />
                            <span className="hidden sm:inline text-sm">Raise Complaint</span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-1 mt-5 overflow-x-auto no-scrollbar bg-slate-100/50 p-1 rounded-xl w-max border border-slate-200/50">
                    {['All', 'Active', 'Verified', 'In Progress', 'Resolved'].map(f => (
                        <button 
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                filter === f 
                                    ? 'bg-white text-primary shadow-sm border border-slate-200/60' 
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-[1rem] p-4 border border-slate-100 shadow-sm animate-pulse h-80 flex flex-col gap-3">
                            <div className="flex justify-between"><div className="w-16 h-6 bg-slate-200 rounded"></div><div className="w-20 h-6 bg-slate-200 rounded"></div></div>
                            <div className="w-full h-32 bg-slate-200 rounded-xl mt-2"></div>
                            <div className="w-3/4 h-4 bg-slate-200 rounded mt-2"></div>
                            <div className="w-1/2 h-4 bg-slate-200 rounded"></div>
                            <div className="mt-auto flex justify-between"><div className="w-24 h-8 bg-slate-200 rounded-lg"></div><div className="w-16 h-8 bg-slate-200 rounded-lg"></div></div>
                        </div>
                    ))
                ) : filteredComplaints.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FileText size={24} className="text-slate-400" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 mb-2">No Reports Found</h2>
                        <p className="text-slate-500 text-sm mb-6">You don't have any complaints matching your criteria.</p>
                        <button onClick={() => setIsCameraOpen(true)} className="text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 px-6 py-2.5 rounded-xl transition-colors">Raise First Complaint</button>
                    </div>
                ) : (
                    <AnimatePresence>
                        {filteredComplaints.map((c) => {
                            const slaRisk = isSlaBreached(c.createdAt, c.status);
                            const isResolved = c.status === 'Resolved' || c.status === 'Closed';
                            const isRejected = c.status === 'Rejected';
                            
                            return (
                                <motion.div 
                                    layout
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ duration: 0.2 }}
                                    key={c._id}
                                    className="bg-white rounded-[1rem] p-4 border border-slate-200/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all flex flex-col group relative"
                                >
                                    {slaRisk && <div className="absolute top-0 left-0 w-full h-1 bg-red-500 rounded-t-[1rem]"></div>}
                                    
                                    {/* Header Inline */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">#{c._id.slice(-6).toUpperCase()}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ml-auto ${
                                            isResolved ? 'bg-green-50 text-green-700 border border-green-200' : isRejected ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                                        }`}>
                                            {c.status}
                                        </span>
                                        {slaRisk && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
                                    </div>
                                    
                                    {/* Image */}
                                    {(c.imageUrls?.[0] || c.imageUrl) && (
                                        <div className="mb-3 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shrink-0 h-36 relative">
                                            <img src={c.imageUrls?.[0] || c.imageUrl} alt="Issue" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] text-white font-bold flex items-center gap-1">
                                                <MapPin size={10} /> {c.category}
                                            </div>
                                        </div>
                                    )}

                                    {/* Description */}
                                    <div className="mb-3 flex-1 min-h-[40px]">
                                        <p className="text-slate-700 text-sm leading-relaxed line-clamp-2" title={c.description}>
                                            {c.description}
                                        </p>
                                    </div>
                                    
                                    {/* Metadata */}
                                    <div className="flex items-center gap-4 mb-4 text-[11px] font-bold text-slate-500">
                                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(c.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}</span>
                                        <span className="flex items-center gap-1"><ThumbsUp size={12} /> {c.supportCount || c.upvotes || 0}</span>
                                        {c.expectedCompletionDate && <span className="flex items-center gap-1 text-blue-600"><CheckCircle size={12} /> ETA: {new Date(c.expectedCompletionDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>}
                                    </div>

                                    {/* Assigned Official */}
                                    {c.assignedTo && (
                                        <div className="mb-4 bg-indigo-50 rounded-xl p-3 border border-indigo-100 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-xs font-black border border-indigo-300 shrink-0">
                                                {c.assignedTo.name.substring(0,2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-0.5">Assigned Official</div>
                                                <div className="text-sm font-bold text-indigo-700 flex items-center gap-1">
                                                    {c.assignedTo.name} 
                                                    <span className="text-[10px] bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-600 font-bold ml-1">
                                                        {c.assignedTo.authorityLevel}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Status Progress */}
                                    <div className="mb-4 bg-slate-50 rounded-xl p-3 border border-slate-100">
                                        {renderStatusDots(c.status, isRejected, slaRisk)}
                                    </div>

                                    {/* Official Responses Accordion */}
                                    {c.officialReplies && c.officialReplies.length > 0 && (
                                        <div className="mb-4">
                                            <button 
                                                onClick={() => toggleReplies(c._id)}
                                                className="w-full flex items-center justify-between text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                                            >
                                                <span className="flex items-center gap-1.5"><ShieldAlert size={14} /> Official Response ({c.officialReplies.length})</span>
                                                {expandedReplies[c._id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </button>
                                            {expandedReplies[c._id] && (
                                                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto pr-1 no-scrollbar text-xs">
                                                    {c.officialReplies.map((reply, idx) => (
                                                        <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-600 leading-relaxed">
                                                            <div className="flex justify-between items-center mb-1 font-bold text-[10px]">
                                                                <span className="text-slate-800">{reply.authorityName}</span>
                                                                <span className="text-slate-400">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                            {reply.content}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Footer Actions */}
                                    <div className="mt-auto flex items-center gap-2 pt-3 border-t border-slate-100">
                                        {(c.status !== 'Resolved' && c.status !== 'Closed') && (
                                            <>
                                                <button onClick={() => setEditingComplaint({...c})} className="h-8 px-2.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all">
                                                    <Edit2 size={12} /> Edit
                                                </button>
                                                <button onClick={() => handleDelete(c._id)} className="h-8 px-2.5 bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all">
                                                    <Trash2 size={12} /> Delete
                                                </button>
                                            </>
                                        )}
                                        <button onClick={() => setExpandedMapComplaint(c)} className="h-8 px-2.5 ml-auto bg-slate-100 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all">
                                            <Map size={12} /> Map
                                        </button>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                )}
            </div>

            {/* Map Modal */}
            <AnimatePresence>
                {expandedMapComplaint && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setExpandedMapComplaint(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col"
                        >
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                                <div>
                                    <h3 className="font-black text-slate-800">Location Map</h3>
                                    {expandedMapComplaint.address && (
                                        <p className="text-xs text-slate-500 font-medium">
                                            {expandedMapComplaint.address.line1}, {expandedMapComplaint.address.district}
                                        </p>
                                    )}
                                </div>
                                <button onClick={() => setExpandedMapComplaint(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="h-[400px] w-full bg-slate-100 relative z-0">
                                {expandedMapComplaint.location?.coordinates && (
                                    <MapContainer 
                                        center={[expandedMapComplaint.location.coordinates[1], expandedMapComplaint.location.coordinates[0]]} 
                                        zoom={16} 
                                        className="h-full w-full"
                                    >
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <Marker position={[expandedMapComplaint.location.coordinates[1], expandedMapComplaint.location.coordinates[0]]} />
                                    </MapContainer>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Modal (Preserved but styled to match) */}
            <AnimatePresence>
                {editingComplaint && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
                        >
                            <button 
                                onClick={() => setEditingComplaint(null)}
                                className="absolute top-4 right-4 text-slate-400 hover:bg-slate-100 p-2 rounded-xl transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <h2 className="text-xl font-black text-slate-800 mb-6">Edit Complaint</h2>
                            
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                                    <select 
                                        value={editingComplaint.category}
                                        onChange={(e) => setEditingComplaint({...editingComplaint, category: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
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
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                                    <textarea 
                                        value={editingComplaint.description}
                                        onChange={(e) => setEditingComplaint({...editingComplaint, description: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium h-32 resize-none"
                                        required
                                    ></textarea>
                                </div>
                                
                                <div className="flex gap-3 pt-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setEditingComplaint(null)}
                                        className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 px-4 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm shadow-primary/20"
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
        </div>
    );
};

export default MyComplaints;
