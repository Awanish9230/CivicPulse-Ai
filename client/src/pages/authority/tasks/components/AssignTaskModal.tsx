import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { AuthorityLevel } from '../../../../types';

export interface DepartmentMember {
    _id: string;
    name: string;
    authorityLevel: AuthorityLevel;
    department: string;
    activeTasks: number;
    completedTasks: number;
}

interface AssignTaskModalProps {
    isOpen: boolean;
    loading: boolean;
    members: DepartmentMember[];
    onClose: () => void;
    onAssign: (assigneeId: string) => void;
}

const AssignTaskModal: React.FC<AssignTaskModalProps> = ({
    isOpen,
    loading,
    members,
    onClose,
    onAssign
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white rounded-3xl w-full max-w-2xl shadow-xl z-10 overflow-hidden flex flex-col max-h-[80vh]"
                    >
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Assign Task</h2>
                                <p className="text-slate-500 text-sm mt-1">Select an official from your department.</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white rounded-full text-slate-400 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {loading ? (
                                <div className="flex justify-center p-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {members.map((member) => (
                                        <div key={member._id} className="flex items-center justify-between p-4 border border-slate-200 rounded-2xl hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors group">
                                            <div>
                                                <h4 className="font-bold text-slate-900 group-hover:text-emerald-700">{member.name}</h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                                        {member.authorityLevel}
                                                    </span>
                                                    <span className="text-xs text-slate-500 flex items-center">
                                                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
                                                        {member.activeTasks} Active
                                                    </span>
                                                    <span className="text-xs text-slate-500 flex items-center">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
                                                        {member.completedTasks} Completed
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => onAssign(member._id)}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                                            >
                                                Assign
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AssignTaskModal;
