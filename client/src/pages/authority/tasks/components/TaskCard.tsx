import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Clock, MapPin, AlertCircle, Map as MapIcon, UserPlus, Send } from 'lucide-react';
import ImageCarousel from '../../../../components/common/ImageCarousel';
import CustomSelect from '../../../../components/common/CustomSelect';
import InlineLocationMap from '../../../../components/common/InlineLocationMap';
import { getPriorityColor } from '../../../../utils/complaintUtils';
import type { Complaint } from '../../../../types';

interface TaskCardProps {
    task: Complaint;
    isExpandedMap: boolean;
    isSeniorOrHOD: boolean;
    replyValue: string;
    onReplyChange: (val: string) => void;
    onSendReply: () => void;
    onStatusChange: (status: string) => void;
    onDateChange: (date: string) => void;
    onToggleMap: () => void;
    onOpenAssign: () => void;
    onEscalate: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
    task,
    isExpandedMap,
    isSeniorOrHOD,
    replyValue,
    onReplyChange,
    onSendReply,
    onStatusChange,
    onDateChange,
    onToggleMap,
    onOpenAssign,
    onEscalate
}) => {
    const taskImages = task.imageUrls && task.imageUrls.length > 0
        ? task.imageUrls
        : task.imageUrl
            ? [task.imageUrl]
            : [];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
        >
            <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(task.priority, true)}`}>
                        {task.priority} Priority
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                        ID: {task._id.slice(-6).toUpperCase()}
                    </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1">
                    {task.category} Issue
                </h3>

                {taskImages.length > 0 && (
                    <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 h-48 bg-slate-100 flex-shrink-0 relative group">
                        <ImageCarousel images={taskImages} />
                    </div>
                )}

                <p className="text-slate-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                    {task.description}
                </p>

                <div className="space-y-2 mb-6">
                    <div className="flex items-center text-slate-500 text-sm">
                        <MapPin size={16} className="mr-2 text-emerald-500" />
                        <span className="line-clamp-1">{task.address?.fullAddress || 'Location provided via GPS'}</span>
                    </div>
                    <div className="flex items-center text-slate-500 text-sm">
                        <Clock size={16} className="mr-2 text-slate-400" />
                        <span>Reported {new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                    {task.escalationLevel !== 'Junior' && (
                        <div className="flex items-center text-red-500 text-sm font-bold">
                            <AlertCircle size={16} className="mr-2" />
                            <span>Escalated to: {task.escalationLevel}</span>
                        </div>
                    )}
                    {task.assignedTo && (
                        <div className="flex items-center text-indigo-600 text-sm font-bold bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                            <div className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-xs mr-2 border border-indigo-300">
                                {(task.assignedTo.name || '').substring(0, 2).toUpperCase()}
                            </div>
                            <span>Handling: {task.assignedTo.name} ({task.assignedTo.authorityLevel})</span>
                        </div>
                    )}
                </div>

                <div className="mt-auto">
                    <div className="pt-4 border-t border-slate-100 space-y-3 pb-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Update Status</label>
                            <CustomSelect
                                value={task.status}
                                onChange={(e) => onStatusChange(e.target.value)}
                                options={[
                                    { value: 'Submitted', label: 'Submitted' },
                                    { value: 'Verified', label: 'Verified' },
                                    { value: 'Assigned', label: 'Assigned' },
                                    { value: 'In Progress', label: 'In Progress' },
                                    { value: 'Resolved', label: 'Resolved' },
                                    { value: 'Rejected', label: 'Rejected' }
                                ]}
                                className="w-full bg-slate-50 focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Expected Completion</label>
                            <input
                                type="date"
                                value={task.expectedCompletionDate ? new Date(task.expectedCompletionDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => onDateChange(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Send Official Reply</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={replyValue}
                                    onChange={(e) => onReplyChange(e.target.value)}
                                    placeholder="Type a message to the citizen..."
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                                <button
                                    onClick={onSendReply}
                                    disabled={!replyValue.trim()}
                                    className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-colors"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-2">
                        <button
                            onClick={onToggleMap}
                            className="text-emerald-600 font-bold text-sm hover:text-emerald-700 transition-colors flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg flex-1 justify-center"
                        >
                            <MapIcon size={14} />
                            {isExpandedMap ? 'Hide Map' : 'Location'}
                        </button>

                        {isSeniorOrHOD && (
                            <button
                                onClick={onOpenAssign}
                                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center transition-colors flex-1 justify-center"
                            >
                                <UserPlus size={14} className="mr-1" />
                                Assign
                            </button>
                        )}

                        {task.escalationLevel !== 'HOD' && (
                            <button
                                onClick={onEscalate}
                                className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center transition-colors flex-1 justify-center"
                            >
                                Escalate
                                <ArrowUpRight size={14} className="ml-1" />
                            </button>
                        )}
                    </div>
                </div>

                <InlineLocationMap
                    isOpen={isExpandedMap}
                    coordinates={task.location?.coordinates}
                    zoom={16}
                    heightClass="h-48"
                    wrapperClassName="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                />
            </div>
        </motion.div>
    );
};

export default TaskCard;
