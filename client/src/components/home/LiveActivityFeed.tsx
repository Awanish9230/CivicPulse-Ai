import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Radio, CheckCircle2, PlusCircle, RefreshCw, Trash2 } from 'lucide-react';
import { getTimeAgo } from '../../utils/dateUtils';
import { getStatusBadgeClass, PublicActivityEntry } from './homeData';

interface LiveActivityFeedProps {
    activities: PublicActivityEntry[];
    loading: boolean;
    socketConnected: boolean;
    onSelectActivity?: (item: PublicActivityEntry) => void;
}

const getEventVisual = (item: PublicActivityEntry) => {
    if (item.eventType === 'deleted') {
        return {
            icon: Trash2,
            iconClass: 'bg-rose-50 text-rose-600 border-rose-200/80',
            label: 'Removed from queue'
        };
    }
    if (item.status === 'Resolved' || item.status === 'Closed') {
        return {
            icon: CheckCircle2,
            iconClass: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
            label: `Marked ${item.status}`
        };
    }
    if (item.eventType === 'new' || item.status === 'Submitted') {
        return {
            icon: PlusCircle,
            iconClass: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
            label: 'New report submitted'
        };
    }
    return {
        icon: RefreshCw,
        iconClass: 'bg-amber-50 text-amber-600 border-amber-200/80',
        label: `Status: ${item.status}`
    };
};

const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({
    activities,
    loading,
    socketConnected,
    onSelectActivity
}) => {
    return (
        <aside className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5 sm:p-7 flex flex-col h-full">
            <div className="flex items-center justify-between gap-2 mb-5">
                <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
                        <Radio size={13} /> Socket.IO Stream
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Live Platform Pulse
                    </h2>
                </div>

                <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${
                        socketConnected
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                >
                    <span
                        className={`w-1.5 h-1.5 rounded-full ${
                            socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`}
                    />
                    {socketConnected ? 'Live' : 'Connecting'}
                </span>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 space-y-2">
                            <div className="h-3.5 w-2/3 rounded skeleton-box" />
                            <div className="h-3 w-full rounded skeleton-box" />
                        </div>
                    ))}
                </div>
            ) : activities.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
                    <Radio size={24} className="text-slate-400 mb-2" />
                    <p className="text-sm font-bold text-slate-700">Listening for live updates</p>
                    <p className="text-xs text-slate-500 mt-1">
                        New complaint submissions and status transitions stream here immediately.
                    </p>
                </div>
            ) : (
                <div className="space-y-2.5 overflow-y-auto max-h-[560px] pr-1">
                    <AnimatePresence initial={false}>
                        {activities.map((item) => {
                            const visual = getEventVisual(item);
                            const EventIcon = visual.icon;
                            return (
                                <m.button
                                    type="button"
                                    key={`${item._id}-${item.status}-${item.timestamp}`}
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    onClick={() => onSelectActivity?.(item)}
                                    className="w-full text-left p-3.5 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/70 hover:border-indigo-300/80 hover:shadow-sm transition-all duration-200 cursor-pointer group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-105 ${visual.iconClass}`}>
                                            <EventIcon size={15} />
                                        </div>
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 truncate transition-colors">
                                                    {item.category} · {visual.label}
                                                </span>
                                                <span className="text-[11px] font-medium text-slate-400 shrink-0 tabular-nums">
                                                    {getTimeAgo(item.timestamp) || 'Just now'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                                {item.description}
                                            </p>
                                            <div className="flex items-center justify-between gap-2 pt-0.5">
                                                <span className="text-[11px] font-medium text-slate-500 truncate">
                                                    {item.area}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusBadgeClass(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </m.button>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </aside>
    );
};

export default LiveActivityFeed;
