import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, MessageSquare, Send, ThumbsUp } from 'lucide-react';
import ImageCarousel from '../../../components/common/ImageCarousel';
import { getTimeAgo } from '../../../utils/dateUtils';
import type { Complaint } from '../../../types';

interface LiveIssueCardProps {
    complaint: Complaint;
    index: number;
    isReplyOpen: boolean;
    replyContent: string;
    replying: boolean;
    onUpvote: (id: string) => void;
    onToggleReply: (id: string) => void;
    onReplyContentChange: (value: string) => void;
    onSubmitReply: (id: string) => void;
}

const LiveIssueCard: React.FC<LiveIssueCardProps> = ({
    complaint: c,
    index,
    isReplyOpen,
    replyContent,
    replying,
    onUpvote,
    onToggleReply,
    onReplyContentChange,
    onSubmitReply
}) => {
    const images = c.imageUrls && c.imageUrls.length > 0
        ? c.imageUrls
        : c.imageUrl
            ? [c.imageUrl]
            : [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-5 shadow-sm border border-slate-200/60 group hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300 w-full flex flex-col"
        >
            <div className="w-full h-52 rounded-[2rem] overflow-hidden relative bg-slate-50 mb-5 shrink-0 border border-slate-100">
                {images.length > 0 ? (
                    <ImageCarousel images={images} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">
                        No Image Provided
                    </div>
                )}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md border border-white text-slate-800 shadow-sm px-4 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-2 tracking-wide uppercase z-10">
                    <div
                        className={`w-2 h-2 rounded-full animate-pulse ${
                            c.status === 'Resolved' || c.status === 'Closed'
                                ? 'bg-green-500'
                                : c.status === 'In Progress'
                                    ? 'bg-blue-500'
                                    : 'bg-orange-500'
                        }`}
                    />
                    {c.status}
                </div>
                <div
                    className={`absolute top-4 right-4 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm border ${
                        c.priority === 'Critical'
                            ? 'bg-red-500 text-white border-red-400'
                            : c.priority === 'High'
                                ? 'bg-orange-500 text-white border-orange-400'
                                : 'bg-white text-slate-700 border-white'
                    }`}
                >
                    {c.priority}
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-between px-1">
                <div>
                    <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                            {c.category}
                        </span>
                        <div className="flex items-center text-slate-400 text-xs font-bold">
                            <Clock size={12} className="mr-1.5" />
                            {getTimeAgo(c.createdAt)}
                        </div>
                    </div>
                    <h3 className="text-lg font-black text-slate-800 mb-2 leading-tight line-clamp-2">{c.description}</h3>
                    <div className="flex items-center text-slate-500 text-xs mb-4 font-bold line-clamp-1">
                        <MapPin size={14} className="mr-1.5 text-primary shrink-0" />
                        <span className="truncate">{c.address?.ward ? `${c.address.ward}, ${c.address.district}` : 'Location Attached'}</span>
                    </div>
                    {c.assignedTo && (
                        <div className="mb-2 bg-indigo-50/50 rounded-lg p-2 border border-indigo-100/50 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black shrink-0">
                                {(c.assignedTo.name || '??').substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex items-center text-xs">
                                <span className="text-slate-500 font-medium mr-1">Handling:</span>
                                <span className="font-bold text-indigo-700">{c.assignedTo.name}</span>
                                <span className="text-[9px] bg-indigo-100 text-indigo-600 px-1 py-0.5 rounded ml-1 font-bold">
                                    {c.assignedTo.authorityLevel}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <button
                            onClick={() => onUpvote(c._id)}
                            className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-bold text-xs bg-slate-50 hover:bg-primary/5 px-3 py-1.5 rounded-xl"
                        >
                            <ThumbsUp size={16} />
                            <span>{c.supportCount || 0}</span>
                        </button>

                        <button
                            onClick={() => onToggleReply(c._id)}
                            className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors font-bold text-xs bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:border-primary hover:shadow-md"
                        >
                            <MessageSquare size={16} />
                            <span>Add Update</span>
                        </button>
                    </div>

                    <AnimatePresence>
                        {isReplyOpen && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 pt-3 border-t border-border/30 overflow-hidden"
                            >
                                <div className="flex flex-col gap-2">
                                    <textarea
                                        value={replyContent}
                                        onChange={(e) => onReplyContentChange(e.target.value)}
                                        placeholder="Official update..."
                                        className="w-full bg-surface border border-border/50 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 min-h-[60px] resize-none"
                                    />
                                    <button
                                        onClick={() => onSubmitReply(c._id)}
                                        disabled={replying || !replyContent.trim()}
                                        className="bg-primary text-white px-3 py-2 rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors disabled:opacity-50 w-full flex items-center justify-center gap-2"
                                    >
                                        <Send size={12} />
                                        {replying ? 'Posting...' : 'Post Update'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

export default LiveIssueCard;
