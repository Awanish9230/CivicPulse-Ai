import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, CheckCircle, Clock } from 'lucide-react';
import type { AuthorityLevel, Complaint } from '../../../../types';

export interface AuthorityMember {
    _id: string;
    name?: string;
    email: string;
    authorityLevel: AuthorityLevel;
    department: string;
    activeTasks?: number;
    completedTasks?: number;
}

export interface EmployeeReportData {
    employee: AuthorityMember;
    stats: {
        activeCount: number;
        completedCount: number;
    };
    activeTasks: Complaint[];
}

interface EmployeeReportModalProps {
    isOpen: boolean;
    loading: boolean;
    reportData: EmployeeReportData | null;
    onClose: () => void;
}

const EmployeeReportModal: React.FC<EmployeeReportModalProps> = ({
    isOpen,
    loading,
    reportData,
    onClose
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
                        className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {loading || !reportData ? (
                            <div className="p-12 flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
                            </div>
                        ) : (
                            <>
                                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-emerald-50/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-2xl border-4 border-white shadow-sm">
                                            {reportData.employee.name ? reportData.employee.name.substring(0, 2).toUpperCase() : 'A'}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-900">{reportData.employee.name}</h2>
                                            <p className="text-slate-500 text-sm font-semibold flex items-center gap-2 mt-1">
                                                <span>{reportData.employee.authorityLevel}</span> •
                                                <span>{reportData.employee.department}</span> •
                                                <span>{reportData.employee.email}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full text-slate-400 transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center">
                                            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mr-4">
                                                <Activity size={24} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Active Load</div>
                                                <div className="text-3xl font-black text-slate-900">{reportData.stats.activeCount}</div>
                                            </div>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mr-4">
                                                <CheckCircle size={24} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Completed</div>
                                                <div className="text-3xl font-black text-slate-900">{reportData.stats.completedCount}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center">
                                        <Clock size={18} className="mr-2 text-emerald-500" />
                                        Currently Active Tasks
                                    </h3>
                                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-8">
                                        {reportData.activeTasks.length === 0 ? (
                                            <div className="p-6 text-center text-slate-500 text-sm">No active tasks assigned to this employee.</div>
                                        ) : (
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-100">
                                                        <th className="px-4 py-3 text-xs font-bold text-slate-500">ID</th>
                                                        <th className="px-4 py-3 text-xs font-bold text-slate-500">Category</th>
                                                        <th className="px-4 py-3 text-xs font-bold text-slate-500">Priority</th>
                                                        <th className="px-4 py-3 text-xs font-bold text-slate-500">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reportData.activeTasks.map((task) => (
                                                        <tr key={task._id} className="border-b border-slate-50 last:border-0">
                                                            <td className="px-4 py-3 text-xs font-mono text-slate-400">{task._id.slice(-6).toUpperCase()}</td>
                                                            <td className="px-4 py-3 text-sm font-bold text-slate-700">{task.category}</td>
                                                            <td className="px-4 py-3">
                                                                <span className="text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-600">{task.priority}</span>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-slate-600">{task.status}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default EmployeeReportModal;
