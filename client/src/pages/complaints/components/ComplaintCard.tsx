import React from 'react';
import { motion } from 'framer-motion';
import {
    AlertTriangle, Clock, Map, ShieldAlert, Edit2, Trash2,
    ChevronDown, ChevronUp, MapPin, ThumbsUp, CheckCircle
} from 'lucide-react';
import ImageCarousel from '../../../components/common/ImageCarousel';
import MergedReportBadge from '../../../components/common/MergedReportBadge';
import StatusProgressDots from './StatusProgressDots';
import type { Complaint } from '../../../types';

interface ComplaintCardProps {
    complaint: Complaint;
    slaRisk: boolean;
    isExpandedReplies: boolean;
    onToggleReplies: (id: string) => void;
    onFeedback: (id: string, action: 'Accept' | 'Reject') => void;
    onEdit: (complaint: Complaint) => void;
    onDelete: (id: string) => void;
    onOpenMap: (complaint: Complaint) => void;
}

const ComplaintCard: React.FC<ComplaintCardProps> = ({
    complaint: c,
    slaRisk,
    isExpandedReplies,
    onToggleReplies,
    onFeedback,
    onEdit,
    onDelete,
    onOpenMap
}) => {
    const isResolved = c.status === 'Resolved' || c.status === 'Closed';
    const isRejected = c.status === 'Rejected';
    const images = c.imageUrls && c.imageUrls.length > 0
        ? c.imageUrls
        : c.imageUrl
            ? [c.imageUrl]
            : [];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="bg-surface rounded-[1rem] p-4 border border-border/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all flex flex-col group relative"
        >
            {slaRisk && <div className="absolute top-0 left-0 w-full h-1 bg-red-500 rounded-t-[1rem]" />}

            <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold text-text/40 font-mono tracking-wider">
                    #{c._id.slice(-6).toUpperCase()}
                </span>
                <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ml-auto ${
                        isResolved
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : isRejected
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                >
                    {c.status}
                </span>
                {slaRisk && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
            </div>

            {images.length > 0 && (
                <div className="mb-3 rounded-xl overflow-hidden border border-border/50 bg-slate-50 shrink-0 h-36 relative">
                    <ImageCarousel images={images} />
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] text-white font-bold flex items-center gap-1 z-10">
                        <MapPin size={10} /> {c.category}
                    </div>
                </div>
            )}

            <div className="mb-3 flex-1 min-h-[40px]">
                <p className="text-text/80 text-sm leading-relaxed line-clamp-2" title={c.description}>
                    {c.description}
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-4 text-[11px] font-bold text-text/50">
                <span className="flex items-center gap-1">
                    <Clock size={12} /> {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="flex items-center gap-1">
                    <ThumbsUp size={12} /> {c.supportCount || c.upvotes || 0}
                </span>
                <MergedReportBadge reportCount={c.reportCount} />
                {c.expectedCompletionDate && (
                    <span className="flex items-center gap-1 text-blue-600">
                        <CheckCircle size={12} /> ETA: {new Date(c.expectedCompletionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                )}
            </div>

            {c.assignedTo && (
                <div className="mb-4 bg-indigo-50 rounded-xl p-3 border border-indigo-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-xs font-black border border-indigo-300 shrink-0">
                        {(c.assignedTo.name || '??').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-0.5">Assigned Official</div>
                        <div className="text-sm font-bold text-indigo-700 flex items-center gap-1">
                            {c.assignedTo.name}
                            <span className="text-[10px] bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-600 font-bold ml-1">
                                {c.assignedTo.authorityLevel}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-4 bg-slate-50 rounded-xl p-3 border border-border/50">
                <StatusProgressDots status={c.status} isRejected={isRejected} slaRisk={slaRisk} />
            </div>

            {c.status === 'Resolved' && c.resolutionFeedback && c.resolutionFeedback.status === 'Pending' && (
                <div className="mb-4 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <h4 className="font-bold text-emerald-800 text-sm mb-2 flex items-center gap-2">
                        <CheckCircle size={16} /> Resolution Verification Needed
                    </h4>
                    <p className="text-xs text-emerald-700 mb-3">
                        The authority has marked this issue as resolved and provided proof. Please verify and accept or reject the resolution.
                    </p>

                    {c.resolutionImages && c.resolutionImages.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-3 snap-x no-scrollbar">
                            {c.resolutionImages.map((img, idx) => (
                                <img
                                    key={idx}
                                    src={img}
                                    alt={`Resolution ${idx + 1}`}
                                    className="w-24 h-24 object-cover rounded-lg shrink-0 snap-start border border-emerald-200"
                                />
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={() => onFeedback(c._id, 'Accept')}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors"
                        >
                            Accept Resolution
                        </button>
                        <button
                            onClick={() => onFeedback(c._id, 'Reject')}
                            className="flex-1 bg-surface hover:bg-rose-500/10 text-rose-600 border border-rose-200 font-bold py-2 px-3 rounded-lg text-xs transition-colors"
                        >
                            Reject & Reopen
                        </button>
                    </div>
                </div>
            )}

            {c.officialReplies && c.officialReplies.length > 0 && (
                <div className="mb-4">
                    <button
                        onClick={() => onToggleReplies(c._id)}
                        className="w-full flex items-center justify-between text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                    >
                        <span className="flex items-center gap-1.5">
                            <ShieldAlert size={14} /> Official Response ({c.officialReplies.length})
                        </span>
                        {isExpandedReplies ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {isExpandedReplies && (
                        <div className="mt-2 space-y-2 max-h-32 overflow-y-auto pr-1 no-scrollbar text-xs">
                            {c.officialReplies.map((reply, idx) => (
                                <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-border/50 text-text/60 leading-relaxed">
                                    <div className="flex justify-between items-center mb-1 font-bold text-[10px]">
                                        <span className="text-slate-800">{reply.authorityName}</span>
                                        <span className="text-text/40">{reply.createdAt ? new Date(reply.createdAt).toLocaleDateString() : ''}</span>
                                    </div>
                                    {reply.content}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="mt-auto flex items-center gap-2 pt-3 border-t border-border/50">
                {c.status !== 'Resolved' && c.status !== 'Closed' && (
                    <>
                        <button
                            onClick={() => onEdit({ ...c })}
                            className="h-8 px-2.5 bg-surface border border-border text-text/60 hover:text-blue-600 hover:border-blue-200 hover:bg-primary/10 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all"
                        >
                            <Edit2 size={12} /> Edit
                        </button>
                        <button
                            onClick={() => onDelete(c._id)}
                            className="h-8 px-2.5 bg-surface border border-border text-text/60 hover:text-red-600 hover:border-red-200 hover:bg-red-500/10 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all"
                        >
                            <Trash2 size={12} /> Delete
                        </button>
                    </>
                )}
                <button
                    onClick={() => onOpenMap(c)}
                    className="h-8 px-2.5 ml-auto bg-slate-100 text-text/60 hover:text-slate-800 hover:bg-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all"
                >
                    <Map size={12} /> Map
                </button>
            </div>
        </motion.div>
    );
};

export default ComplaintCard;
