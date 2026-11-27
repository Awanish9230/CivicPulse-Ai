import React from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, AlertCircle, Calendar } from 'lucide-react';
import type { Petition } from '../../../types';

interface PetitionCardProps {
    petition: Petition;
    index: number;
    onUpvote: (id: string) => void;
}

const getDaysRemaining = (createdAt: string, targetDays: number): number => {
    const ageInMs = Date.now() - new Date(createdAt).getTime();
    const daysElapsed = ageInMs / (1000 * 60 * 60 * 24);
    return Math.ceil(Math.max(0, targetDays - daysElapsed));
};

const PetitionCard: React.FC<PetitionCardProps> = ({ petition, index, onUpvote }) => {
    const progress = Math.min(100, (petition.upvoteCount / petition.targetSignatures) * 100);
    let warningText = "";
    let isWarning = false;

    if (petition.upvoteCount < 50) {
        const daysLeft = getDaysRemaining(petition.createdAt, 7);
        warningText = `Needs ${50 - petition.upvoteCount} more signatures in ${daysLeft} days to survive!`;
        if (daysLeft <= 2) isWarning = true;
    } else if (petition.status === 'Active') {
        const daysLeft = getDaysRemaining(petition.createdAt, 30);
        warningText = `${daysLeft} days left to reach 1,000 signatures`;
    } else if (petition.status === 'Escalated') {
        warningText = "Target reached! Escalated to Admin.";
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
        >
            {petition.imageUrl && (
                <div className="w-full h-48 bg-slate-100 overflow-hidden">
                    <img src={petition.imageUrl} alt={petition.title} className="w-full h-full object-cover" />
                </div>
            )}
            <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-3 gap-4">
                    <h3 className="text-xl font-black text-slate-800 leading-tight">{petition.title}</h3>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-lg shrink-0">
                        {petition.category}
                    </span>
                </div>
                <p className="text-slate-600 text-sm mb-6 line-clamp-3">{petition.description}</p>

                <div className="mt-auto">
                    <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="text-primary">{petition.upvoteCount} Signatures</span>
                        <span className="text-slate-400">Target: {petition.targetSignatures}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                                petition.status === 'Escalated' ? 'bg-green-500' : 'bg-primary'
                            }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                        <div
                            className={`flex items-center gap-1.5 text-xs font-bold ${
                                isWarning
                                    ? 'text-red-500'
                                    : petition.status === 'Escalated'
                                        ? 'text-green-600'
                                        : 'text-slate-500'
                            }`}
                        >
                            {isWarning ? <AlertCircle size={14} /> : <Calendar size={14} />}
                            {warningText}
                        </div>

                        <button
                            onClick={() => onUpvote(petition._id)}
                            disabled={petition.status === 'Escalated' || petition.status === 'Rejected'}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                petition.hasUpvoted
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50'
                            }`}
                        >
                            <ThumbsUp size={16} className={petition.hasUpvoted ? "fill-primary" : ""} />
                            {petition.hasUpvoted ? 'Signed' : 'Sign Petition'}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default PetitionCard;
