import { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, ThumbsUp, MessageSquare, Hash, Send, Users, ShieldAlert, BadgeCheck, X, TrendingUp } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';

const Community = () => {
    const { user } = useContext(AuthContext);
    const [activeChannel, setActiveChannel] = useState('issue');
    
    // Issue Feed State
    const [feed, setFeed] = useState([]);
    const [loading, setLoading] = useState(true);

    // Chat State
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState({});
    const [newMessage, setNewMessage] = useState('');
    const [onlineCounts, setOnlineCounts] = useState({});
    const [replyingTo, setReplyingTo] = useState(null);
    const chatContainerRef = useRef(null);

    const fetchComplaints = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/v1/complaint/all', {
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

    // Socket Initialization for Chat
    useEffect(() => {
        const newSocket = io('http://localhost:5000');
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

    // Auto-scroll chat
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
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
            await axios.post(`http://localhost:5000/api/v1/complaint/${complaintId}/upvote`, {}, {
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
        <div className="flex h-[calc(100vh-6rem)] max-w-6xl mx-auto bg-white rounded-3xl border border-border/50 shadow-sm overflow-hidden mb-8">
            
            {/* Left Sidebar - Channels */}
            <div className="w-64 bg-surface/50 border-r border-border/50 flex flex-col hidden md:flex shrink-0">
                <div className="p-6 border-b border-border/50">
                    <h2 className="text-xl font-black text-text tracking-tight">Community Hub</h2>
                    <p className="text-xs text-text/50 mt-1">Within 5km radius</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between">
                    <div className="space-y-1">
                        <div className="text-xs font-bold text-text/40 uppercase tracking-wider mb-2 px-3">Channels</div>
                        {channels.map(channel => {
                            const Icon = channel.icon;
                            const isActive = activeChannel === channel.id;
                            return (
                                <button
                                    key={channel.id}
                                    onClick={() => setActiveChannel(channel.id)}
                                    className={`w-full flex flex-col items-start px-3 py-2 rounded-xl transition-all ${
                                        isActive ? 'bg-primary/10 text-primary' : 'hover:bg-black/5 text-text/70'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 font-bold">
                                        <Hash size={16} />
                                        <span>{channel.name}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Trending Widget */}
                    <div className="mt-8 bg-white border border-border/50 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-primary font-bold mb-3">
                            <TrendingUp size={16} />
                            <span className="text-sm">Trending Issues</span>
                        </div>
                        <div className="space-y-3">
                            {feed.slice(0, 3).map(item => (
                                <div key={item._id} className="text-xs">
                                    <div className="font-bold text-text line-clamp-1">{item.description}</div>
                                    <div className="text-text/50 flex items-center gap-1 mt-0.5">
                                        <MapPin size={10} /> {item.supportCount || 0} affected
                                    </div>
                                </div>
                            ))}
                            {feed.length === 0 && <div className="text-xs text-text/50">No trending issues yet.</div>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Main Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white relative">
                
                {/* Header */}
                <div className="h-16 border-b border-border/50 flex items-center justify-between px-6 glass sticky top-0 z-10 shrink-0">
                    <div className="flex items-center">
                        <div className="flex items-center gap-2">
                            <Hash size={20} className="text-text/40" />
                            <h2 className="font-bold text-text text-lg">{activeChannel}</h2>
                        </div>
                        <div className="ml-4 pl-4 border-l border-border/50 text-sm text-text/50 hidden sm:block">
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

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-[#F8FAFC]/50" ref={chatContainerRef}>
                    
                    {/* Channel: #issue */}
                    {activeChannel === 'issue' && (
                        <div className="p-6 max-w-4xl mx-auto space-y-6">
                            {loading && <div className="text-center py-10">Loading issues...</div>}
                            {!loading && feed.length === 0 && (
                                <div className="text-center py-12 text-text/50">No issues reported in your area.</div>
                            )}
                            {!loading && feed.map((item, index) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    key={item._id} 
                                    className="bg-white rounded-2xl p-5 shadow-sm border border-border/50 hover:border-primary/30 transition-colors relative overflow-hidden"
                                >
                                    <div className="flex gap-4 relative z-10">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <span className="text-primary font-bold text-sm">AC</span>
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <span className="font-bold text-text">Anonymous Citizen</span>
                                                <span className="text-xs text-text/40">{getTimeAgo(item.createdAt)}</span>
                                            </div>
                                            
                                            <div className="flex gap-2 mb-3">
                                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider">
                                                    {item.category}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${item.status === 'Resolved' ? 'bg-green-500/10 text-green-600' : 'bg-orange-500/10 text-orange-600'}`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                            
                                            <p className="text-text/80 text-sm leading-relaxed mb-3">
                                                {item.description}
                                            </p>
                                            
                                            {item.imageUrl && (
                                                <div className="mt-2 mb-4 rounded-xl overflow-hidden border border-border/50 max-w-md h-48 bg-surface">
                                                    <img src={item.imageUrl} alt="Issue" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center gap-4">
                                                <button 
                                                    onClick={() => handleUpvote(item._id)}
                                                    className="group flex items-center gap-2 text-xs font-bold text-primary transition-colors bg-primary/10 hover:bg-primary hover:text-white px-4 py-2 rounded-xl"
                                                >
                                                    <MapPin size={14} className="group-hover:animate-bounce" />
                                                    <span>I'm affected too ({item.supportCount || 0})</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Heatmap background effect */}
                                    <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[50px] rounded-full pointer-events-none" />
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Channels: #general or #ask-authority */}
                    {(activeChannel === 'general' || activeChannel === 'ask-authority') && (
                        <div className="flex flex-col min-h-full justify-end p-6">
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
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={msg.id} 
                                            className={`flex gap-4 group ${isMe ? 'flex-row-reverse text-right' : ''}`}
                                        >
                                            <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 mt-1 ${isAuthority ? 'bg-yellow-500/10 border-yellow-500 text-yellow-600' : 'bg-surface border-border/50 text-text/60'}`}>
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

                                                    <div className={`px-4 py-2.5 rounded-2xl text-sm break-words flex flex-col ${isMe ? 'bg-primary text-white rounded-tr-sm' : isAuthority ? 'bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-tl-sm shadow-sm' : 'bg-white border border-border/50 text-text rounded-tl-sm shadow-sm'}`}>
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
                        </div>
                    )}
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
                                        className={`w-full bg-surface border border-border/50 pl-4 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm ${replyingTo ? 'rounded-b-xl border-t-0' : 'rounded-xl'}`}
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
