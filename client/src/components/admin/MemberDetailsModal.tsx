import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, CheckCircle, KeyRound, MapPin, ShieldAlert, X } from 'lucide-react';
import CustomSelect from '../common/CustomSelect';
import InlineLocationMap from '../common/InlineLocationMap';
import { getPriorityColor } from '../../utils/complaintUtils';
import type { Complaint, User } from '../../types';

export interface MemberDetailsData {
    member: User;
    stats: {
        activeCount: number;
        completedCount: number;
    };
    activeTasks: Complaint[];
    completedTasks: Complaint[];
}

export interface SelectOption {
    value: string;
    label: string;
}

interface MemberDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    loading: boolean;
    memberDetails: MemberDetailsData | null;
    variant: 'citizen' | 'authority';
    isEditing: boolean;
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
    saving: boolean;
    onSave: () => void;
    editFormContent: React.ReactNode;
    onQuickResetPassword?: () => void;
}

export const MemberDetailsModal: React.FC<MemberDetailsModalProps> = ({
    isOpen,
    onClose,
    loading,
    memberDetails,
    variant,
    isEditing,
    setIsEditing,
    saving,
    onSave,
    editFormContent,
    onQuickResetPassword
}) => {
    const [expandedMapId, setExpandedMapId] = useState<string | null>(null);

    const isAuthority = variant === 'authority';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {loading || !memberDetails ? (
                            <div className="p-12 flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
                            </div>
                        ) : (
                            <>
                                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-indigo-50/30">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-2xl shadow-sm border-2 border-indigo-200">
                                            {isAuthority
                                                ? (memberDetails.member.name ? memberDetails.member.name.substring(0, 2).toUpperCase() : 'A')
                                                : (memberDetails.member.anonymousId || '').substring(3, 5)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-2xl font-black text-slate-900">
                                                    {isAuthority ? memberDetails.member.name : memberDetails.member.anonymousId}
                                                </h2>
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                        memberDetails.member.isBanned
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : memberDetails.member.isActive === false
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : 'bg-emerald-100 text-emerald-700'
                                                    }`}
                                                >
                                                    {memberDetails.member.isBanned
                                                        ? (isAuthority ? 'BLOCKED' : 'BANNED')
                                                        : memberDetails.member.isActive === false
                                                            ? 'DISABLED'
                                                            : 'ACTIVE'}
                                                </span>
                                            </div>
                                            {isAuthority ? (
                                                <p className="text-slate-500 text-sm font-medium mt-1 flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-slate-700">
                                                        {memberDetails.member.isAuthorityAdmin ? 'Authority Admin' : memberDetails.member.authorityLevel}
                                                    </span> •
                                                    <span>{memberDetails.member.isAuthorityAdmin ? 'All Departments' : memberDetails.member.department}</span> •
                                                    <span>{memberDetails.member.email}</span>
                                                </p>
                                            ) : (
                                                <p className="text-slate-500 text-sm font-medium mt-1">
                                                    Joined: {memberDetails.member.createdAt ? new Date(memberDetails.member.createdAt).toLocaleDateString() : ''}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {onQuickResetPassword && (
                                            <button
                                                type="button"
                                                onClick={onQuickResetPassword}
                                                className="px-3.5 py-2 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors text-sm font-bold shadow-sm inline-flex items-center gap-1.5"
                                            >
                                                <KeyRound size={15} />
                                                1-Click Reset
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setIsEditing(!isEditing)}
                                            className="px-4 py-2 bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors text-sm font-bold shadow-sm"
                                        >
                                            {isEditing ? 'Cancel Edit' : 'Edit Access'}
                                        </button>
                                        <button
                                            onClick={onClose}
                                            className="p-2 hover:bg-slate-200 bg-slate-100 rounded-full text-slate-500 transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                                    <AnimatePresence>
                                        {isEditing && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                                                animate={{ height: 'auto', opacity: 1, marginBottom: 32 }}
                                                exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                                    <h3 className="text-lg font-black text-slate-900 mb-4">
                                                        {isAuthority ? 'Edit Authority Access' : 'Edit User Access'}
                                                    </h3>
                                                    {editFormContent}
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => setIsEditing(false)}
                                                            className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={onSave}
                                                            disabled={saving}
                                                            className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                                                        >
                                                            {saving ? 'Saving...' : 'Save Changes'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {isAuthority ? (
                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center">
                                                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mr-4">
                                                    <Activity size={24} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Active Load</div>
                                                    <div className="text-3xl font-black text-slate-900">{memberDetails.stats.activeCount}</div>
                                                </div>
                                            </div>
                                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center">
                                                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mr-4">
                                                    <CheckCircle size={24} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Completed</div>
                                                    <div className="text-3xl font-black text-slate-900">{memberDetails.stats.completedCount}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-4 mb-8">
                                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                                <div className="text-sm font-bold text-slate-500 uppercase mb-1">Total Reported</div>
                                                <div className="text-3xl font-black text-slate-900">
                                                    {memberDetails.stats.activeCount + memberDetails.stats.completedCount}
                                                </div>
                                            </div>
                                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                                <div className="text-sm font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                                    <CheckCircle size={16} className="text-emerald-500" /> Resolved
                                                </div>
                                                <div className="text-3xl font-black text-slate-900">{memberDetails.stats.completedCount}</div>
                                            </div>
                                            <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-sm bg-rose-50/30">
                                                <div className="text-sm font-bold text-rose-500 uppercase mb-1 flex items-center gap-1">
                                                    <ShieldAlert size={16} /> Strikes
                                                </div>
                                                <div className="text-3xl font-black text-rose-600">{memberDetails.member.strikes || 0}</div>
                                            </div>
                                        </div>
                                    )}

                                    <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center">
                                        <Activity size={18} className="mr-2 text-indigo-500" />
                                        {isAuthority ? 'Active Assigned Tasks' : 'Active Complaints Filed'}
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                        {memberDetails.activeTasks.length === 0 ? (
                                            <div className="col-span-2 p-6 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl">
                                                {isAuthority ? 'No active tasks assigned to this authority.' : 'No active complaints.'}
                                            </div>
                                        ) : (
                                            memberDetails.activeTasks.map((task) => (
                                                <div key={task._id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getPriorityColor(task.priority)}`}>
                                                            {task.priority}
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-400">
                                                            ID: {task._id.slice(-6).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-bold text-slate-800 mb-1">{task.category} Issue</h4>
                                                    <p className="text-sm text-slate-500 line-clamp-2 mb-3 flex-1">{task.description}</p>
                                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                                                        <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                                            {task.status}
                                                        </div>
                                                        <button
                                                            onClick={() => setExpandedMapId(expandedMapId === task._id ? null : task._id)}
                                                            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center"
                                                        >
                                                            <MapPin size={12} className="mr-1" /> Location
                                                        </button>
                                                    </div>

                                                    <InlineLocationMap
                                                        isOpen={expandedMapId === task._id}
                                                        coordinates={task.location?.coordinates}
                                                        zoom={15}
                                                        heightClass="h-32"
                                                    />
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center">
                                        <CheckCircle size={18} className="mr-2 text-emerald-500" />
                                        {isAuthority ? 'Recently Completed Tasks' : 'Recently Resolved'} ({memberDetails.stats.completedCount})
                                    </h3>
                                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-xs font-bold text-slate-500">ID</th>
                                                    <th className="px-4 py-3 text-xs font-bold text-slate-500">Category</th>
                                                    <th className="px-4 py-3 text-xs font-bold text-slate-500">Resolved Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {memberDetails.completedTasks.slice(0, 10).map((task) => (
                                                    <tr key={task._id} className="border-t border-slate-100">
                                                        <td className="px-4 py-3 text-xs font-mono text-slate-400">
                                                            {task._id.slice(-6).toUpperCase()}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-medium text-slate-700">{task.category}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-500">
                                                            {new Date(task.updatedAt ?? task.createdAt).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {memberDetails.completedTasks.length === 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="px-4 py-4 text-center text-slate-500 text-sm">
                                                            {isAuthority ? 'No resolved tasks.' : 'No resolved complaints.'}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
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

export { CustomSelect };
export default MemberDetailsModal;
