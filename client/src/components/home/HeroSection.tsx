import React, { useContext, useState } from 'react';
import { m } from 'framer-motion';
import {
    ArrowRight,
    CheckCircle2,
    Clock,
    FileCheck2,
    MapPin,
    ShieldCheck,
    Users,
    Search,
    X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import type { PublicPlatformStats } from './homeData';

interface HeroSectionProps {
    stats: PublicPlatformStats;
    loading: boolean;
    socketConnected: boolean;
    searchQuery: string;
    onSearchChange: (val: string) => void;
    matchCount: number;
    onJumpToMap: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({
    stats,
    loading,
    socketConnected,
    searchQuery,
    onSearchChange,
    matchCount,
    onJumpToMap
}) => {
    const auth = useContext(AuthContext);
    const user = auth?.user;
    const navigate = useNavigate();
    const [imageError, setImageError] = useState<boolean>(false);

    const handleReportClick = () => {
        if (user) {
            navigate('/complaints');
        } else {
            navigate('/auth?mode=register');
        }
    };

    const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onJumpToMap();
    };

    const activeQueueCount = stats.openIssues + stats.inProgressIssues;
    const avgTurnaroundDisplay =
        stats.avgResolutionHours !== null ? `${stats.avgResolutionHours}h` : '—';

    const kpiCards = [
        {
            label: 'Total Reported',
            value: stats.totalComplaints.toLocaleString(),
            icon: FileCheck2,
            iconClass: 'bg-indigo-50 text-indigo-600'
        },
        {
            label: 'Issues Resolved',
            value: stats.resolvedIssues.toLocaleString(),
            icon: CheckCircle2,
            iconClass: 'bg-emerald-50 text-emerald-600'
        },
        {
            label: 'Resolution Rate',
            value: `${stats.resolutionRate}%`,
            icon: ShieldCheck,
            iconClass: 'bg-blue-50 text-blue-600'
        },
        {
            label: 'Avg Turnaround',
            value: avgTurnaroundDisplay,
            icon: Clock,
            iconClass: 'bg-amber-50 text-amber-600'
        },
        {
            label: 'Active Officials',
            value: stats.activeAuthorities.toLocaleString(),
            icon: Users,
            iconClass: 'bg-violet-50 text-violet-600'
        },
        {
            label: 'Areas Covered',
            value: stats.areasCovered.toLocaleString(),
            icon: MapPin,
            iconClass: 'bg-rose-50 text-rose-600'
        }
    ];

    return (
        <section className="space-y-5">
            <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-6 sm:p-8 lg:p-10">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.55]"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 88% 12%, rgba(79, 70, 229, 0.08), transparent 45%), radial-gradient(circle at 10% 88%, rgba(16, 185, 129, 0.07), transparent 42%)'
                    }}
                />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                    <m.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="lg:col-span-7 space-y-6"
                    >
                        <div className="inline-flex flex-wrap items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:border-indigo-200 transition-colors">
                            <span className="relative flex h-2 w-2">
                                <span
                                    className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                        socketConnected ? 'animate-ping bg-emerald-500' : 'bg-amber-400'
                                    }`}
                                />
                                <span
                                    className={`relative inline-flex rounded-full h-2 w-2 ${
                                        socketConnected ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`}
                                />
                            </span>
                            <span>
                                {loading
                                    ? 'Syncing live civic telemetry...'
                                    : `${activeQueueCount.toLocaleString()} active issues tracked · ${stats.resolvedIssues.toLocaleString()} resolved`}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl sm:text-4xl lg:text-[3rem] font-black text-slate-900 tracking-tight leading-[1.1]">
                                Transparent Civic Action.{' '}
                                <span className="text-indigo-600">Built for Real Accountability.</span>
                            </h1>
                            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                                File neighborhood issues under rotating anonymous protection, let Gemini AI verify and route them to the responsible department, and monitor live resolution progress across your city.
                            </p>
                        </div>

                        <form onSubmit={handleSearchSubmit} className="max-w-xl">
                            <div className="relative flex items-center bg-slate-50/90 hover:bg-white focus-within:bg-white rounded-2xl border border-slate-200 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all shadow-xs">
                                <Search size={18} className="ml-4 text-slate-400 shrink-0" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    placeholder="Search live reports by category, keyword, or ward..."
                                    className="w-full bg-transparent px-3 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => onSearchChange('')}
                                        aria-label="Clear search"
                                        className="p-1.5 mr-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                    >
                                        <X size={15} />
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="mr-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
                                >
                                    {searchQuery ? `${matchCount} found` : 'Find on Map'}
                                </button>
                            </div>
                        </form>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={handleReportClick}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] text-white text-sm font-bold shadow-sm transition-all cursor-pointer group"
                            >
                                {user ? 'Report an Issue' : 'Start Anonymous Report'}
                                <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>

                            <Link
                                to="/dashboard"
                                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 hover:border-indigo-200 hover:-translate-y-0.5 text-slate-800 border border-slate-200 text-sm font-bold transition-all"
                            >
                                Live Issue Radar
                            </Link>

                            <Link
                                to="/community"
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 text-sm font-semibold transition-colors"
                            >
                                Community Hub
                            </Link>
                        </div>
                    </m.div>

                    <m.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.08 }}
                        className="lg:col-span-5"
                    >
                        <div className="group rounded-2xl bg-slate-50/90 border border-slate-200/90 hover:border-indigo-200 hover:shadow-md transition-all duration-300 overflow-hidden">
                            {!imageError && (
                                <div className="relative h-48 sm:h-56 w-full overflow-hidden border-b border-slate-200/80 bg-white">
                                    <img
                                        src="/civic-hero.jpg"
                                        alt="CivicPulse connected municipal infrastructure map illustration"
                                        onError={() => setImageError(true)}
                                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                                    />
                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white/90 to-transparent" />
                                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2">
                                        <span className="px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-xs border border-slate-200 text-[11px] font-bold text-slate-700 shadow-xs">
                                            Municipal Transparency Network
                                        </span>
                                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50/95 border border-emerald-200 text-[11px] font-bold text-emerald-700 tabular-nums shadow-xs">
                                            {loading ? '—' : `${stats.resolutionRate}% Resolved`}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="p-5 space-y-4">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-xs font-semibold text-slate-600 tabular-nums">
                                        <span>Resolution Completion</span>
                                        <span className="font-bold text-slate-900">
                                            {stats.resolvedIssues.toLocaleString()} / {stats.totalComplaints.toLocaleString()} issues
                                        </span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-700"
                                            style={{ width: `${Math.min(100, Math.max(0, stats.resolutionRate))}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2.5">
                                    <div className="bg-white rounded-xl p-3 border border-slate-200/70 hover:border-indigo-200 transition-colors">
                                        <p className="text-[11px] font-semibold text-slate-500">Open Queue</p>
                                        <p className="text-lg font-black text-indigo-600 tabular-nums mt-0.5">
                                            {loading ? '—' : stats.openIssues.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-xl p-3 border border-slate-200/70 hover:border-amber-200 transition-colors">
                                        <p className="text-[11px] font-semibold text-slate-500">In Progress</p>
                                        <p className="text-lg font-black text-amber-600 tabular-nums mt-0.5">
                                            {loading ? '—' : stats.inProgressIssues.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-xl p-3 border border-slate-200/70 hover:border-emerald-200 transition-colors">
                                        <p className="text-[11px] font-semibold text-slate-500">Resolved</p>
                                        <p className="text-lg font-black text-emerald-600 tabular-nums mt-0.5">
                                            {loading ? '—' : stats.resolvedIssues.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </m.div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {kpiCards.map((item) => (
                    <div
                        key={item.label}
                        className="group bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300/80 hover:-translate-y-1 hover:shadow-md p-4 flex flex-col justify-between gap-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all duration-200 cursor-default"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-500 truncate group-hover:text-slate-800 transition-colors">
                                {item.label}
                            </span>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${item.iconClass}`}>
                                <item.icon size={15} />
                            </div>
                        </div>
                        {loading ? (
                            <div className="h-7 w-16 rounded-md skeleton-box" />
                        ) : (
                            <div className="text-2xl font-black text-slate-900 tabular-nums tracking-tight">
                                {item.value}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
};

export default HeroSection;
