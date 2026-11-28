import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { Search, Users, AlertTriangle, CheckSquare, UserCheck } from 'lucide-react';
import CustomSelect from '../../../components/common/CustomSelect';
import MergedReportBadge from '../../../components/common/MergedReportBadge';
import { getDepartmentForCategory, getPriorityColor } from '../../../utils/complaintUtils';

interface EmployeeSummary {
    _id: string;
    name?: string;
    email: string;
    department?: string;
    authorityLevel?: string;
    dutyStatus: string;
    isActive: boolean;
    isBanned?: boolean;
    activeTasks: number;
}

interface AdminTaskItem {
    _id: string;
    category: string;
    description: string;
    status: string;
    priority: string;
    escalationLevel: string;
    reportCount?: number;
    createdAt: string;
    assignedTo?: {
        _id: string;
        name?: string;
        email?: string;
        department?: string;
        authorityLevel?: string;
        dutyStatus?: string;
    } | null;
}

interface AdminTasksResponse {
    tasks: AdminTaskItem[];
    employees: EmployeeSummary[];
    summary: {
        totalMatched: number;
        unassignedCount: number;
        presentEmployees: number;
        totalEmployees: number;
    };
}

const DEPARTMENT_OPTIONS = [
    { value: 'All', label: 'All Departments' },
    { value: 'Public Works', label: 'Public Works' },
    { value: 'Water & Sanitation', label: 'Water & Sanitation' },
    { value: 'Power', label: 'Power' },
    { value: 'Traffic & Safety', label: 'Traffic & Safety' },
    { value: 'Animal Control', label: 'Animal Control' },
    { value: 'General Administration', label: 'General Administration' }
];

const STATUS_OPTIONS = [
    { value: 'All', label: 'All Statuses' },
    { value: 'Open', label: 'Open / Active Queue' },
    { value: 'Submitted', label: 'Submitted' },
    { value: 'Assigned', label: 'Assigned' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Resolved', label: 'Resolved' },
    { value: 'Closed', label: 'Closed' }
];

const AdminTasks: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [department, setDepartment] = useState<string>(searchParams.get('department') || 'All');
    const [assignedTo, setAssignedTo] = useState<string>('All');
    const [status, setStatus] = useState<string>('Open');
    const [search, setSearch] = useState<string>('');
    const [data, setData] = useState<AdminTasksResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [assigningId, setAssigningId] = useState<string | null>(null);

    const fetchTasks = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (department !== 'All') params.set('department', department);
            if (assignedTo !== 'All') params.set('assignedTo', assignedTo);
            if (status !== 'All') params.set('status', status);
            if (search.trim()) params.set('search', search.trim());

            const res = await axios.get<{ data: AdminTasksResponse }>(
                `${import.meta.env.VITE_API_URL}/api/v1/admin/tasks?${params.toString()}`,
                { withCredentials: true }
            );
            setData(res.data.data);
        } catch {
            toast.error('Failed to load cross-department tasks');
        } finally {
            setLoading(false);
        }
    }, [department, assignedTo, status, search]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleAssign = async (complaintId: string, assigneeId: string) => {
        setAssigningId(complaintId);
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/v1/admin/tasks/${complaintId}/assign`,
                { assigneeId },
                { withCredentials: true }
            );
            toast.success(assigneeId === 'unassigned' ? 'Task moved to unassigned queue' : 'Task assigned successfully');
            fetchTasks();
        } catch (err: unknown) {
            const msg = axios.isAxiosError<{ message?: string }>(err)
                ? err.response?.data?.message || 'Assignment failed'
                : 'Assignment failed';
            toast.error(msg);
        } finally {
            setAssigningId(null);
        }
    };

    const employeeOptions = [
        { value: 'All', label: 'All Officials' },
        { value: 'unassigned', label: 'Unassigned Queue' },
        ...(data?.employees || []).map((emp) => ({
            value: emp._id,
            label: `${emp.name || emp.email} (${emp.activeTasks})`
        }))
    ];

    const assignableEmployees = (data?.employees || []).filter((e) => e.isActive && !e.isBanned);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900">Task Allocation & Staff Presence</h1>
                <p className="text-slate-500 mt-1 text-sm">
                    View which complaint is assigned to which official, monitor on-duty capacity, and reassign across departments.
                </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                        <CheckSquare size={14} className="text-indigo-600" /> Matched Tasks
                    </div>
                    <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
                        {data?.summary.totalMatched ?? 0}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-amber-600" /> Unassigned
                    </div>
                    <div className="text-2xl font-black text-amber-600 mt-1 tabular-nums">
                        {data?.summary.unassignedCount ?? 0}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                        <UserCheck size={14} className="text-emerald-600" /> Present (On Duty)
                    </div>
                    <div className="text-2xl font-black text-emerald-600 mt-1 tabular-nums">
                        {data?.summary.presentEmployees ?? 0} <span className="text-sm text-slate-400">/ {data?.summary.totalEmployees ?? 0}</span>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                        <Users size={14} className="text-orange-600" /> Active Filter
                    </div>
                    <div className="text-sm font-black text-slate-800 mt-2 truncate">{department}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-black text-slate-900">Employee Presence & Load</h2>
                        {assignedTo !== 'All' && (
                            <button
                                type="button"
                                onClick={() => setAssignedTo('All')}
                                className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                            >
                                Clear Filter
                            </button>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => setAssignedTo(assignedTo === 'unassigned' ? 'All' : 'unassigned')}
                        className={`w-full p-3 rounded-2xl border text-left transition-colors cursor-pointer flex items-center justify-between ${
                            assignedTo === 'unassigned'
                                ? 'bg-amber-50 border-amber-300 text-amber-900'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                    >
                        <span className="text-xs font-bold">Unassigned Tasks Queue</span>
                        <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-xs font-black tabular-nums">
                            {data?.summary.unassignedCount ?? 0}
                        </span>
                    </button>

                    <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
                        {(data?.employees || [])
                            .filter((emp) => department === 'All' || emp.department === department)
                            .map((emp) => {
                                const selected = assignedTo === emp._id;
                                return (
                                    <button
                                        key={emp._id}
                                        type="button"
                                        onClick={() => setAssignedTo(selected ? 'All' : emp._id)}
                                        className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                            selected
                                                ? 'bg-orange-50 border-orange-300 shadow-xs'
                                                : 'bg-white border-slate-200/80 hover:border-orange-200 hover:bg-slate-50/70'
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span
                                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                                        !emp.isActive || emp.isBanned
                                                            ? 'bg-rose-500'
                                                            : emp.dutyStatus === 'On Duty'
                                                                ? 'bg-emerald-500'
                                                                : emp.dutyStatus === 'Busy'
                                                                    ? 'bg-amber-500'
                                                                    : 'bg-slate-400'
                                                    }`}
                                                />
                                                <span className="text-xs font-bold text-slate-900 truncate">
                                                    {emp.name || emp.email}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                                                {emp.department} · {emp.authorityLevel} · {!emp.isActive ? 'Disabled' : emp.isBanned ? 'Blocked' : emp.dutyStatus}
                                            </div>
                                        </div>
                                        <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-black tabular-nums shrink-0">
                                            {emp.activeTasks}
                                        </span>
                                    </button>
                                );
                            })}
                    </div>
                </div>

                <div className="xl:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="relative">
                            <Search size={15} className="absolute left-3 top-3 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search issue..."
                                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                            />
                        </div>
                        <CustomSelect value={department} onChange={(e) => setDepartment(e.target.value)} options={DEPARTMENT_OPTIONS} className="bg-slate-50 text-xs" />
                        <CustomSelect value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} options={employeeOptions} className="bg-slate-50 text-xs" />
                        <CustomSelect value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS} className="bg-slate-50 text-xs" />
                    </div>

                    {loading ? (
                        <div className="space-y-3 py-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-24 rounded-2xl skeleton-box" />
                            ))}
                        </div>
                    ) : !data || data.tasks.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 text-sm">
                            No tasks match the selected filters.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data.tasks.map((task) => {
                                const targetDept = getDepartmentForCategory(task.category);
                                const deptEmployees = assignableEmployees.filter(
                                    (emp) => !targetDept || emp.department === targetDept
                                );
                                return (
                                <div key={task._id} className="p-4 rounded-2xl border border-slate-200/90 hover:border-orange-200 bg-slate-50/40 hover:bg-white transition-all space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-mono text-[11px] font-bold text-slate-400">#{task._id.slice(-6).toUpperCase()}</span>
                                            <span className="px-2.5 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold">
                                                {task.category}
                                            </span>
                                            {targetDept && (
                                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                                                    {targetDept} Dept
                                                </span>
                                            )}
                                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getPriorityColor(task.priority, true)}`}>
                                                {task.priority}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                                                {task.escalationLevel} Tier
                                            </span>
                                            <MergedReportBadge reportCount={task.reportCount} compact />
                                        </div>
                                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold">
                                            {task.status}
                                        </span>
                                    </div>

                                    <p className="text-sm font-medium text-slate-800 line-clamp-2">{task.description}</p>

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                                        <div className="text-xs text-slate-500">
                                            Assigned to:{' '}
                                            <span className="font-bold text-slate-800">
                                                {task.assignedTo ? `${task.assignedTo.name || task.assignedTo.email} (${task.assignedTo.authorityLevel})` : 'Unassigned'}
                                            </span>
                                        </div>

                                        <div className="w-full sm:w-72">
                                            <CustomSelect
                                                value={task.assignedTo?._id || 'unassigned'}
                                                onChange={(e) => handleAssign(task._id, e.target.value)}
                                                disabled={assigningId === task._id}
                                                options={[
                                                    { value: 'unassigned', label: 'Unassigned Queue' },
                                                    ...deptEmployees.map((emp) => ({
                                                        value: emp._id,
                                                        label: `${emp.name || emp.email} (${emp.authorityLevel} · ${emp.activeTasks})`
                                                    }))
                                                ]}
                                                className="bg-white text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminTasks;
