import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Camera, MapPin, Clock, ThumbsUp, MessageSquare, Shield, Zap, Globe, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import CameraCapture from '../components/complaints/CameraCapture';
import ReportModal from '../components/complaints/ReportModal';
import axios from 'axios';
import toast from 'react-hot-toast';

const Home = () => {
    const [isHoveringCamera, setIsHoveringCamera] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [captureData, setCaptureData] = useState(null); // Holds { photo, gps }
    const [feed, setFeed] = useState([]);
    const [loading, setLoading] = useState(true);

    const location = useLocation();
    const navigate = useNavigate();

    // Check query params to auto-open camera (e.g. from MyComplaints)
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.get('report') === 'true') {
            setIsCameraOpen(true);
            // Clean up the URL to prevent reopening on refresh
            navigate('/', { replace: true });
        }
    }, [location, navigate]);

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
        setCaptureData(data);
        setIsCameraOpen(false); // Close camera, open modal
    };

    const handleReportSuccess = () => {
        setCaptureData(null);
        fetchComplaints(); // Refresh the feed!
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
        <div className="space-y-16 pb-20">
            {/* Hero Section */}
            <section className="relative w-full rounded-3xl bg-gradient-to-br from-[#F8FAFC] to-white border border-border/50 shadow-sm overflow-hidden py-20 px-6 text-center mt-4">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/20 blur-[100px] rounded-full pointer-events-none" />
                
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10 max-w-4xl mx-auto space-y-6"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm mb-2 border border-primary/20">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Revolutionizing Civic Engagement
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl font-black text-text tracking-tighter leading-[1.1]">
                        Report Issues. <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
                            Stay Anonymous.
                        </span>
                    </h1>
                    
                    <p className="text-lg text-text/60 max-w-2xl mx-auto leading-relaxed font-medium">
                        CivicPulse empowers citizens to report local issues, track resolution in real-time, and hold authorities accountable—all while ensuring 100% untraceable anonymity.
                    </p>
                </motion.div>
            </section>

            {/* Features Section */}
            <section className="grid md:grid-cols-3 gap-6">
                <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl border border-border/50 shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                        <Shield size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-text mb-2">Total Anonymity</h3>
                    <p className="text-sm text-text/60 leading-relaxed">Identity rotates every 10 minutes. Secure participation.</p>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl border border-border/50 shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
                        <MapPin size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-text mb-2">Live Geotagging</h3>
                    <p className="text-sm text-text/60 leading-relaxed">Exact GPS coordinates dispatch the right authorities.</p>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl border border-border/50 shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
                        <Zap size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-text mb-2">SLA Enforcement</h3>
                    <p className="text-sm text-text/60 leading-relaxed">Automatic escalation to higher authorities if ignored.</p>
                </motion.div>
            </section>

            {/* Main App Content: Feed Header */}
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-t border-border/50 pt-10">
                    <div>
                        <h2 className="text-3xl font-black text-text tracking-tight mb-2">Nearby Issues</h2>
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

            </div>

            {/* Footer */}
            <footer className="relative z-10 bg-text text-white py-12 rounded-3xl mt-12 overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8 relative z-10">
                    <div className="md:col-span-2 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white font-black shadow-lg">
                                C
                            </div>
                            <span className="font-black text-xl tracking-tight">CivicPulse</span>
                        </div>
                        <p className="text-white/50 max-w-sm text-sm leading-relaxed">
                            A modern, anonymous, and real-time civic engagement platform designed to hold local authorities accountable and build better communities.
                        </p>
                    </div>
                    
                    <div>
                        <h4 className="font-bold mb-4 text-white/80">Platform</h4>
                        <ul className="space-y-2 text-sm text-white/50">
                            <li><Link to="/complaints" className="hover:text-white transition-colors">My Reports</Link></li>
                            <li><Link to="/community" className="hover:text-white transition-colors">Community</Link></li>
                            <li><Link to="/authority" className="hover:text-white transition-colors">Authority Portal</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-4 text-white/80">Connect</h4>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all">
                                <Globe size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all">
                                <Mail size={18} />
                            </a>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40 relative z-10">
                    <p>© 2026 CivicPulse. All rights reserved.</p>
                    <div className="flex gap-4">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                    </div>
                </div>
            </footer>

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

export default Home;
