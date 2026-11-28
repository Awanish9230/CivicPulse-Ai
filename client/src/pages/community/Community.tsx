import React, { useState, useEffect, useContext, useRef, type ChangeEvent, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Hash, Users, ShieldAlert, Megaphone, ChevronDown, Trophy } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';
import { io, Socket } from 'socket.io-client';
import { saveToOutbox } from '../../utils/db';
import { getDistanceFromLatLonInKm } from '../../utils/geoUtils';
import Banned from '../auth/Banned';
import Leaderboard from './Leaderboard';
import IssueCard, { IssueCardSkeleton } from './components/IssueCard';
import ChannelSidebar from './components/ChannelSidebar';
import ChatMessageList from './components/ChatMessageList';
import ChatComposer from './components/ChatComposer';
import type { Complaint } from '../../types';
import type { ChannelConfig, ChatMessage, EditingMessageState, GeoLocation } from './types';

const CHANNELS: ChannelConfig[] = [
    { id: 'issue', name: 'issue', icon: MapPin, desc: 'Local complaints within 5km' },
    { id: 'general', name: 'general', icon: Users, desc: 'General community chat' },
    { id: 'ask-authority', name: 'ask-authority', icon: ShieldAlert, desc: 'Direct chat with authorities' },
    { id: 'announcements', name: 'announcements', icon: Megaphone, desc: 'Official city updates & alerts' },
    { id: 'leaderboard', name: 'leaderboard', icon: Trophy, desc: 'Top citizens making a difference' }
];

const ROOM_MAP: Record<string, string> = {
    'general': 'local-community-general',
    'ask-authority': 'local-community-authority',
    'announcements': 'local-community-announcements'
};

const Community: React.FC = () => {
    const { user } = useContext(AuthContext);
    const [activeChannel, setActiveChannel] = useState<string>('issue');

    const [radius, setRadius] = useState<string>('10');
    const [isRadiusOpen, setIsRadiusOpen] = useState<boolean>(false);
    const [location, setLocation] = useState<GeoLocation | null>(null);
    const [locationDenied, setLocationDenied] = useState<boolean>(false);

    const [feed, setFeed] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [expandedUpdates, setExpandedUpdates] = useState<Record<string, boolean>>({});

    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
    const [newMessage, setNewMessage] = useState<string>('');
    const [onlineCounts, setOnlineCounts] = useState<Record<string, number>>({});
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
    const [editingMsg, setEditingMsg] = useState<EditingMessageState | null>(null);
    const [chatImage, setChatImage] = useState<File | null>(null);
    const [chatImagePreview, setChatImagePreview] = useState<string | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
    const [, setLoadingHistory] = useState<boolean>(false);
    const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
    const chatContainerRef = useRef<HTMLDivElement | null>(null);

    const fetchComplaints = async (lat?: number, lng?: number, rds?: string) => {
        try {
            setLoading(true);
            const params: Record<string, string | number> = {};
            if (lat && lng) {
                params.lat = lat;
                params.lng = lng;
            }
            if (rds && rds !== 'All') {
                params.radius = rds;
            }

            const { data } = await axios.get<{ data: Complaint[] }>(`${import.meta.env.VITE_API_URL}/api/v1/complaint/all`, {
                withCredentials: true,
                params
            });
            setFeed(data.data || []);
        } catch {
            toast.error("Failed to fetch community posts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const useFallbackArea = () => {
            const fallbackLoc: GeoLocation = { lat: 28.6139, lng: 77.2090 };
            setLocation(fallbackLoc);
            setLocationDenied(false);
            fetchComplaints(fallbackLoc.lat, fallbackLoc.lng, radius);
        };

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
                    console.warn("Location permission unavailable, loading Community automatically:", error);
                    useFallbackArea();
                },
                { timeout: 6000 }
            );
        } else {
            useFallbackArea();
        }
    }, [radius]);

    const handleResolve = async (id: string) => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/complaint/${id}/resolve`, {}, {
                withCredentials: true
            });
            toast.success("Complaint resolved and optimized!");
            fetchComplaints();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || "Failed to resolve complaint");
        }
    };

    useEffect(() => {
        if (activeChannel === 'issue') {
            setSocket(null);
            return;
        }

        const newSocket = io(`${import.meta.env.VITE_API_URL}`);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            newSocket.emit('joinRoom', 'local-community-general');
            newSocket.emit('joinRoom', 'local-community-authority');
            newSocket.emit('joinRoom', 'local-community-announcements');
        });

        newSocket.on('receiveMessage', (message: ChatMessage) => {
            if (radius !== 'All' && location && message.location?.coordinates) {
                const [msgLng, msgLat] = message.location.coordinates;
                const distance = getDistanceFromLatLonInKm(location.lat, location.lng, msgLat, msgLng);
                if (distance > parseInt(radius, 10)) {
                    return;
                }
            }

            setMessages((prev) => {
                const channelMsgs = prev[message.channel] || [];
                if (channelMsgs.find((m) => m._id === message._id || m.id === message.id)) return prev;
                return {
                    ...prev,
                    [message.channel]: [...channelMsgs, message]
                };
            });

            setTimeout(() => {
                if (chatContainerRef.current) {
                    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
                    if (scrollHeight - scrollTop - clientHeight < 200) {
                        chatContainerRef.current.scrollTop = scrollHeight;
                    }
                }
            }, 100);
        });

        newSocket.on('roomData', ({ room, onlineCount }: { room: string; onlineCount: number }) => {
            const channel = room === 'local-community-general'
                ? 'general'
                : room === 'local-community-authority'
                    ? 'ask-authority'
                    : 'announcements';
            setOnlineCounts((prev) => ({ ...prev, [channel]: onlineCount }));
        });

        newSocket.on('messageEdited', ({ _id, text, channel }: { _id: string; text: string; channel: string }) => {
            setMessages((prev) => ({
                ...prev,
                [channel]: (prev[channel] || []).map((m) =>
                    m._id === _id ? { ...m, text, isEdited: true } : m
                )
            }));
        });

        newSocket.on('messageDeleted', ({ _id, channel }: { _id: string; channel: string }) => {
            setMessages((prev) => ({
                ...prev,
                [channel]: (prev[channel] || []).filter((m) => m._id !== _id)
            }));
        });

        return () => {
            newSocket.disconnect();
            setSocket(null);
        };
    }, [radius, location, activeChannel]);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    const loadHistory = async (channel?: string) => {
        const ch = channel || activeChannel;
        if ((ch === 'general' || ch === 'ask-authority' || ch === 'announcements') && location && !locationDenied) {
            setLoadingHistory(true);
            try {
                const params: Record<string, string | number> = {
                    lat: location.lat,
                    lng: location.lng
                };
                if (radius && radius !== 'All') {
                    params.radius = radius;
                }

                const { data } = await axios.get<{ data: ChatMessage[] }>(`${import.meta.env.VITE_API_URL}/api/v1/message/${ch}`, {
                    withCredentials: true,
                    params
                });
                setMessages((prev) => ({
                    ...prev,
                    [ch]: data.data
                }));
            } catch (error: unknown) {
                console.error("Failed to load chat history", error);
            } finally {
                setLoadingHistory(false);
                setTimeout(scrollToBottom, 100);
            }
        }
    };

    useEffect(() => {
        loadHistory(activeChannel);
    }, [activeChannel, location, radius, locationDenied]);

    useEffect(() => {
        if (!socket) return;

        const handleSyncChat = async (e: Event) => {
            const customEvent = e as CustomEvent<{ payload: { message?: ChatMessage } }>;
            const payload = customEvent.detail.payload;

            if (payload.message && payload.message.type === 'Image_Offline') {
                try {
                    const res = await fetch(payload.message.text);
                    const blob = await res.blob();
                    const file = new File([blob], 'offline_image.jpg', { type: 'image/jpeg' });

                    const formData = new FormData();
                    formData.append('image', file);

                    const { data } = await axios.post<{ data: { imageUrl: string } }>(
                        `${import.meta.env.VITE_API_URL}/api/v1/message/upload-image`,
                        formData,
                        { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
                    );

                    payload.message.text = data.data.imageUrl;
                    payload.message.type = 'Image';
                } catch (err: unknown) {
                    console.error('Failed to upload offline image during sync', err);
                    return;
                }
            }

            socket.emit('sendMessage', payload);
        };

        window.addEventListener('sync-chat-message', handleSyncChat);
        return () => window.removeEventListener('sync-chat-message', handleSyncChat);
    }, [socket]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        setShowScrollButton(scrollHeight - scrollTop - clientHeight > 150);
    };

    useEffect(() => {
        if (!showScrollButton) {
            scrollToBottom();
        }
    }, [messages, activeChannel]);

    const handleUpvote = async (complaintId: string) => {
        if (!user) {
            toast.error("Please login to upvote");
            return;
        }

        setFeed((currentFeed) =>
            currentFeed.map((item) =>
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
        } catch {
            setFeed((currentFeed) =>
                currentFeed.map((item) =>
                    item._id === complaintId
                        ? { ...item, supportCount: Math.max(0, (item.supportCount || 1) - 1) }
                        : item
                )
            );
            toast.error("Failed to record footprint");
        }
    };

    const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image must be less than 5MB");
                return;
            }
            setChatImage(file);
            setChatImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if ((!newMessage.trim() && !chatImage) || !user) return;

        let finalType = 'Text';
        let finalText = newMessage.trim();

        if (chatImage) {
            if (!navigator.onLine) {
                const getBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = (error) => reject(error);
                });

                try {
                    finalText = await getBase64(chatImage);
                    finalType = 'Image_Offline';
                } catch {
                    toast.error("Failed to process image for offline storage.");
                    return;
                }
            } else {
                setIsUploadingImage(true);
                try {
                    const formData = new FormData();
                    formData.append('image', chatImage);

                    const { data } = await axios.post<{ data: { imageUrl: string } }>(
                        `${import.meta.env.VITE_API_URL}/api/v1/message/upload-image`,
                        formData,
                        { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
                    );

                    finalText = data.data.imageUrl;
                    finalType = 'Image';
                } catch {
                    toast.error("Failed to upload image");
                    setIsUploadingImage(false);
                    return;
                }
                setIsUploadingImage(false);
            }
        }

        const messageObj: ChatMessage = {
            id: Date.now().toString(),
            senderId: user._id,
            sender: user.role === 'Authority' ? (user.name || 'Authority') : (user.anonymousId || user.name || 'Anonymous Citizen'),
            role: user.role,
            text: finalText,
            type: finalType,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            channel: activeChannel,
            ...(location && { lat: location.lat, lng: location.lng }),
            replyTo: replyingTo ? {
                sender: replyingTo.sender,
                text: replyingTo.type === 'Image' ? '[Image]' : replyingTo.text
            } : null
        };

        const messageData = {
            room: ROOM_MAP[activeChannel],
            message: messageObj
        };

        if (!navigator.onLine) {
            messageData.message.isPending = true;
            await saveToOutbox('chat', messageData);
            setMessages((prev) => ({
                ...prev,
                [activeChannel]: [...(prev[activeChannel] || []), messageData.message]
            }));
            toast.success("Saved offline. Will send when reconnected.", { id: 'offline-chat' });
        } else if (socket) {
            socket.emit('sendMessage', messageData);
        }
        setNewMessage('');
        setReplyingTo(null);
        setChatImage(null);
        setChatImagePreview(null);
        setTimeout(scrollToBottom, 100);
    };

    const handleEditMessage = async (msgId: string, newText: string) => {
        if (!newText.trim()) return;
        try {
            await axios.put(
                `${import.meta.env.VITE_API_URL}/api/v1/message/${msgId}`,
                { text: newText },
                { withCredentials: true }
            );
            if (socket) {
                socket.emit('editMessage', {
                    room: ROOM_MAP[activeChannel],
                    messageId: msgId,
                    newText: newText.trim(),
                    channel: activeChannel
                });
            }
            setEditingMsg(null);
            toast.success('Message edited');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Failed to edit message');
        }
    };

    const handleDeleteMessage = async (msgId: string) => {
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/message/${msgId}`, {
                withCredentials: true
            });
            if (socket) {
                socket.emit('deleteMessage', {
                    room: ROOM_MAP[activeChannel],
                    messageId: msgId,
                    channel: activeChannel
                });
            }
            toast.success('Message deleted');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Failed to delete message');
        }
    };

    if (user?.restrictedFeatures?.includes('community')) {
        return <Banned feature="Community" />;
    }

    const activeChannelMeta = CHANNELS.find((c) => c.id === activeChannel);
    const ActiveIcon = activeChannelMeta?.icon || Hash;

    return (
        <div className="flex h-[calc(100dvh-10rem)] md:h-[calc(100vh-7rem)] max-w-6xl mx-auto bg-white/70 backdrop-blur-2xl rounded-2xl md:rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden relative z-10">
            <ChannelSidebar
                channels={CHANNELS}
                activeChannel={activeChannel}
                onSelectChannel={setActiveChannel}
                trendingFeed={feed}
            />

            <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30 relative">
                <div className="h-[72px] border-b border-white bg-white/40 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 shrink-0 shadow-[0_2px_10px_rgb(0,0,0,0.02)] gap-2">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                        <div className="p-1.5 md:p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-primary shrink-0">
                            <ActiveIcon size={20} className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <h2 className="font-black text-slate-800 text-lg md:text-xl tracking-tight capitalize truncate shrink-0">
                            {activeChannelMeta?.name || activeChannel}
                        </h2>
                        <div className="ml-2 pl-2 md:ml-5 md:pl-5 border-l border-slate-200 text-xs md:text-sm font-medium text-slate-500 hidden sm:block truncate">
                            {activeChannelMeta?.desc}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 shrink-0">
                        <div className="relative">
                            <button
                                onClick={() => !locationDenied && setIsRadiusOpen(!isRadiusOpen)}
                                disabled={locationDenied}
                                className={`flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-bold text-slate-700 outline-none transition-all disabled:opacity-50 ${
                                    isRadiusOpen ? 'ring-2 ring-primary/20 border-primary shadow-sm' : 'hover:bg-slate-50'
                                }`}
                            >
                                <span className="whitespace-nowrap">
                                    {radius === 'All' ? 'All Range' : `Within ${radius} km`}
                                </span>
                                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isRadiusOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isRadiusOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsRadiusOpen(false)} />
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

                        {(activeChannel === 'general' || activeChannel === 'ask-authority' || activeChannel === 'announcements') && (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 md:gap-2 bg-green-500/10 text-green-600 px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold shrink-0">
                                    <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-green-500"></span>
                                    </span>
                                    <span className="hidden sm:inline">{onlineCounts[activeChannel] || 1} online</span>
                                    <span className="sm:hidden">{onlineCounts[activeChannel] || 1}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="md:hidden flex justify-between gap-1 p-1.5 bg-white/60 backdrop-blur-md border-b border-white shadow-sm w-full relative">
                    {CHANNELS.map((channel) => {
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
                                    {channel.id === 'general'
                                        ? 'Chat'
                                        : channel.id === 'ask-authority'
                                            ? 'Authority'
                                            : channel.id === 'announcements'
                                                ? 'Alerts'
                                                : channel.id === 'leaderboard'
                                                    ? 'Rank'
                                                    : 'Local'}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div
                    className="flex-1 overflow-y-scroll bg-[#F8FAFC]/50 relative"
                    ref={chatContainerRef}
                    onScroll={handleScroll}
                >
                    <AnimatePresence mode="wait">
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
                                    />
                                ))}
                            </motion.div>
                        ) : activeChannel === 'leaderboard' ? (
                            <motion.div
                                key="leaderboard"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="w-full pb-8"
                            >
                                <Leaderboard />
                            </motion.div>
                        ) : (
                            <ChatMessageList
                                activeChannel={activeChannel}
                                messages={messages[activeChannel] || []}
                                user={user}
                                editingMsg={editingMsg}
                                setEditingMsg={setEditingMsg}
                                setReplyingTo={setReplyingTo}
                                onEditMessage={handleEditMessage}
                                onDeleteMessage={handleDeleteMessage}
                            />
                        )}
                    </AnimatePresence>
                </div>

                <AnimatePresence>
                    {showScrollButton && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 10 }}
                            onClick={scrollToBottom}
                            className="absolute bottom-[90px] right-6 w-10 h-10 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
                        >
                            <ChevronDown size={20} />
                        </motion.button>
                    )}
                </AnimatePresence>

                {['general', 'ask-authority', 'announcements'].includes(activeChannel) && (
                    <ChatComposer
                        activeChannel={activeChannel}
                        user={user}
                        newMessage={newMessage}
                        setNewMessage={setNewMessage}
                        replyingTo={replyingTo}
                        setReplyingTo={setReplyingTo}
                        chatImage={chatImage}
                        chatImagePreview={chatImagePreview}
                        isUploadingImage={isUploadingImage}
                        onImageSelect={handleImageSelect}
                        onClearImage={() => {
                            setChatImage(null);
                            setChatImagePreview(null);
                        }}
                        onSubmit={handleSendMessage}
                    />
                )}
            </div>
        </div>
    );
};

export default Community;
