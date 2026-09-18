import React, { useState, useEffect } from 'react';
import { Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config/api';

// initial feed moved inside component

const LiveActivityFeed = () => {
    const [feed, setFeed] = useState([
        { id: 1, type: 'info', text: 'Live stream connected. Waiting for activities...', time: 'Just now', color: 'bg-indigo-500' }
    ]);

    useEffect(() => {
        // Connect to public socket namespace or main depending on setup
        const socket = io(SOCKET_URL);

        socket.on('new_complaint', (data) => {
            const newEvent = { 
                id: Date.now(), 
                type: 'submitted', 
                text: `New complaint submitted: ${data.title}`, 
                time: 'Just now', 
                color: 'bg-blue-500' 
            };
            setFeed(prev => [newEvent, ...prev.slice(0, 4)]);
        });

        socket.on('status_updated', (data) => {
            let color = 'bg-purple-500';
            if (data.status === 'Resolved') color = 'bg-emerald-500';
            if (data.status === 'In Progress') color = 'bg-amber-500';

            const newEvent = { 
                id: Date.now(), 
                type: 'status', 
                text: `Complaint status updated to ${data.status}`, 
                time: 'Just now', 
                color 
            };
            setFeed(prev => [newEvent, ...prev.slice(0, 4)]);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    return (
        <section className="py-20">
            <div className="bg-slate-900 rounded-[40px] p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
                
                <div className="flex flex-col md:flex-row gap-12 relative z-10">
                    <div className="w-full md:w-1/3">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 text-red-400 font-bold text-sm mb-6 border border-red-500/20">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            Live Socket.IO Stream
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Platform Pulse</h2>
                        <p className="text-slate-400 leading-relaxed">
                            Watch the platform operate in real-time. Every submission, AI verification, and resolution is streamed live.
                        </p>
                    </div>

                    <div className="w-full md:w-2/3">
                        <div className="space-y-4">
                            <AnimatePresence>
                                {feed.map(item => (
                                    <motion.div 
                                        key={item.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="flex items-center p-4 bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50"
                                    >
                                        <div className={`w-3 h-3 rounded-full ${item.color} mr-4 shadow-[0_0_10px_rgba(255,255,255,0.2)]`} />
                                        <div className="flex-1 font-medium text-slate-200">{item.text}</div>
                                        <div className="text-sm font-bold text-slate-500">{item.time}</div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LiveActivityFeed;
