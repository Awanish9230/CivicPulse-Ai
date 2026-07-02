import React, { useState, useEffect, useContext, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, ThumbsUp, MessageSquare, Hash, Send, Users, ShieldAlert, BadgeCheck, X, TrendingUp } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';

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

                {(item.imageUrls?.[0] || item.imageUrl) && (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 ml-1">
                        <img src={item.imageUrls?.[0] || item.imageUrl} alt="Issue" loading="lazy" className="w-full h-full object-cover" />
                    </div>
                )}
            </div>
            {/* Heatmap background effect */}
            <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[50px] rounded-full pointer-events-none" />
        </motion.div>
    );
});

const Community = () => {
    const { user } = useContext(AuthContext);
    const [activeChannel, setActiveChannel] = useState('issue');
    
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

    const fetchComplaints = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/complaint/all`, {
                withCredentials: true
            });
            setFeed(data.data || []);
        } catch (error) {
            toast.error("Failed to fetch community posts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

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
    }, []);

    // Fetch chat history when channel changes
    useEffect(() => {
        if (activeChannel === 'general' || activeChannel === 'ask-authority') {
            const fetchChatHistory = async () => {
                try {
                    const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/message/${activeChannel}`, {
                        withCredentials: true
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
    }, [activeChannel]);

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
        { id: 'ask-authority', name: 'ask-authority', icon: ShieldAlert, desc: 'Direct chat with authorities' }
    ];

    return (
        <div className="flex h-[calc(100vh-6rem)] max-w-6xl mx-auto bg-white/70 backdrop-blur-2xl rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden mb-8 relative z-10">
            
            {/* Left Sidebar - Channels */}
            <div className="w-72 bg-white/40 border-r border-white/50 flex flex-col hidden md:flex shrink-0 backdrop-blur-xl">
                <div className="p-6 border-b border-white/50">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Community Hub</h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Within 5km radius</p>
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
                <div className="h-[72px] border-b border-white bg-white/40 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-20 shrink-0 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                    <div className="flex items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-primary">
                                {(() => {
                                    const Icon = channels.find(c => c.id === activeChannel)?.icon || Hash;
                                    return <Icon size={20} />;
                                })()}
                            </div>
                            <h2 className="font-black text-slate-800 text-xl tracking-tight capitalize">{channels.find(c => c.id === activeChannel)?.name || activeChannel}</h2>
                        </div>
                        <div className="ml-5 pl-5 border-l border-slate-200 text-sm font-medium text-slate-500 hidden sm:block">
                            {channels.find(c => c.id === activeChannel)?.desc}
                        </div>
                    </div>
                    
                    {/* Live Online Count for Chat Channels */}
                    {(activeChannel === 'general' || activeChannel === 'ask-authority') && (
                        <div className="flex items-center gap-2 bg-green-500/10 text-green-600 px-3 py-1 rounded-full text-xs font-bold">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            {onlineCounts[activeChannel] || 1} online
                        </div>
                    )}
                </div>

                {/* Mobile Channel Selector */}
                <div className="md:hidden flex overflow-x-auto gap-2 p-3 bg-white/60 backdrop-blur-md border-b border-white shadow-sm shrink-0 no-scrollbar">
                    {channels.map(channel => {
                        const Icon = channel.icon;
                        const isActive = activeChannel === channel.id;
                        return (
                            <button
                                key={channel.id}
                                onClick={() => setActiveChannel(channel.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                                    isActive ? 'bg-primary text-white shadow-md font-bold' : 'bg-white/80 text-slate-600 font-medium border border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <Icon size={14} />
                                <span className="text-sm capitalize">{channel.name.replace('-', ' ')}</span>
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
                            className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4"
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
                {(activeChannel === 'general' || activeChannel === 'ask-authority') && (
                    <div className="p-4 bg-white border-t border-border/50 shrink-0">
                        {user ? (
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
