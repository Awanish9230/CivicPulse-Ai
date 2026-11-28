import React from 'react';
import { Users } from 'lucide-react';

interface MergedReportBadgeProps {
    reportCount?: number;
    compact?: boolean;
    className?: string;
}

const MergedReportBadge: React.FC<MergedReportBadgeProps> = ({
    reportCount = 1,
    compact = false,
    className = ''
}) => {
    if (!reportCount || reportCount < 2) {
        return null;
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[11px] font-bold tracking-tight ${className}`}
            title={`${reportCount} people have reported this issue`}
        >
            <Users size={12} className="shrink-0 text-indigo-600" />
            <span>
                {compact ? `${reportCount} people reported` : `${reportCount} people reported this issue`}
            </span>
        </span>
    );
};

export default MergedReportBadge;
