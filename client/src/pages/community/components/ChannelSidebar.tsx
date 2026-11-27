import React from 'react';
import { MapPin, TrendingUp } from 'lucide-react';
import type { Complaint } from '../../../types';
import type { ChannelConfig } from '../types';

interface ChannelSidebarProps {
    channels: ChannelConfig[];
    activeChannel: string;
    onSelectChannel: (channelId: string) => void;
    trendingFeed: Complaint[];
}

const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
    channels,
    activeChannel,
    onSelectChannel,
    trendingFeed
}) => {
    return (
        <div className="w-72 bg-white/40 border-r border-white/50 flex flex-col hidden md:flex shrink-0 backdrop-blur-xl">
            <div className="p-6 border-b border-white/50">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Community Hub</h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">Local connections</p>
            </div>

            <div className="flex-1 overflow-hidden p-4 flex flex-col justify-between">
                <div className="space-y-1">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-3">Channels</div>
                    {channels.map((channel) => {
                        const Icon = channel.icon;
                        const isActive = activeChannel === channel.id;
                        return (
                            <button
                                key={channel.id}
                                onClick={() => onSelectChannel(channel.id)}
                                className={`w-full flex flex-col items-start px-4 py-3 rounded-2xl transition-all ${
                                    isActive ? 'bg-white shadow-sm border border-slate-100 text-primary font-bold' : 'hover:bg-white/50 text-slate-500 font-medium'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                                        <Icon size={16} />
                                    </div>
                                    <span>{channel.name}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-4 bg-white/60 border border-white/80 rounded-3xl p-5 shadow-sm backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-2 text-primary font-black mb-4">
                        <TrendingUp size={16} />
                        <span className="text-sm tracking-tight">Trending Issues</span>
                    </div>
                    <div className="space-y-4">
                        {trendingFeed.slice(0, 2).map((item) => (
                            <div key={item._id} className="text-xs group cursor-pointer">
                                <div className="font-bold text-slate-800 line-clamp-1 group-hover:text-primary transition-colors">
                                    {item.description}
                                </div>
                                <div className="text-slate-500 font-medium flex items-center gap-1 mt-1">
                                    <MapPin size={10} className="text-slate-400" /> {item.supportCount || 0} affected
                                </div>
                            </div>
                        ))}
                        {trendingFeed.length === 0 && <div className="text-xs text-slate-400">No trending issues yet.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChannelSidebar;
