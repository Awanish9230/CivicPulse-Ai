import React from 'react';
import { motion } from 'framer-motion';
import { Hash, ShieldAlert, BadgeCheck, X, Pencil, Trash2, Check } from 'lucide-react';
import type { User } from '../../../types';
import type { ChatMessage, EditingMessageState } from '../types';

interface ChatMessageListProps {
    activeChannel: string;
    messages: ChatMessage[];
    user: User | null | undefined;
    editingMsg: EditingMessageState | null;
    setEditingMsg: React.Dispatch<React.SetStateAction<EditingMessageState | null>>;
    setReplyingTo: React.Dispatch<React.SetStateAction<ChatMessage | null>>;
    onEditMessage: (msgId: string, newText: string) => void;
    onDeleteMessage: (msgId: string) => void;
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({
    activeChannel,
    messages,
    user,
    editingMsg,
    setEditingMsg,
    setReplyingTo,
    onEditMessage,
    onDeleteMessage
}) => {
    const renderMessageContent = (text: string, type?: string) => {
        if (type === 'Image') {
            return (
                <div className="rounded-xl overflow-hidden mt-1 cursor-pointer" onClick={() => window.open(text, '_blank')}>
                    <img src={text} alt="Chat attachment" className="max-w-[200px] max-h-[200px] object-cover hover:opacity-90 transition-opacity" />
                </div>
            );
        }
        const imgRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))/i;
        if (imgRegex.test(text)) {
            const parts = text.split(imgRegex);
            return parts.map((part, i) => {
                if (imgRegex.test(part)) {
                    return <img key={i} src={part} alt="attachment" className="mt-2 rounded-lg max-w-full h-32 object-cover border border-border/50" />;
                }
                if (activeChannel === 'ask-authority' && part.includes('@')) {
                    return (
                        <span key={i}>
                            {part.split(/(@\w+)/g).map((p, j) =>
                                p.startsWith('@')
                                    ? <span key={j} className="text-blue-500 font-bold bg-blue-500/10 px-1 rounded">{p}</span>
                                    : p
                            )}
                        </span>
                    );
                }
                return <span key={i}>{part}</span>;
            });
        }

        if (activeChannel === 'ask-authority' && text.includes('@')) {
            return (
                <span>
                    {text.split(/(@\w+)/g).map((part, i) =>
                        part.startsWith('@')
                            ? <span key={i} className="text-blue-500 font-bold bg-blue-500/10 px-1 rounded">{part}</span>
                            : part
                    )}
                </span>
            );
        }

        return text;
    };

    return (
        <motion.div
            key={activeChannel}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col min-h-full justify-end p-6"
        >
            <div className="space-y-6">
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

                {messages.map((msg) => {
                    const isMe = msg.senderId === user?._id || msg.sender === (user?.anonymousId || 'Anonymous Citizen');
                    const isAuthority = msg.role === 'Authority';
                    const isAdmin = user?.role === 'Admin';
                    const canEdit = isMe;
                    const canDelete = isMe || isAdmin;
                    const msgId = msg._id || msg.id || '';
                    const isCurrentlyEditing = editingMsg && editingMsg._id === msgId;

                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            key={msgId}
                            className={`flex gap-4 group ${isMe ? 'flex-row-reverse text-right' : ''}`}
                        >
                            <div
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-1 shadow-sm border ${
                                    isAuthority
                                        ? 'bg-gradient-to-br from-yellow-400 to-amber-500 border-amber-300 text-white shadow-amber-500/30'
                                        : 'bg-white border-slate-100 text-slate-500'
                                }`}
                            >
                                {isAuthority ? (
                                    <ShieldAlert size={18} />
                                ) : (
                                    <span className="font-bold text-sm">{(msg.sender || '??').substring(0, 2).toUpperCase()}</span>
                                )}
                            </div>

                            <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className="flex items-center gap-2 mb-1 px-1">
                                    <span className={`font-bold text-sm flex items-center gap-1 ${isAuthority ? 'text-yellow-600' : 'text-text'}`}>
                                        {msg.sender}
                                        {isAuthority && <BadgeCheck size={14} className="text-yellow-500" />}
                                    </span>
                                    <span className="text-[10px] text-text/40">{msg.timestamp}</span>
                                    {msg.isEdited && (
                                        <span className="text-[10px] text-text/30 italic">(edited)</span>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1 w-full">
                                    {msg.replyTo && (
                                        <div
                                            className={`text-xs p-2 rounded-lg opacity-70 border-l-2 ${
                                                isMe ? 'bg-black/10 border-white text-white/80 text-right' : 'bg-surface border-primary text-text/60 text-left'
                                            }`}
                                        >
                                            <div className="font-bold mb-0.5">{msg.replyTo.sender}</div>
                                            <div className="line-clamp-1">{msg.replyTo.text}</div>
                                        </div>
                                    )}

                                    <div
                                        className={`px-4 py-3 rounded-2xl text-sm break-words flex flex-col shadow-sm border relative ${
                                            isMe
                                                ? 'bg-gradient-to-r from-primary to-blue-600 text-white rounded-tr-sm border-blue-500/50 shadow-primary/20'
                                                : isAuthority
                                                    ? 'bg-yellow-50/90 backdrop-blur-md border-yellow-200 text-yellow-900 rounded-tl-sm shadow-amber-500/10'
                                                    : 'bg-white/90 backdrop-blur-md border-white text-slate-700 rounded-tl-sm shadow-[0_4px_20px_rgb(0,0,0,0.03)]'
                                        }`}
                                    >
                                        {isCurrentlyEditing ? (
                                            <div className="flex items-center gap-2 min-w-[180px]">
                                                <input
                                                    type="text"
                                                    value={editingMsg.text}
                                                    onChange={(e) => setEditingMsg({ ...editingMsg, text: e.target.value })}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') onEditMessage(msgId, editingMsg.text);
                                                        if (e.key === 'Escape') setEditingMsg(null);
                                                    }}
                                                    autoFocus
                                                    className={`flex-1 bg-transparent outline-none text-sm ${isMe ? 'text-white placeholder-white/50' : 'text-slate-800'}`}
                                                />
                                                <button onClick={() => onEditMessage(msgId, editingMsg.text)} className="p-1 rounded-full hover:bg-black/10 transition-colors">
                                                    <Check size={13} />
                                                </button>
                                                <button onClick={() => setEditingMsg(null)} className="p-1 rounded-full hover:bg-black/10 transition-colors">
                                                    <X size={13} />
                                                </button>
                                            </div>
                                        ) : (
                                            renderMessageContent(msg.text, msg.type)
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!isMe && (
                                        <button
                                            onClick={() => setReplyingTo(msg)}
                                            className="text-[10px] font-bold text-text/40 hover:text-primary transition-colors px-1.5 py-0.5 rounded hover:bg-primary/5"
                                        >
                                            Reply
                                        </button>
                                    )}
                                    {canEdit && !isCurrentlyEditing && (
                                        <button
                                            onClick={() => setEditingMsg({ _id: msgId, text: msg.text })}
                                            className="text-[10px] font-bold text-text/40 hover:text-amber-600 transition-colors px-1.5 py-0.5 rounded hover:bg-amber-50 flex items-center gap-0.5"
                                        >
                                            <Pencil size={10} /> Edit
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button
                                            onClick={() => onDeleteMessage(msgId)}
                                            className="text-[10px] font-bold text-text/40 hover:text-red-600 transition-colors px-1.5 py-0.5 rounded hover:bg-red-50 flex items-center gap-0.5"
                                        >
                                            <Trash2 size={10} /> Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
};

export default ChatMessageList;
