import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    iconWrapperClassName?: string;
    containerClassName?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    iconWrapperClassName = 'w-16 h-16 bg-slate-100 rounded-2xl text-text/40',
    containerClassName = 'col-span-full py-20 text-center'
}) => {
    return (
        <div className={containerClassName}>
            <div className={`flex items-center justify-center mx-auto mb-4 ${iconWrapperClassName}`}>
                <Icon size={28} />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">{title}</h2>
            <p className="text-text/50 text-sm mb-6">{description}</p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 px-6 py-2.5 rounded-xl transition-colors"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
