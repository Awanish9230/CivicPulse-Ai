import { useState, useEffect, useContext, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, ThumbsUp, MessageSquare, Hash, Send, Users, ShieldAlert } from 'lucide-react';
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
    const chatContainerRef = useRef(null);

    // Fetch Complaints for #issue
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
            toast.success("Supported!");
        } catch (error) {
            setFeed(currentFeed => 
                currentFeed.map(item => 
                    item._id === complaintId 
                        ? { ...item, supportCount: Math.max(0, (item.supportCount || 1) - 1) }
                        : item
                )
            );
            toast.error("Failed to upvote");
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() && socket && user) {
            const messageData = {
                room: activeChannel === 'general' ? 'local-community-general' : 'local-community-authority',
                message: {
                    channel: activeChannel,
                    id: Date.now(),
                    text: newMessage,
                    sender: user.anonymousId || 'Anonymous Citizen',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                }
            };
            socket.emit('sendMessage', messageData);
            setNewMessage('');
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
                
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
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
            </div>

            {/* Right Main Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white relative">
                
                {/* Header */}
                <div className="h-16 border-b border-border/50 flex items-center px-6 glass sticky top-0 z-10 shrink-0">
                    <div className="flex items-center gap-2">
                        <Hash size={20} className="text-text/40" />
                        <h2 className="font-bold text-text text-lg">{activeChannel}</h2>
                    </div>
                    <div className="ml-4 pl-4 border-l border-border/50 text-sm text-text/50 hidden sm:block">
                        {channels.find(c => c.id === activeChannel)?.desc}
                    </div>
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
                                    className="bg-white rounded-2xl p-5 shadow-sm border border-border/50 hover:border-primary/30 transition-colors"
                                >
                                    <div className="flex gap-4">
                                        {/* Avatar / Icon Placeholder */}
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
                                                    className="flex items-center gap-1.5 text-xs font-bold text-text/50 hover:text-primary transition-colors bg-surface hover:bg-primary/5 px-3 py-1.5 rounded-lg"
                                                >
                                                    <ThumbsUp size={14} />
                                                    <span>{item.supportCount || 0}</span>
                                                </button>
                                                <button className="flex items-center gap-1.5 text-xs font-bold text-text/50 hover:text-blue-500 transition-colors bg-surface hover:bg-blue-500/5 px-3 py-1.5 rounded-lg">
                                                    <MessageSquare size={14} />
                                                    <span>Reply</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
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
                                            ? "This is the start of the #general channel. Chat with people in your 5km radius."
                                            : "Tag authorities (e.g. @police, @municipality) to ask direct questions."}
                                    </p>
                                </div>

                                {/* Chat Messages */}
                                {(messages[activeChannel] || []).map((msg) => (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={msg.id} 
                                        className={`flex gap-4 group ${msg.sender === (user?.anonymousId || 'Anonymous Citizen') ? 'flex-row-reverse text-right' : ''}`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-surface border border-border/50 flex items-center justify-center shrink-0 mt-1">
                                            <span className="text-text/60 font-bold text-sm">
                                                {msg.sender.substring(0,2).toUpperCase()}
                                            </span>
                                        </div>
                                        
                                        <div className={`flex flex-col max-w-[70%] ${msg.sender === (user?.anonymousId || 'Anonymous Citizen') ? 'items-end' : 'items-start'}`}>
                                            <div className="flex items-baseline gap-2 mb-1 px-1">
                                                <span className="font-bold text-sm text-text">{msg.sender}</span>
                                                <span className="text-[10px] text-text/40">{msg.timestamp}</span>
                                            </div>
                                            <div className={`px-4 py-2.5 rounded-2xl text-sm ${msg.sender === (user?.anonymousId || 'Anonymous Citizen') ? 'bg-primary text-white rounded-tr-sm' : 'bg-white border border-border/50 text-text rounded-tl-sm shadow-sm'}`}>
                                                {/* Highlight mentions in text if #ask-authority */}
                                                {activeChannel === 'ask-authority' && msg.text.includes('@') ? (
                                                    <span>
                                                        {msg.text.split(/(@\w+)/g).map((part, i) => 
                                                            part.startsWith('@') ? <span key={i} className="text-blue-500 font-bold bg-blue-500/10 px-1 rounded">{part}</span> : part
                                                        )}
                                                    </span>
                                                ) : (
                                                    msg.text
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat Input */}
                {(activeChannel === 'general' || activeChannel === 'ask-authority') && (
                    <div className="p-4 bg-white border-t border-border/50 shrink-0">
                        {user ? (
                            <form onSubmit={handleSendMessage} className="relative flex items-center">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={`Message #${activeChannel}...`}
                                    className="w-full bg-surface border border-border/50 rounded-xl pl-4 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                />
                                <button 
                                    type="submit" 
                                    disabled={!newMessage.trim()}
                                    className="absolute right-2 p-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-primary"
                                >
                                    <Send size={16} />
                                </button>
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
