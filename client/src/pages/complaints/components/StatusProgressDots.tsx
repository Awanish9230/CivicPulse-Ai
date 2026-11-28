import React from 'react';

interface StatusProgressDotsProps {
    status: string;
    isRejected: boolean;
    slaRisk: boolean;
}

const STEPS = ['Submitted', 'Verified', 'In Progress', 'Resolved'];

const StatusProgressDots: React.FC<StatusProgressDotsProps> = ({ status, isRejected, slaRisk }) => {
    const currentIdx = isRejected
        ? 4
        : STEPS.indexOf(status) !== -1
            ? STEPS.indexOf(status)
            : (status === 'Closed' ? 3 : 0);

    return (
        <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar py-1">
            {STEPS.map((step, idx) => {
                const isActive = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                const isFailed = isRejected || slaRisk;

                let bg = 'bg-slate-200';
                if (isActive) {
                    if (isFailed && isCurrent) bg = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]';
                    else if (idx === 3) bg = 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]';
                    else bg = 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]';
                }

                return (
                    <div key={step} className="flex items-center gap-1.5 shrink-0 group relative">
                        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${bg} ${isCurrent ? 'scale-125' : ''}`} />
                        <span className={`text-[10px] font-bold ${isActive ? 'text-text/80' : 'text-text/40'}`}>
                            {isRejected && isCurrent ? 'Rejected' : step}
                        </span>
                        {idx < STEPS.length - 1 && (
                            <div
                                className={`w-4 h-[2px] rounded-full mx-1 ${
                                    idx < currentIdx ? (isFailed ? 'bg-red-200' : 'bg-blue-200') : 'bg-slate-100'
                                }`}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default StatusProgressDots;
