import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, BarChart3, ClipboardList, CheckCircle2, Sparkles } from 'lucide-react';
import EmptyState from '../common/EmptyState';
import { getDepartmentForCategory } from '../../utils/complaintUtils';
import {
    DepartmentPerformanceEntry,
    getCategoryMeta,
    PublicPetitionItem
} from './homeData';

interface AuthorityPerformanceProps {
    leaderboard: DepartmentPerformanceEntry[];
    petitions: PublicPetitionItem[];
    loading: boolean;
}

const AuthorityPerformance: React.FC<AuthorityPerformanceProps> = ({
    leaderboard,
    petitions,
    loading
}) => {
    const navigate = useNavigate();

    return (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5 sm:p-7 flex flex-col">
                <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
                    <div>
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
                            <BarChart3 size={14} /> Open Performance Ledger
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            Resolution by Category & Department
                        </h2>
                    </div>
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 group"
                    >
                        Live Operations
                        <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 space-y-2.5">
                                <div className="h-4 w-1/3 rounded skeleton-box" />
                                <div className="h-2.5 w-full rounded skeleton-box" />
                            </div>
                        ))}
                    </div>
                ) : leaderboard.length === 0 ? (
                    <EmptyState
                        icon={BarChart3}
                        title="No department metrics recorded yet"
                        description="Category resolution rates populate automatically as municipal departments process incoming issues."
                        containerClassName="py-12 text-center"
                    />
                ) : (
                    <div className="space-y-3">
                        {leaderboard.map((entry) => {
                            const meta = getCategoryMeta(entry._id);
                            const Icon = meta.icon;
                            const deptName = getDepartmentForCategory(entry._id) || 'Municipal Services';
                            return (
                                <div
                                    key={entry._id}
                                    className="group p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all duration-200 space-y-2.5"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${meta.iconBgClass}`}>
                                                <Icon size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-bold text-slate-900 truncate">
                                                        {entry._id}
                                                    </h3>
                                                    <span className="hidden sm:inline-block text-[11px] font-medium text-slate-500 truncate">
                                                        · {deptName}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 tabular-nums">
                                                    {entry.resolved} resolved · {entry.inProgress} in progress · {entry.total} total
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 group-hover:border-emerald-200 text-xs font-black text-slate-900 tabular-nums transition-colors">
                                                <CheckCircle2 size={12} className="text-emerald-500" />
                                                {entry.resolutionRate}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: `${Math.min(100, Math.max(0, entry.resolutionRate))}%`,
                                                backgroundColor: meta.accentHex
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5 sm:p-7 flex flex-col">
                <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
                    <div>
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
                            <ClipboardList size={14} /> Collective Action
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            Active Civic Petitions
                        </h2>
                    </div>
                    <Link
                        to="/petitions"
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 group"
                    >
                        All Petitions
                        <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 space-y-2.5">
                                <div className="h-4 w-3/4 rounded skeleton-box" />
                                <div className="h-3 w-full rounded skeleton-box" />
                                <div className="h-2 w-full rounded skeleton-box" />
                            </div>
                        ))}
                    </div>
                ) : petitions.length === 0 ? (
                    <EmptyState
                        icon={Sparkles}
                        title="No active petitions right now"
                        description="Citizens can rally neighborhood signatures to escalate systemic civic improvements."
                        actionLabel="Launch a Petition"
                        onAction={() => navigate('/petitions')}
                        containerClassName="py-10 text-center"
                    />
                ) : (
                    <div className="space-y-3.5 flex-1">
                        {petitions.map((petition) => {
                            const progressPct = petition.targetSignatures > 0
                                ? Math.min(100, Math.round((petition.upvoteCount / petition.targetSignatures) * 100))
                                : 0;

                            return (
                                <Link
                                    key={petition._id}
                                    to="/petitions"
                                    className="group block p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-indigo-300/90 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 space-y-3"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-bold text-slate-700">
                                            {petition.category}
                                        </span>
                                        <span
                                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                                                petition.status === 'Escalated'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                            }`}
                                        >
                                            {petition.status}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 line-clamp-1 transition-colors">
                                            {petition.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                                            {petition.description}
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[11px] font-bold tabular-nums">
                                            <span className="text-slate-700">
                                                {petition.upvoteCount.toLocaleString()} signatures
                                            </span>
                                            <span className="text-slate-500">
                                                Goal: {petition.targetSignatures.toLocaleString()} ({progressPct}%)
                                            </span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-indigo-600 transition-all duration-700"
                                                style={{ width: `${progressPct}%` }}
                                            />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};

export default AuthorityPerformance;
