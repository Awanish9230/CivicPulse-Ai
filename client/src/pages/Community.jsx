import React, { useState, useEffect, useContext, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, ThumbsUp, MessageSquare, Hash, Send, Users, ShieldAlert, BadgeCheck, X, TrendingUp, Megaphone, ChevronDown } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import ImageCarousel from '../components/common/ImageCarousel';

const IssueCardSkeleton = () => (
    <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3 mb-4">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 skeleton-avatar skeleton-box"></div>
            <div className="flex flex-col gap-1.5 flex-1">
                <div className="h-2.5 w-32 skeleton-text skeleton-box"></div>
                <div className="h-2 w-20 skeleton-text skeleton-box"></div>
            </div>
            <div className="h-4 w-16 skeleton-text skeleton-box rounded-full"></div>
        </div>
        <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-2 mt-1">
                <div className="h-2.5 w-full skeleton-text skeleton-box"></div>
                <div className="h-2.5 w-3/4 skeleton-text skeleton-box"></div>
            </div>
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg skeleton-box shrink-0"></div>
        </div>
    </div>
);

const IssueCard = memo(({ item, index, user, expandedUpdates, setExpandedUpdates, handleUpvote, handleResolve, getTimeAgo }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="bg-white/80 backdrop-blur-lg rounded-xl p-3 shadow-sm border border-slate-100 hover:border-slate-300 transition-all relative overflow-hidden group hover:-translate-y-0.5"
        >
            <div className="flex gap-3 relative z-10">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-primary font-bold text-[8px]">AC</span>
                        </div>
                        <span className="font-bold text-xs text-slate-800">Anonymous</span>
                        <span className="text-[10px] text-slate-400 font-medium">{getTimeAgo(item.createdAt)}</span>
                        <div className="ml-auto flex gap-1">
                            <span className="text-[9px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                {item.category}
                            </span>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${item.status === 'Resolved' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-orange-50 text-orange-600 border border-orange-200'}`}>
                                {item.status}
                            </span>
                        </div>
                    </div>
                    
                    <p className="text-slate-600 text-xs leading-relaxed mb-2 line-clamp-2">
                        {item.description}
                    </p>
                    
                    <div className="flex items-center gap-3 pt-2 border-t border-slate-100 mt-2">
                        <button 
                            onClick={() => handleUpvote(item._id)}
                            className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-primary transition-colors hover:bg-primary/5 px-2 py-1 rounded-lg"
                        >
                            <ThumbsUp size={12} />
                            {item.supportCount || item.upvotes || 0}
                        </button>
                        
                        {user?.role === 'Authority' && item.status !== 'Resolved' && (
                            <button 
                                onClick={() => handleResolve(item._id)}
                                className="ml-auto flex items-center gap-1.5 text-slate-600 bg-white border border-slate-200 hover:border-green-400 hover:text-green-600 px-2 py-1 rounded-lg transition-colors font-bold text-[10px] uppercase tracking-wider shadow-sm"
                            >
                                <ShieldAlert size={12} />
                                Resolve
                            </button>
                        )}
                    </div>

                    {/* Render Official Replies */}
                    {item.officialReplies && item.officialReplies.length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
                            <div className="flex items-center justify-between mb-1">
                                <h5 className="text-[10px] font-bold text-text/60 uppercase tracking-wider">Authority Updates</h5>
                                {item.officialReplies.length > 1 && (
                                    <button 
                                        onClick={() => setExpandedUpdates(prev => ({ ...prev, [item._id]: !prev[item._id] }))}
                                        className="text-[10px] text-primary hover:underline font-bold"
                                    >
                                        {expandedUpdates[item._id] ? 'Hide Updates' : `See All Updates (${item.officialReplies.length})`}
                                    </button>
                                )}
                            </div>
                            {(expandedUpdates[item._id] ? item.officialReplies : [item.officialReplies[item.officialReplies.length - 1]]).map((reply, i) => (
                                <div key={i} className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-2">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <ShieldAlert size={12} className="text-blue-500" />
                                        <span className="font-bold text-xs text-blue-600">{reply.authorityName}</span>
                                        <span className="text-[10px] text-text/40 ml-auto">{getTimeAgo(reply.createdAt)}</span>
                                    </div>
                                    <p className="text-xs text-text/80">{reply.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {(item.imageUrls?.length > 0 || item.imageUrl) && (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 ml-1">
                        <ImageCarousel images={item.imageUrls?.length > 0 ? item.imageUrls : [item.imageUrl]} />
                    </div>
                )}
            </div>
            {/* Heatmap background effect (Optimized) */}
            <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 to-transparent pointer-events-none -z-10" />
        </motion.div>
    );
});

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);
    var dLon = deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI/180)
}

const Community = () => {
    const { user } = useContext(AuthContext);
    const [activeChannel, setActiveChannel] = useState('issue');
    
    // Geospatial State
    const [radius, setRadius] = useState('10');
    const [isRadiusOpen, setIsRadiusOpen] = useState(false);
    const [location, setLocation] = useState(null);
    const [locationDenied, setLocationDenied] = useState(false);

    // Issue Feed State
    const [feed, setFeed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedUpdates, setExpandedUpdates] = useState({});

    // Chat State
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState({});
    const [newMessage, setNewMessage] = useState('');
    const [onlineCounts, setOnlineCounts] = useState({});
    const [replyingTo, setReplyingTo] = useState(null);
    const chatContainerRef = useRef(null);

    const fetchComplaints = async (lat, lng, rds) => {
        try {
            setLoading(true);
            const params = {};
            if (lat && lng) {
                params.lat = lat;
                params.lng = lng;
            }
            if (rds && rds !== 'All') {
                params.radius = rds;
            }

            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/complaint/all`, {
                withCredentials: true,
                params
            });
            setFeed(data.data || []);
        } catch (error) {
            toast.error("Failed to fetch community posts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setLocation({ lat, lng });
                    setLocationDenied(false);
                    fetchComplaints(lat, lng, radius);
                },
                (error) => {
                    console.warn("Location permission denied", error);
                    setLocationDenied(true);
                    setLoading(false);
                },
                { timeout: 10000 }
            );
        } else {
            toast.error("Geolocation not supported.");
            setLocationDenied(true);
            setLoading(false);
        }
    }, [radius]);

    const handleResolve = async (id) => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/complaint/${id}/resolve`, {}, {
                withCredentials: true
            });
            toast.success("Complaint resolved and optimized!");
            fetchComplaints();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to resolve complaint");
        }
    };

    // Socket Initialization for Chat
    useEffect(() => {
        const newSocket = io(`${import.meta.env.VITE_API_URL}`);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to Community Socket');
            newSocket.emit('joinRoom', 'local-community-general');
            newSocket.emit('joinRoom', 'local-community-authority');
        });

        newSocket.on('receiveMessage', (message) => {
            // Client-side filtering of incoming socket messages based on distance
            if (radius !== 'All' && location && message.location?.coordinates) {
                const [msgLng, msgLat] = message.location.coordinates;
                const distance = getDistanceFromLatLonInKm(location.lat, location.lng, msgLat, msgLng);
                if (distance > parseInt(radius)) {
                    // Ignore message, too far away
                    return;
                }
            }

            setMessages(prev => ({
                ...prev,
                [message.channel]: [...(prev[message.channel] || []), message]
            }));
        });

        newSocket.on('roomData', ({ room, onlineCount }) => {
            const channel = room === 'local-community-general' ? 'general' : 'ask-authority';
            setOnlineCounts(prev => ({ ...prev, [channel]: onlineCount }));
        });

        return () => newSocket.close();
    }, [radius, location]);

    // Fetch chat history when channel changes
    useEffect(() => {
        if ((activeChannel === 'general' || activeChannel === 'ask-authority') && location && !locationDenied) {
            const fetchChatHistory = async () => {
                try {
                    const params = {
                        lat: location.lat,
                        lng: location.lng
                    };
                    if (radius && radius !== 'All') {
                        params.radius = radius;
                    }

                    const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/message/${activeChannel}`, {
                        withCredentials: true,
                        params
                    });
                    setMessages(prev => ({
                        ...prev,
                        [activeChannel]: data.data
                    }));
                } catch (error) {
                    console.error("Failed to load chat history", error);
                }
            };
            fetchChatHistory();
        }
    }, [activeChannel, location, radius, locationDenied]);

    // Auto-scroll chat
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, activeChannel]);

    const handleUpvote = async (complaintId) => {
        if (!user) {
            toast.error("Please login to upvote");
            return;
        }

        // Optimistic update
        setFeed(currentFeed => 
            currentFeed.map(item => 
                item._id === complaintId 
                    ? { ...item, supportCount: (item.supportCount || 0) + 1 }
                    : item
            )
        );

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/complaint/${complaintId}/upvote`, {}, {
                withCredentials: true
            });
            toast.success("Impact footprint recorded!");
        } catch (error) {
            setFeed(currentFeed => 
                currentFeed.map(item => 
                    item._id === complaintId 
                        ? { ...item, supportCount: Math.max(0, (item.supportCount || 1) - 1) }
                        : item
                )
            );
            toast.error("Failed to record footprint");
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() && socket && user) {
            const messageData = {
                room: activeChannel === 'general' ? 'local-community-general' : 'local-community-authority',
                message: {
                    id: Date.now().toString(),
                    senderId: user._id,
                    sender: user.role === 'Authority' ? user.name : user.anonymousId,
                    role: user.role,
                    text: newMessage,
                    timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    channel: activeChannel,
                    ...(location && { lat: location.lat, lng: location.lng }),
                    replyTo: replyingTo ? {
                        sender: replyingTo.sender,
                        text: replyingTo.text
                    } : null
                }
            };
            socket.emit('sendMessage', messageData);
            setNewMessage('');
            setReplyingTo(null);
        }
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

    // Regex to detect image URLs
    const renderMessageContent = (text) => {
        const imgRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))/i;
        if (imgRegex.test(text)) {
            const parts = text.split(imgRegex);
            return parts.map((part, i) => {
                if (imgRegex.test(part)) {
                    return <img key={i} src={part} alt="attachment" className="mt-2 rounded-lg max-w-full h-32 object-cover border border-border/50" />;
                }
                // Handle mentions for authority
                if (activeChannel === 'ask-authority' && part.includes('@')) {
                    return <span key={i}>{part.split(/(@\w+)/g).map((p, j) => p.startsWith('@') ? <span key={j} className="text-blue-500 font-bold bg-blue-500/10 px-1 rounded">{p}</span> : p)}</span>;
                }
                return <span key={i}>{part}</span>;
            });
        }

        if (activeChannel === 'ask-authority' && text.includes('@')) {
            return <span>{text.split(/(@\w+)/g).map((part, i) => part.startsWith('@') ? <span key={i} className="text-blue-500 font-bold bg-blue-500/10 px-1 rounded">{part}</span> : part)}</span>;
        }

        return text;
    };

    const channels = [
        { id: 'issue', name: 'issue', icon: MapPin, desc: 'Local complaints within 5km' },
        { id: 'general', name: 'general', icon: Users, desc: 'General community chat' },
        { id: 'ask-authority', name: 'ask-authority', icon: ShieldAlert, desc: 'Direct chat with authorities' },
        { id: 'announcements', name: 'announcements', icon: Megaphone, desc: 'Official city updates & alerts' }
    ];

    return (
        <div className="flex h-[calc(100dvh-10rem)] md:h-[calc(100vh-6rem)] max-w-6xl mx-auto bg-white/70 backdrop-blur-2xl rounded-2xl md:rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden mb-0 md:mb-8 relative z-10">
            
            {/* Location Denied Overlay */}
            {locationDenied && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center">
                    <MapPin size={48} className="text-red-500 mb-4" />
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Location Required</h2>
                    <p className="text-slate-600 max-w-md">
                        You must enable location permissions in your browser to access the Community chat and local feeds. Please allow location access and refresh the page.
                    </p>
                </div>
            )}

            {/* Left Sidebar - Channels */}
            <div className="w-72 bg-white/40 border-r border-white/50 flex flex-col hidden md:flex shrink-0 backdrop-blur-xl">
                <div className="p-6 border-b border-white/50">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Community Hub</h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Local connections</p>
                </div>
                
                <div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col justify-between">
                    <div className="space-y-1">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-3">Channels</div>
                        {channels.map(channel => {
                            const Icon = channel.icon;
                            const isActive = activeChannel === channel.id;
                            return (
                                <button
                                    key={channel.id}
                                    onClick={() => setActiveChannel(channel.id)}
                                    className={`w-full flex flex-col items-start px-4 py-3 rounded-2xl transition-all ${
                                        isActive ? 'bg-white shadow-sm border border-slate-100 text-primary font-bold' : 'hover:bg-white/50 text-slate-500 font-medium'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg ${isActive ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                                            <Icon size={16} />
                                        </div>
                                        <span>{channel.name}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Trending Widget */}
                    <div className="mt-8 bg-white/60 border border-white/80 rounded-3xl p-5 shadow-sm backdrop-blur-md shrink-0">
                        <div className="flex items-center gap-2 text-primary font-black mb-4">
                            <TrendingUp size={16} />
                            <span className="text-sm tracking-tight">Trending Issues</span>
                        </div>
                        <div className="space-y-4">
                            {feed.slice(0, 2).map(item => (
                                <div key={item._id} className="text-xs group cursor-pointer">
                                    <div className="font-bold text-slate-800 line-clamp-1 group-hover:text-primary transition-colors">{item.description}</div>
                                    <div className="text-slate-500 font-medium flex items-center gap-1 mt-1">
                                        <MapPin size={10} className="text-slate-400" /> {item.supportCount || 0} affected
                                    </div>
                                </div>
                            ))}
                            {feed.length === 0 && <div className="text-xs text-slate-400">No trending issues yet.</div>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Main Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30 relative">
                
                {/* Header */}
                <div className="h-[72px] border-b border-white bg-white/40 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 shrink-0 shadow-[0_2px_10px_rgb(0,0,0,0.02)] gap-2">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                        <div className="p-1.5 md:p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-primary shrink-0">
                            {(() => {
                                const Icon = channels.find(c => c.id === activeChannel)?.icon || Hash;
                                return <Icon size={20} className="w-4 h-4 md:w-5 md:h-5" />;
                            })()}
                        </div>
                        <h2 className="font-black text-slate-800 text-lg md:text-xl tracking-tight capitalize truncate shrink-0">{channels.find(c => c.id === activeChannel)?.name || activeChannel}</h2>
                        <div className="ml-2 pl-2 md:ml-5 md:pl-5 border-l border-slate-200 text-xs md:text-sm font-medium text-slate-500 hidden sm:block truncate">
                            {channels.find(c => c.id === activeChannel)?.desc}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 md:gap-4 shrink-0">
                        {/* Custom Select Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => !locationDenied && setIsRadiusOpen(!isRadiusOpen)}
                                disabled={locationDenied}
                                className={`flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-bold text-slate-700 outline-none transition-all disabled:opacity-50 ${isRadiusOpen ? 'ring-2 ring-primary/20 border-primary shadow-sm' : 'hover:bg-slate-50'}`}
                            >
                                <span className="whitespace-nowrap">
                                    {radius === 'All' ? 'All Range' : `Within ${radius} km`}
                                </span>
                                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isRadiusOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isRadiusOpen && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-40" 
                                            onClick={() => setIsRadiusOpen(false)}
                                        ></div>
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.15, ease: "easeOut" }}
                                            className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-xl border border-slate-200 shadow-[0_10px_40px_rgb(0,0,0,0.1)] rounded-2xl overflow-hidden z-50 flex flex-col p-1"
                                        >
                                            {[
                                                { val: 'All', label: 'All Range' },
                                                { val: '5', label: 'Within 5 km' },
                                                { val: '10', label: 'Within 10 km' },
                                                { val: '20', label: 'Within 20 km' },
                                                { val: '50', label: 'Within 50 km' },
                                                { val: '100', label: 'Within 100 km' },
                                                { val: '200', label: 'Within 200 km' }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.val}
                                                    onClick={() => {
                                                        setRadius(opt.val);
                                                        setIsRadiusOpen(false);
                                                    }}
                                                    className={`px-4 py-2.5 text-sm font-medium rounded-xl text-left transition-colors ${
                                                        radius === opt.val 
                                                            ? 'bg-primary text-white font-bold' 
                                                            : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                                                    }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Live Online Count for Chat Channels */}
                        {(activeChannel === 'general' || activeChannel === 'ask-authority') && (
                            <div className="flex items-center gap-1.5 md:gap-2 bg-green-500/10 text-green-600 px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold shrink-0">
                                <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-green-500"></span>
                                </span>
                                <span className="hidden sm:inline">{onlineCounts[activeChannel] || 1} online</span>
                                <span className="sm:hidden">{onlineCounts[activeChannel] || 1}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Channel Selector */}
                <div className="md:hidden flex justify-between gap-1 p-1.5 bg-white/60 backdrop-blur-md border-b border-white shadow-sm w-full relative">
                    {channels.map(channel => {
                        const Icon = channel.icon;
                        const isActive = activeChannel === channel.id;
                        return (
                            <button
                                key={channel.id}
                                onClick={() => setActiveChannel(channel.id)}
                                className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all ${
                                    isActive ? 'bg-primary text-white shadow-md font-bold' : 'bg-white/80 text-slate-600 font-medium hover:bg-slate-50'
                                }`}
                            >
                                <Icon size={16} />
                                <span className="text-[9px] sm:text-[10px] text-center leading-tight">
                                    {channel.id === 'general' ? 'Chat' : 
                                     channel.id === 'ask-authority' ? 'Authority' : 
                                     channel.id === 'announcements' ? 'Alerts' : 
                                     'Local'}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-scroll bg-[#F8FAFC]/50" ref={chatContainerRef}>
                    <AnimatePresence mode="wait">
                    {/* Channel: #issue */}
                    {activeChannel === 'issue' ? (
                            <motion.div 
                                key="issue"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="p-3 sm:p-6 max-w-4xl mx-auto space-y-4 w-full"
                            >
                            {loading && (
                                <div>
                                    <IssueCardSkeleton />
                                    <IssueCardSkeleton />
                                    <IssueCardSkeleton />
                                </div>
                            )}
                            {!loading && feed.length === 0 && (
                                <div className="text-center py-12 text-text/50">No issues reported in your area.</div>
                            )}
                            {!loading && feed.map((item, index) => (
                                <IssueCard
                                    key={item._id}
                                    item={item}
                                    index={index}
                                    user={user}
                                    expandedUpdates={expandedUpdates}
                                    setExpandedUpdates={setExpandedUpdates}
                                    handleUpvote={handleUpvote}
                                    handleResolve={handleResolve}
                                    getTimeAgo={getTimeAgo}
                                />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div 
                            key={activeChannel}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="flex flex-col min-h-full justify-end p-6"
                        >
                            <div className="space-y-6">
                                {/* Welcome Message */}
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                        <Hash size={32} className="text-primary" />
                                    </div>
                                    <h1 className="text-2xl font-black text-text mb-2">Welcome to #{activeChannel}!</h1>
                                    <p className="text-text/50 text-sm">
                                        {activeChannel === 'general' 
                                            ? "Chat with people in your 5km radius. Paste image URLs to share photos!"
                                            : activeChannel === 'announcements'
                                                ? "Read-only feed for official city updates and alerts."
                                                : "Tag authorities (e.g. @police, @municipality) to ask direct questions."}
                                    </p>
                                </div>

                                {/* Chat Messages */}
                                {(messages[activeChannel] || []).map((msg) => {
                                    const isMe = msg.senderId === user?._id || msg.sender === (user?.anonymousId || 'Anonymous Citizen');
                                    const isAuthority = msg.role === 'Authority';

                                    return (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            key={msg.id} 
                                            className={`flex gap-4 group ${isMe ? 'flex-row-reverse text-right' : ''}`}
                                        >
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-1 shadow-sm border ${isAuthority ? 'bg-gradient-to-br from-yellow-400 to-amber-500 border-amber-300 text-white shadow-amber-500/30' : 'bg-white border-slate-100 text-slate-500'}`}>
                                                {isAuthority ? <ShieldAlert size={18} /> : <span className="font-bold text-sm">{msg.sender.substring(0,2).toUpperCase()}</span>}
                                            </div>
                                            
                                            <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                <div className="flex items-center gap-2 mb-1 px-1">
                                                    <span className={`font-bold text-sm flex items-center gap-1 ${isAuthority ? 'text-yellow-600' : 'text-text'}`}>
                                                        {msg.sender}
                                                        {isAuthority && <BadgeCheck size={14} className="text-yellow-500" />}
                                                    </span>
                                                    <span className="text-[10px] text-text/40">{msg.timestamp}</span>
                                                </div>

                                                <div className="flex flex-col gap-1 w-full">
                                                    {/* Threaded Reply Block */}
                                                    {msg.replyTo && (
                                                        <div className={`text-xs p-2 rounded-lg opacity-70 border-l-2 ${isMe ? 'bg-black/10 border-white text-white/80 text-right' : 'bg-surface border-primary text-text/60 text-left'}`}>
                                                            <div className="font-bold mb-0.5">{msg.replyTo.sender}</div>
                                                            <div className="line-clamp-1">{msg.replyTo.text}</div>
                                                        </div>
                                                    )}

                                                    <div className={`px-4 py-3 rounded-2xl text-sm break-words flex flex-col shadow-sm border ${isMe ? 'bg-gradient-to-r from-primary to-blue-600 text-white rounded-tr-sm border-blue-500/50 shadow-primary/20' : isAuthority ? 'bg-yellow-50/90 backdrop-blur-md border-yellow-200 text-yellow-900 rounded-tl-sm shadow-amber-500/10' : 'bg-white/90 backdrop-blur-md border-white text-slate-700 rounded-tl-sm shadow-[0_4px_20px_rgb(0,0,0,0.03)]'}`}>
                                                        {renderMessageContent(msg.text)}
                                                    </div>
                                                </div>

                                                {!isMe && (
                                                    <button 
                                                        onClick={() => setReplyingTo(msg)}
                                                        className="text-[10px] font-bold text-text/40 hover:text-primary transition-colors mt-1 px-2 opacity-0 group-hover:opacity-100"
                                                    >
                                                        Reply
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>

                {/* Chat Input */}
                {['general', 'ask-authority', 'announcements'].includes(activeChannel) && (
                    <div className="p-4 bg-white border-t border-border/50 shrink-0">
                        {user ? (
                            activeChannel === 'announcements' && user.role !== 'Authority' ? (
                                <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 font-bold text-sm">
                                    <Megaphone size={16} className="inline-block mr-2 text-slate-400" />
                                    This channel is read-only for official announcements.
                                </div>
                            ) : (
                                <form onSubmit={handleSendMessage} className="relative flex flex-col">
                                {/* Replying To Indicator */}
                                <AnimatePresence>
                                    {replyingTo && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, height: 0 }}
                                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                                            exit={{ opacity: 0, y: 10, height: 0 }}
                                            className="bg-surface rounded-t-xl px-4 py-2 flex items-center justify-between text-xs text-text/60 border-t border-l border-r border-border/50"
                                        >
                                            <div className="flex items-center gap-2">
                                                <MessageSquare size={12} />
                                                <span>Replying to <strong>{replyingTo.sender}</strong></span>
                                            </div>
                                            <button type="button" onClick={() => setReplyingTo(null)} className="hover:text-red-500">
                                                <X size={14} />
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                
                                <div className="relative flex items-center">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder={`Message #${activeChannel}...`}
                                        className={`w-full bg-slate-50/80 backdrop-blur-md border border-slate-200 pl-5 pr-14 py-4 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white transition-all text-sm shadow-inner ${replyingTo ? 'rounded-b-2xl border-t-0' : 'rounded-2xl'}`}
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={!newMessage.trim()}
                                        className="absolute right-2 p-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-primary"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </form>
                            )
                        ) : (
                            <div className="text-center py-3 text-sm text-text/50 border border-border/50 rounded-xl bg-surface">
                                Please <span className="font-bold text-primary">log in</span> to chat in this channel.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Community;
