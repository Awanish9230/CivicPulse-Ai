import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, type LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    variant?: 'civic' | 'admin';
    colorClass?: string;
    iconBgClass?: string;
    accentBgClass?: string;
    hoverBorderClass?: string;
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

export const StatCardSkeleton: React.FC = () => (
    <motion.div
        variants={itemVariants}
        className="bg-white p-6 rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-border/50 overflow-hidden"
    >
        <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl skeleton-box"></div>
        </div>
        <div className="h-3 w-24 mb-3 skeleton-box skeleton-text"></div>
        <div className="h-10 w-16 skeleton-box skeleton-text"></div>
    </motion.div>
);

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon: Icon,
    trend,
    variant = 'civic',
    colorClass = 'bg-primary/10 text-primary',
    iconBgClass = 'bg-primary/10 text-primary',
    accentBgClass = 'bg-primary/5',
    hoverBorderClass = 'hover:border-primary/30'
}) => {
    if (variant === 'admin') {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start justify-between">
                <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">{title}</p>
                    <h3 className="text-3xl font-black text-slate-800">{value}</h3>
                    {trend && (
                        <div className="flex items-center gap-1 mt-2 text-emerald-600 text-sm font-medium">
                            <TrendingUp size={16} />
                            <span>{trend}</span>
                        </div>
                    )}
                </div>
                <div className={`p-4 rounded-xl ${colorClass}`}>
                    <Icon size={24} />
                </div>
            </div>
        );
    }

    return (
        <motion.div
            variants={itemVariants}
            className={`bg-white p-6 rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-border/50 group ${hoverBorderClass} transition-colors relative overflow-hidden`}
        >
            <div className={`absolute top-0 right-0 w-32 h-32 ${accentBgClass} rounded-bl-[100px] pointer-events-none transition-all group-hover:scale-110`} />
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3 rounded-2xl ${iconBgClass}`}>
                    <Icon size={24} />
                </div>
            </div>
            <h3 className="text-text/60 font-bold text-sm mb-1 relative z-10">{title}</h3>
            <p className="text-4xl font-black text-text relative z-10">{value}</p>
        </motion.div>
    );
};

export default StatCard;
