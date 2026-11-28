import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, ShieldAlert } from 'lucide-react';
import ImageCarousel from '../../../components/common/ImageCarousel';
import { getTimeAgo } from '../../../utils/dateUtils';
import type { Complaint, User } from '../../../types';

interface IssueCardProps {
    item: Complaint;
    index: number;
    user: User | null | undefined;
    expandedUpdates: Record<string, boolean>;
    setExpandedUpdates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    handleUpvote: (complaintId: string) => void;
    handleResolve: (id: string) => void;
}

export const IssueCardSkeleton: React.FC = () => (
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

const IssueCard = memo<IssueCardProps>(({
    item,
    index,
    user,
    expandedUpdates,
    setExpandedUpdates,
    handleUpvote,
    handleResolve
}) => {
    const images = item.imageUrls && item.imageUrls.length > 0
        ? item.imageUrls
        : item.imageUrl
            ? [item.imageUrl]
            : [];

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
                            <span
                                className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                    item.status === 'Resolved'
                                        ? 'bg-green-50 text-green-600 border border-green-200'
                                        : 'bg-orange-50 text-orange-600 border border-orange-200'
                                }`}
                            >
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

                    {item.officialReplies && item.officialReplies.length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
                            <div className="flex items-center justify-between mb-1">
                                <h5 className="text-[10px] font-bold text-text/60 uppercase tracking-wider">Authority Updates</h5>
                                {item.officialReplies.length > 1 && (
                                    <button
                                        onClick={() => setExpandedUpdates((prev) => ({ ...prev, [item._id]: !prev[item._id] }))}
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
                {images.length > 0 && (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 ml-1">
                        <ImageCarousel images={images} />
                    </div>
                )}
            </div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 to-transparent pointer-events-none -z-10" />
        </motion.div>
    );
});

export default IssueCard;
