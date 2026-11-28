import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    X,
    MapPin,
    Clock,
    ArrowUp,
    MessageSquare,
    Building2,
    ArrowUpRight,
    CheckCircle2
} from 'lucide-react';
import ImageCarousel from '../common/ImageCarousel';
import MergedReportBadge from '../common/MergedReportBadge';
import InlineLocationMap from '../common/InlineLocationMap';
import { getDepartmentForCategory, getPriorityColor } from '../../utils/complaintUtils';
import { getTimeAgo } from '../../utils/dateUtils';
import {
    formatAddressShort,
    getCategoryMeta,
    getStatusBadgeClass,
    PublicRecentReport
} from './homeData';

interface ReportDetailModalProps {
    report: PublicRecentReport | null;
    onClose: () => void;
}

const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ report, onClose }) => {
    useEffect(() => {
        if (!report) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [report, onClose]);

    if (!report) return null;

    const images =
        report.imageUrls && report.imageUrls.length > 0
            ? report.imageUrls
            : report.imageUrl
                ? [report.imageUrl]
                : [];
    const meta = getCategoryMeta(report.category);
    const CategoryIcon = meta.icon;
    const dept = getDepartmentForCategory(report.category) || 'Municipal Services';
    const hasCoords =
        Array.isArray(report.location?.coordinates) &&
        report.location.coordinates.length === 2 &&
        (report.location.coordinates[0] !== 0 || report.location.coordinates[1] !== 0);

    return (
        <div
            className="fixed inset-0 z-[500] bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.iconBgClass}`}>
                            <CategoryIcon size={18} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-black text-slate-900 truncate">
                                    {report.category} Issue
                                </h3>
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadgeClass(report.status)}`}>
                                    {report.status}
                                </span>
                                {report.priority && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityColor(report.priority, true)}`}>
                                        {report.priority}
                                    </span>
                                )}
                                <MergedReportBadge reportCount={report.reportCount} />
                            </div>
                            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <Building2 size={12} /> {dept}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close modal"
                        className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {images.length > 0 && (
                        <div className="h-60 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                            <ImageCarousel images={images} />
                        </div>
                    )}

                    <div className="space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Citizen Description
                        </p>
                        <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium">
                            {report.description}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                            <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                                <MapPin size={12} /> Area
                            </p>
                            <p className="text-xs font-bold text-slate-900 mt-1 truncate">
                                {formatAddressShort(report.address)}
                            </p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                            <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                                <ArrowUp size={12} className="text-indigo-600" /> Citizen Support
                            </p>
                            <p className="text-xs font-bold text-slate-900 mt-1 tabular-nums">
                                {report.supportCount ?? 1} citizen{(report.supportCount ?? 1) === 1 ? '' : 's'} backed
                            </p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                            <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                                <Clock size={12} /> Reported
                            </p>
                            <p className="text-xs font-bold text-slate-900 mt-1">
                                {getTimeAgo(report.createdAt) || new Date(report.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {hasCoords && report.location?.coordinates && (
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                Verified GPS Location
                            </p>
                            <InlineLocationMap
                                isOpen={true}
                                coordinates={report.location.coordinates}
                                heightClass="h-44"
                                wrapperClassName="rounded-2xl overflow-hidden border border-slate-200"
                            />
                        </div>
                    )}

                    {report.mergedReports && report.mergedReports.length > 0 && (
                        <div className="space-y-2.5 pt-2 border-t border-slate-100">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                                Auto-Merged Citizen Reports ({report.reportCount || report.mergedReports.length + 1} people total)
                            </p>
                            <div className="space-y-2">
                                {report.mergedReports.map((merged, idx) => (
                                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                                        <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-600">
                                            <span>Co-Reporter #{idx + 2}{typeof merged.distanceMeters === 'number' ? ` · ${merged.distanceMeters}m away` : ''}</span>
                                            {merged.mergedAt && (
                                                <span className="text-slate-400">{getTimeAgo(merged.mergedAt)}</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-700 leading-relaxed">{merged.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <MessageSquare size={12} /> Official Authority Updates ({report.officialReplies?.length ?? report.replyCount ?? 0})
                            </p>
                        </div>

                        {report.officialReplies && report.officialReplies.length > 0 ? (
                            <div className="space-y-2">
                                {report.officialReplies.map((reply, idx) => (
                                    <div key={idx} className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-800">
                                                <CheckCircle2 size={13} /> {reply.authorityName}
                                            </span>
                                            {reply.createdAt && (
                                                <span className="text-[11px] text-slate-400">
                                                    {getTimeAgo(reply.createdAt)}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-700 leading-relaxed">{reply.content}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                                No official municipal remarks posted on this ticket yet.
                            </p>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 rounded-b-3xl">
                    <span className="text-xs text-slate-500 font-medium">
                        Ticket ID: <span className="font-mono font-bold text-slate-700">#{report._id.slice(-6).toUpperCase()}</span>
                    </span>
                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                        >
                            Close
                        </button>
                        <Link
                            to="/dashboard"
                            onClick={onClose}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                        >
                            Track & Support in Radar <ArrowUpRight size={14} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportDetailModal;
