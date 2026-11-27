import React from 'react';
import { Radio } from 'lucide-react';
import { getTimeAgo } from '../../utils/dateUtils';
import { getStatusDotHex, PublicActivityEntry } from './homeData';

interface CityAlertTickerProps {
    activities: PublicActivityEntry[];
    onSelectActivity?: (item: PublicActivityEntry) => void;
}

const CityAlertTicker: React.FC<CityAlertTickerProps> = ({ activities, onSelectActivity }) => {
    if (!activities || activities.length === 0) return null;

    const repeatedItems = [...activities, ...activities];

    return (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden flex items-center">
            <div className="shrink-0 bg-emerald-50 border-r border-emerald-100 px-4 py-3 flex items-center gap-2 z-10">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-700 whitespace-nowrap">
                    <Radio size={12} /> City Pulse
                </span>
            </div>

            <div className="flex-1 overflow-hidden relative py-2.5">
                <div className="animate-civic-marquee items-center gap-3 px-4">
                    {repeatedItems.map((item, idx) => (
                        <button
                            key={`${item._id}-${idx}`}
                            type="button"
                            onClick={() => onSelectActivity?.(item)}
                            className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-50/90 hover:bg-indigo-50/70 border border-slate-200/70 hover:border-indigo-200 text-xs transition-all duration-200 cursor-pointer shrink-0 group"
                        >
                            <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: getStatusDotHex(item.status) }}
                            />
                            <span className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                                {item.category}
                            </span>
                            <span className="text-slate-500 truncate max-w-[200px]">
                                {item.description}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400">
                                · {item.area}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200/80 text-[10px] font-bold text-slate-600 tabular-nums">
                                {getTimeAgo(item.timestamp) || 'Now'}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CityAlertTicker;
