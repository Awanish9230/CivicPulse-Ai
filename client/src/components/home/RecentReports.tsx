import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowUpRight, Clock, MapPin, MessageSquare, FileText, Eye } from 'lucide-react';
import ImageCarousel from '../common/ImageCarousel';
import EmptyState from '../common/EmptyState';
import { getPriorityColor, getDepartmentForCategory } from '../../utils/complaintUtils';
import { getTimeAgo } from '../../utils/dateUtils';
import {
    formatAddressShort,
    getCategoryMeta,
    getStatusBadgeClass,
    PublicRecentReport
} from './homeData';

interface RecentReportsProps {
    reports: PublicRecentReport[];
    loading: boolean;
    searchQuery: string;
    onSelectReport: (report: PublicRecentReport) => void;
}

const RecentReports: React.FC<RecentReportsProps> = ({
    reports,
    loading,
    searchQuery,
    onSelectReport
}) => {
    const navigate = useNavigate();

    const filteredReports = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return reports.slice(0, 4);
        return reports
            .filter((r) => {
                const hay = `${r.category} ${r.description} ${r.status} ${r.address?.ward || ''} ${r.address?.district || ''} ${r.address?.fullAddress || ''}`.toLowerCase();
                return hay.includes(query);
            })
            .slice(0, 4);
    }, [reports, searchQuery]);

    return (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5 sm:p-7 flex flex-col h-full">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
                        Verified Public Ledger
                    </p>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Recent Civic Reports
                    </h2>
                </div>
                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 group"
                >
                    Explore All
                    <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, idx) => (
                        <div
                            key={idx}
                            className="rounded-2xl border border-slate-200/80 overflow-hidden bg-slate-50/40 flex flex-col"
                        >
                            <div className="h-40 skeleton-box w-full" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 w-2/3 rounded skeleton-box" />
                                <div className="h-3 w-full rounded skeleton-box" />
                                <div className="h-3 w-1/2 rounded skeleton-box" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredReports.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title={searchQuery ? 'No matching reports found' : 'No civic reports filed yet'}
                    description={
                        searchQuery
                            ? 'Try a different keyword, category, or neighborhood name.'
                            : 'Submitted reports will appear here automatically with live verification status.'
                    }
                    actionLabel={searchQuery ? undefined : 'Submit First Report'}
                    onAction={searchQuery ? undefined : () => navigate('/complaints')}
                    containerClassName="py-14 text-center flex-1 flex flex-col justify-center"
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                    {filteredReports.map((report) => {
                        const images =
                            report.imageUrls && report.imageUrls.length > 0
                                ? report.imageUrls
                                : report.imageUrl
                                    ? [report.imageUrl]
                                    : [];
                        const meta = getCategoryMeta(report.category);
                        const CategoryIcon = meta.icon;
                        const dept = getDepartmentForCategory(report.category);

                        return (
                            <article
                                key={report._id}
                                onClick={() => onSelectReport(report)}
                                className="group rounded-2xl border border-slate-200/90 bg-white hover:border-indigo-300/90 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
                            >
                                <div className="relative h-40 bg-slate-50 border-b border-slate-100 shrink-0 overflow-hidden">
                                    {images.length > 0 ? (
                                        <div className="w-full h-full group-hover:scale-105 transition-transform duration-500">
                                            <ImageCarousel images={images} />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-50 via-white to-slate-100/70 px-4 text-center">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${meta.iconBgClass}`}>
                                                <CategoryIcon size={24} />
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-500">
                                                {dept ? `${dept} Dept.` : report.category}
                                            </span>
                                        </div>
                                    )}

                                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                                        <span
                                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-white/95 backdrop-blur-xs ${getStatusBadgeClass(
                                                report.status
                                            )}`}
                                        >
                                            {report.status}
                                        </span>
                                        {report.priority && (
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityColor(
                                                    report.priority,
                                                    true
                                                )}`}
                                            >
                                                {report.priority}
                                            </span>
                                        )}
                                    </div>

                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-xs border border-slate-200 text-[11px] font-bold text-indigo-700 shadow-xs">
                                        <Eye size={12} /> Inspect
                                    </span>
                                </div>

                                <div className="p-4 flex flex-col flex-1 gap-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${meta.badgeClass}`}>
                                            {report.category}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                                            <Clock size={12} /> {getTimeAgo(report.createdAt) || 'Just now'}
                                        </span>
                                    </div>

                                    <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-950 line-clamp-2 leading-snug transition-colors">
                                        {report.description}
                                    </p>

                                    <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500">
                                        <span className="inline-flex items-center gap-1 truncate max-w-[145px]">
                                            <MapPin size={13} className="shrink-0 text-slate-400" />
                                            <span className="truncate">{formatAddressShort(report.address)}</span>
                                        </span>

                                        <div className="flex items-center gap-3 shrink-0 tabular-nums">
                                            <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                                                <ArrowUp size={13} className="text-indigo-600" />
                                                {report.supportCount ?? 1}
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                                                <MessageSquare size={13} />
                                                {report.replyCount ?? 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default RecentReports;
