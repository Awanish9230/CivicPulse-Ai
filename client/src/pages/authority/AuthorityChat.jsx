import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, Send, Users, ShieldAlert, X } from 'lucide-react';
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
    const chatContainerRef = useRef(null);

    // Socket Initialization for Chat
    useEffect(() => {
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Authority connected to Chat Socket');
            newSocket.emit('joinRoom', 'local-community-general');
            newSocket.emit('joinRoom', 'local-community-authority');
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

        newSocket.on('roomData', ({ room, onlineCount }) => {
            const channelMap = {
                'local-community-general': 'general',
                'local-community-authority': 'ask-authority'
            };
            const mappedRoom = channelMap[room];
            if (mappedRoom) {
                setOnlineCounts(prev => ({ ...prev, [mappedRoom]: onlineCount }));
            }
        });

        return () => newSocket.disconnect();
    }, []);

    // Load message history when switching channels
    useEffect(() => {
        const loadHistory = async () => {
            if (messages[activeChannel]?.length > 0) return;
            try {
                const { data } = await axios.get(`http://localhost:5000/api/v1/messages/${activeChannel}`, {
                    withCredentials: true
                });
                setMessages(prev => ({
                    ...prev,
                    [activeChannel]: data.data || []
                }));
                setTimeout(() => {
                    if (chatContainerRef.current) {
                        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                    }
                }, 100);
            } catch (error) {
                console.error("Failed to load chat history", error);
            }
        };
        loadHistory();
    }, [activeChannel]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        const messageData = {
            room: activeChannel === 'general' ? 'local-community-general' : 'local-community-authority',
            message: {
                id: Date.now().toString(),
                senderId: user?._id,
                sender: user?.name || user?.email || 'Authority Member',
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
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col relative bg-slate-50/50">
                
                {/* Chat Header */}
                <div className="h-16 border-b border-slate-200 bg-white flex items-center px-6 justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                            {activeChannel === 'ask-authority' ? <ShieldAlert size={20} /> : <Hash size={20} />}
                        </div>
                        <div>
                            <h2 className="font-black text-slate-800 capitalize">
                                {activeChannel === 'ask-authority' ? 'Ask Authority' : 'General Chat'}
                            </h2>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                {onlineCounts[activeChannel] || 0} Citizens Online
                            </p>
                        </div>
                    </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-6" ref={chatContainerRef}>
                    <div className="space-y-6">
                        {(messages[activeChannel] || []).map((msg, index) => {
                            const isMe = msg.senderId === user?._id;
                            const isAuthority = msg.role === 'Authority' || msg.role === 'Admin';
                            
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
                                                <span className="flex items-center text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-black uppercase">
                                                    <ShieldAlert size={10} className="mr-1" /> Official
                                                </span>
                                            )}
                                            <span className="text-[10px] text-slate-400">
                                                {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
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
                                                    ? 'bg-blue-50 border border-blue-200 text-blue-900 rounded-tl-sm shadow-sm'
                                                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                                        }`}>
                                            <p className="text-[15px] leading-relaxed">{msg.text || msg.content}</p>
                                            
                                            {/* Reply Button (Hover) */}
                                            {!isMe && (
                                                <button 
                                                    onClick={() => setReplyingTo(msg)}
                                                    className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-400 hover:text-indigo-600 bg-white rounded-full shadow-sm"
                                                >
                                                    <Send size={14} className="rotate-180" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
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
                            placeholder={activeChannel === 'ask-authority' ? "Respond officially to citizens..." : "Join the conversation..."}
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
