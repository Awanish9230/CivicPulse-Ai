import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, Send, Users, ShieldAlert, X, Pencil, Trash2, Check, ChevronDown } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';
import { io } from 'socket.io-client';

const AuthorityChat = () => {
    const { user } = useContext(AuthContext);
    const [activeChannel, setActiveChannel] = useState('ask-authority');
    
    // Chat State
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState({});
    const [newMessage, setNewMessage] = useState('');
    const [onlineCounts, setOnlineCounts] = useState({});
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingMsg, setEditingMsg] = useState(null); // { _id, text }
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const chatContainerRef = useRef(null);

    const roomMap = {
        'general': 'local-community-general',
        'ask-authority': 'local-community-authority',
        'announcements': 'local-community-announcements'
    };

    // Socket Initialization for Chat
    useEffect(() => {
        const newSocket = io(`${import.meta.env.VITE_API_URL}`);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Authority connected to Chat Socket');
            newSocket.emit('joinRoom', 'local-community-general');
            newSocket.emit('joinRoom', 'local-community-authority');
            newSocket.emit('joinRoom', 'local-community-announcements');
        });

        newSocket.on('receiveMessage', (msg) => {
            setMessages(prev => {
                const channelMsgs = prev[msg.channel] || [];
                // Check if message already exists
                if (channelMsgs.find(m => m._id === msg._id)) return prev;
                return {
                    ...prev,
                    [msg.channel]: [...channelMsgs, msg]
                };
            });
            setTimeout(() => {
                if (chatContainerRef.current) {
                    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                }
            }, 100);
        });

        newSocket.on('messageEdited', ({ _id, text, channel, isEdited }) => {
            setMessages(prev => ({
                ...prev,
                [channel]: (prev[channel] || []).map(m => 
                    m._id === _id ? { ...m, text, isEdited: true } : m
                )
            }));
        });

        newSocket.on('messageDeleted', ({ _id, channel }) => {
            setMessages(prev => ({
                ...prev,
                [channel]: (prev[channel] || []).filter(m => m._id !== _id)
            }));
        });

        newSocket.on('roomData', ({ room, onlineCount }) => {
            const channelMap = {
                'local-community-general': 'general',
                'local-community-authority': 'ask-authority',
                'local-community-announcements': 'announcements'
            };
            const mappedRoom = channelMap[room];
            if (mappedRoom) {
                setOnlineCounts(prev => ({ ...prev, [mappedRoom]: onlineCount }));
            }
        });

        return () => newSocket.disconnect();
    }, []);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop - clientHeight > 150) {
            setShowScrollButton(true);
        } else {
            setShowScrollButton(false);
        }
    };

    // Auto-scroll when new messages arrive (if already at bottom)
    useEffect(() => {
        if (!showScrollButton) {
            scrollToBottom();
        }
    }, [messages]);

    const loadHistory = async (channel) => {
        const ch = channel || activeChannel;
        setLoadingHistory(true);
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/message/${ch}`, {
                withCredentials: true
            });
            setMessages(prev => ({
                ...prev,
                [ch]: data.data || []
            }));
            setTimeout(() => {
                if (chatContainerRef.current) {
                    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                }
            }, 100);
        } catch (error) {
            console.error("Failed to load chat history", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Load message history when switching channels
    useEffect(() => {
        loadHistory(activeChannel);
    }, [activeChannel]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        const messageData = {
            room: roomMap[activeChannel],
            message: {
                id: Date.now().toString(),
                senderId: user?._id,
                sender: user?.name || user?.email || 'Authority Member',
                senderName: user?.name || user?.email || 'Authority Member',
                role: user?.role || 'Authority',
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
    };

    const handleEditMessage = async (msgId, newText) => {
        if (!newText.trim()) return;
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/v1/message/${msgId}`, 
                { text: newText },
                { withCredentials: true }
            );
            // Broadcast via socket
            if (socket) {
                socket.emit('editMessage', {
                    room: roomMap[activeChannel],
                    messageId: msgId,
                    newText: newText.trim(),
                    channel: activeChannel
                });
            }
            setEditingMsg(null);
            toast.success('Message edited');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to edit message');
        }
    };

    const handleDeleteMessage = async (msgId) => {
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/message/${msgId}`, {
                withCredentials: true
            });
            // Broadcast via socket
            if (socket) {
                socket.emit('deleteMessage', {
                    room: roomMap[activeChannel],
                    messageId: msgId,
                    channel: activeChannel
                });
            }
            toast.success('Message deleted');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete message');
        }
    };

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-white">
            
            {/* Sidebar Channels */}
            <div className="w-64 border-r border-slate-200 bg-slate-50 flex flex-col">
                <div className="p-4 border-b border-slate-200">
                    <h2 className="font-black text-slate-800 text-lg">Community Chat</h2>
                    <p className="text-xs text-slate-500 font-medium">Monitor & Respond</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <button 
                        onClick={() => setActiveChannel('ask-authority')}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-bold ${
                            activeChannel === 'ask-authority' 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <ShieldAlert size={18} className={activeChannel === 'ask-authority' ? 'text-indigo-200' : 'text-slate-400'} />
                            <span>Ask Authority</span>
                        </div>
                        <span className="text-xs bg-black/10 px-2 py-0.5 rounded-full">{onlineCounts['ask-authority'] || 0}</span>
                    </button>
                    
                    <button 
                        onClick={() => setActiveChannel('general')}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-bold ${
                            activeChannel === 'general' 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Hash size={18} className={activeChannel === 'general' ? 'text-indigo-200' : 'text-slate-400'} />
                            <span>General Chat</span>
                        </div>
                        <span className="text-xs bg-black/10 px-2 py-0.5 rounded-full">{onlineCounts['general'] || 0}</span>
                    </button>

                    <button 
                        onClick={() => setActiveChannel('announcements')}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-bold ${
                            activeChannel === 'announcements' 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <ShieldAlert size={18} className={activeChannel === 'announcements' ? 'text-indigo-200' : 'text-slate-400'} />
                            <span>Announcements</span>
                        </div>
                        <span className="text-xs bg-black/10 px-2 py-0.5 rounded-full">{onlineCounts['announcements'] || 0}</span>
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col relative bg-slate-50/50">
                
                {/* Chat Header */}
                <div className="h-16 border-b border-slate-200 bg-white flex items-center px-6 justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                            {activeChannel === 'ask-authority' ? <ShieldAlert size={20} /> : activeChannel === 'announcements' ? <ShieldAlert size={20} /> : <Hash size={20} />}
                        </div>
                        <div>
                            <h2 className="font-black text-slate-800 capitalize">
                                {activeChannel === 'ask-authority' ? 'Ask Authority' : activeChannel === 'announcements' ? 'Announcements' : 'General Chat'}
                            </h2>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                {onlineCounts[activeChannel] || 0} Citizens Online
                            </p>
                        </div>
                    </div>
                </div>

                {/* Messages List */}
                <div 
                    className="flex-1 overflow-y-auto p-6 relative" 
                    ref={chatContainerRef}
                    onScroll={handleScroll}
                >
                    <div className="space-y-6">
                        {(messages[activeChannel] || []).map((msg, index) => {
                            const isMe = msg.senderId === user?._id;
                            const isAdmin = user?.role === 'Admin';
                            const isAuthority = msg.role === 'Authority' || msg.role === 'Admin';
                            const canEdit = isMe;
                            const canDelete = isMe || isAdmin;
                            const isCurrentlyEditing = editingMsg?._id === msg._id;
                            
                            return (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={msg._id || index}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                        <div className="flex items-center gap-2 mb-1 px-1">
                                            <span className="text-xs font-bold text-slate-500">
                                                {isMe ? 'You' : (msg.senderName || msg.sender)}
                                            </span>
                                            {isAuthority && (
                                                <span className="flex items-center text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-black uppercase">
                                                    <ShieldAlert size={10} className="mr-1" /> Official
                                                </span>
                                            )}
                                            <span className="text-[10px] text-slate-400">
                                                {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                            {msg.isEdited && (
                                                <span className="text-[10px] text-slate-400 italic">(edited)</span>
                                            )}
                                        </div>

                                        {msg.replyTo && (
                                            <div className={`text-xs p-2 rounded-lg mb-1 opacity-75 max-w-sm truncate ${
                                                isMe ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-600 border-l-2 border-indigo-400'
                                            }`}>
                                                <span className="font-bold">{msg.replyTo.sender}:</span> {msg.replyTo.text}
                                            </div>
                                        )}

                                        <div className={`px-4 py-2.5 rounded-2xl relative group ${
                                            isMe 
                                                ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md' 
                                                : isAuthority 
                                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-tl-sm shadow-sm'
                                                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                                        }`}>
                                            {isCurrentlyEditing ? (
                                                <div className="flex items-center gap-2 min-w-[200px]">
                                                    <input
                                                        type="text"
                                                        value={editingMsg.text}
                                                        onChange={(e) => setEditingMsg({ ...editingMsg, text: e.target.value })}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleEditMessage(msg._id, editingMsg.text);
                                                            if (e.key === 'Escape') setEditingMsg(null);
                                                        }}
                                                        autoFocus
                                                        className={`flex-1 bg-transparent outline-none text-[15px] ${isMe ? 'text-white placeholder-indigo-200' : 'text-slate-800'}`}
                                                    />
                                                    <button onClick={() => handleEditMessage(msg._id, editingMsg.text)} className={`p-1 rounded-full transition-colors ${isMe ? 'hover:bg-indigo-500' : 'hover:bg-slate-200'}`}>
                                                        <Check size={14} />
                                                    </button>
                                                    <button onClick={() => setEditingMsg(null)} className={`p-1 rounded-full transition-colors ${isMe ? 'hover:bg-indigo-500' : 'hover:bg-slate-200'}`}>
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <p className="text-[15px] leading-relaxed">{msg.text || msg.content}</p>
                                            )}
                                            
                                            {/* Action Buttons (Hover) */}
                                            {!isCurrentlyEditing && (
                                                <div className={`absolute ${isMe ? '-left-24' : '-right-24'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
                                                    {!isMe && (
                                                        <button 
                                                            onClick={() => setReplyingTo(msg)}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 bg-white rounded-full shadow-sm border border-slate-100 transition-colors"
                                                            title="Reply"
                                                        >
                                                            <Send size={13} className="rotate-180" />
                                                        </button>
                                                    )}
                                                    {canEdit && (
                                                        <button 
                                                            onClick={() => setEditingMsg({ _id: msg._id, text: msg.text || msg.content })}
                                                            className="p-2 text-slate-400 hover:text-amber-600 bg-white rounded-full shadow-sm border border-slate-100 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Pencil size={13} />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button 
                                                            onClick={() => handleDeleteMessage(msg._id)}
                                                            className="p-2 text-slate-400 hover:text-red-600 bg-white rounded-full shadow-sm border border-slate-100 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Scroll to bottom FAB */}
                    <AnimatePresence>
                        {showScrollButton && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                onClick={scrollToBottom}
                                className="absolute bottom-6 right-6 w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
                            >
                                <ChevronDown size={20} />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                    {/* Reply Preview */}
                    <AnimatePresence>
                        {replyingTo && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                            >
                                <div className="flex-1 truncate pr-4">
                                    <p className="text-xs font-bold text-indigo-600 mb-0.5">Replying to {replyingTo.senderName || replyingTo.sender}</p>
                                    <p className="text-sm text-slate-600 truncate">{replyingTo.text || replyingTo.content}</p>
                                </div>
                                <button onClick={() => setReplyingTo(null)} className="p-1 text-slate-400 hover:bg-slate-200 rounded-full">
                                    <X size={16} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSendMessage} className="flex gap-3 relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={activeChannel === 'ask-authority' ? "Respond officially to citizens..." : activeChannel === 'announcements' ? "Broadcast a city-wide announcement..." : "Join the conversation..."}
                            className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 rounded-2xl px-6 py-4 outline-none transition-all"
                        />
                        <button 
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-2xl px-6 flex items-center justify-center transition-colors shadow-md"
                        >
                            <Send size={20} className={newMessage.trim() ? "translate-x-0.5 -translate-y-0.5 transition-transform" : ""} />
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default AuthorityChat;
