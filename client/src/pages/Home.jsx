import { motion, AnimatePresence } from 'framer-motion';
import { Camera, MapPin, Clock, ThumbsUp, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import CameraCapture from '../components/complaints/CameraCapture';
import axios from 'axios';
import toast from 'react-hot-toast';

const Home = () => {
    const [isHoveringCamera, setIsHoveringCamera] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [feed, setFeed] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchComplaints = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/v1/complaint/all', {
                withCredentials: true
            });
            setFeed(data.data || []);
        } catch (error) {
            toast.error("Failed to fetch complaints");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const handlePhotoCaptured = (data) => {
        console.log("Captured Data:", data);
        setIsCameraOpen(false);
        // Here you would normally dispatch this to Redux/Backend to start the submission flow
        alert("Photo captured successfully with GPS coordinates! Proceeding to submit form...");
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

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
            {/* Header & Quick Action */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-text tracking-tight mb-2">Nearby Issues</h1>
                    <p className="text-text/60">Showing complaints within 5km of your location.</p>
                </div>

                <motion.button 
                    onClick={() => setIsCameraOpen(true)}
                    onHoverStart={() => setIsHoveringCamera(true)}
                    onHoverEnd={() => setIsHoveringCamera(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative bg-gradient-to-r from-primary to-blue-600 p-1 rounded-2xl shadow-lg shadow-primary/30 w-full md:w-auto"
                >
                    <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-xl flex items-center justify-center gap-3">
                        <Camera className="text-white" size={24} />
                        <span className="text-white font-bold text-lg">Raise Complaint</span>
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

            {/* Feed */}
            <div className="space-y-6">
                {loading && <div className="text-center py-10">Loading complaints...</div>}
                {!loading && feed.length === 0 && (
                    <div className="text-center py-10 text-text/50">No complaints found. Be the first to report an issue!</div>
                )}
                {!loading && feed.map((item, index) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        key={item._id} 
                        className="bg-white rounded-[2rem] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-border/50 group hover:border-primary/30 transition-colors"
                    >
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Image */}
                            <div className="w-full md:w-1/3 h-48 md:h-auto rounded-2xl overflow-hidden relative bg-surface">
                                {item.imageUrl ? (
                                    <img 
                                        src={item.imageUrl} 
                                        alt={item.description} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-text/30">No Image</div>
                                )}
                                <div className="absolute top-3 left-3 glass-dark text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                                    {item.status}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 py-2 pr-2 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                            {item.category}
                                        </span>
                                        <div className="flex items-center text-text/40 text-sm font-medium">
                                            <Clock size={14} className="mr-1" />
                                            {getTimeAgo(item.createdAt)}
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-text mb-2 leading-tight line-clamp-2">{item.description}</h3>
                                    <div className="flex items-center text-text/60 text-sm mb-4">
                                        <MapPin size={16} className="mr-1.5 text-primary" />
                                        Ward / Location Coordinates
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                                    <button className="flex items-center gap-2 text-text/60 hover:text-primary transition-colors font-medium">
                                        <ThumbsUp size={18} />
                                        <span>{item.upvotes || 0} Supports</span>
                                    </button>
                                    <button className="flex items-center gap-2 text-text/60 hover:text-primary transition-colors font-medium">
                                        <MessageSquare size={18} />
                                        <span>Discussion</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

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
        </div>
    );
};

export default Home;
