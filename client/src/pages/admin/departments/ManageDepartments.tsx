import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import {
    Building2,
    Users,
    CheckCircle2,
    AlertTriangle,
    Plus,
    ChevronDown,
    ChevronUp,
    ArrowUpRight,
    X
} from 'lucide-react';

interface DepartmentEmployee {
    _id: string;
    name?: string;
    email: string;
    authorityLevel?: string;
    dutyStatus: string;
    isActive: boolean;
    isBanned?: boolean;
    isAuthorityAdmin?: boolean;
    activeTasks: number;
}

interface DepartmentOverviewItem {
    _id: string;
    name: string;
    code: string;
    description: string;
    categories: string[];
    isActive: boolean;
    stats: {
        totalOfficials: number;
        activeOfficials: number;
        presentCount: number;
        offDutyCount: number;
        juniorCount: number;
        seniorCount: number;
        hodCount: number;
        activeTasks: number;
        unassignedTasks: number;
        escalatedTasks: number;
        resolvedTasks: number;
    };
    employees: DepartmentEmployee[];
}

interface DepartmentsResponse {
    departments: DepartmentOverviewItem[];
    totals: {
        departmentsCount: number;
        totalOfficials: number;
        presentOfficials: number;
        openTasks: number;
        unassignedTasks: number;
    };
}

const getDutyBadgeClass = (duty: string, isActive: boolean, isBanned?: boolean): string => {
    if (!isActive) return 'bg-slate-100 text-slate-500 border-slate-200';
    if (isBanned) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (duty === 'On Duty') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (duty === 'Busy') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
};

const ManageDepartments: React.FC = () => {
    const [data, setData] = useState<DepartmentsResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const [createForm, setCreateForm] = useState({ name: '', code: '', categoriesText: '', description: '' });
    const [submitting, setSubmitting] = useState<boolean>(false);

    const fetchDepartments = async () => {
        try {
            const res = await axios.get<{ data: DepartmentsResponse }>(
                `${import.meta.env.VITE_API_URL}/api/v1/admin/departments`,
                { withCredentials: true }
            );
            setData(res.data.data);
        } catch {
            toast.error('Failed to load departments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const categories = createForm.categoriesText
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/v1/admin/departments`,
                {
                    name: createForm.name,
                    code: createForm.code,
                    categories,
                    description: createForm.description
                },
                { withCredentials: true }
            );
            toast.success('Department created');
            setShowCreateModal(false);
            setCreateForm({ name: '', code: '', categoriesText: '', description: '' });
            fetchDepartments();
        } catch (err: unknown) {
            const msg = axios.isAxiosError<{ message?: string }>(err)
                ? err.response?.data?.message || 'Failed to create department'
                : 'Failed to create department';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900">Departments Management</h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Monitor every municipal department, live on-duty employee count, and task backlog.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer"
                >
                    <Plus size={18} /> Add Department
                </button>
            </div>

            {loading || !data ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 rounded-2xl bg-white border border-slate-200 skeleton-box" />
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                            <div className="text-xs font-bold text-slate-500 uppercase">Departments</div>
                            <div className="text-3xl font-black text-slate-900 mt-1 tabular-nums">{data.totals.departmentsCount}</div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                            <div className="text-xs font-bold text-slate-500 uppercase">Officials Present (On Duty)</div>
                            <div className="text-3xl font-black text-emerald-600 mt-1 tabular-nums">
                                {data.totals.presentOfficials} <span className="text-base font-bold text-slate-400">/ {data.totals.totalOfficials}</span>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                            <div className="text-xs font-bold text-slate-500 uppercase">Active Dept Tasks</div>
                            <div className="text-3xl font-black text-indigo-600 mt-1 tabular-nums">{data.totals.openTasks}</div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                            <div className="text-xs font-bold text-slate-500 uppercase">Unassigned Queue</div>
                            <div className="text-3xl font-black text-amber-600 mt-1 tabular-nums">{data.totals.unassignedTasks}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {data.departments.map((dept) => {
                            const isExpanded = expandedId === dept._id;
                            return (
                                <div
                                    key={dept._id}
                                    className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-orange-200 transition-all overflow-hidden"
                                >
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center shrink-0">
                                                    <Building2 size={22} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h2 className="text-lg font-black text-slate-900">{dept.name}</h2>
                                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[11px] font-bold">
                                                            {dept.code}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5">{dept.description}</p>
                                                </div>
                                            </div>
                                            <Link
                                                to={`/admin/tasks?department=${encodeURIComponent(dept.name)}`}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-700 border border-slate-200 text-xs font-bold transition-colors shrink-0"
                                            >
                                                Tasks <ArrowUpRight size={13} />
                                            </Link>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5">
                                            {dept.categories.map((cat) => (
                                                <span key={cat} className="px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-600">
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-4 gap-2 pt-2">
                                            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                                                <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                                                    <Users size={12} /> Present
                                                </div>
                                                <div className="text-lg font-black text-emerald-800 tabular-nums mt-0.5">
                                                    {dept.stats.presentCount}/{dept.stats.totalOfficials}
                                                </div>
                                            </div>
                                            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100">
                                                <div className="text-[11px] font-semibold text-indigo-700">Active</div>
                                                <div className="text-lg font-black text-indigo-900 tabular-nums mt-0.5">
                                                    {dept.stats.activeTasks}
                                                </div>
                                            </div>
                                            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100">
                                                <div className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                                                    <AlertTriangle size={11} /> Unassigned
                                                </div>
                                                <div className="text-lg font-black text-amber-800 tabular-nums mt-0.5">
                                                    {dept.stats.unassignedTasks}
                                                </div>
                                            </div>
                                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                                <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                                                    <CheckCircle2 size={11} /> Resolved
                                                </div>
                                                <div className="text-lg font-black text-slate-900 tabular-nums mt-0.5">
                                                    {dept.stats.resolvedTasks}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                                            <div className="text-slate-500 font-medium">
                                                Hierarchy: <span className="font-bold text-slate-800">{dept.stats.hodCount} HOD</span> ·{' '}
                                                <span className="font-bold text-slate-800">{dept.stats.seniorCount} Senior</span> ·{' '}
                                                <span className="font-bold text-slate-800">{dept.stats.juniorCount} Junior</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setExpandedId(isExpanded ? null : dept._id)}
                                                className="inline-flex items-center gap-1 font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                                            >
                                                {isExpanded ? 'Hide Roster' : `View Staff (${dept.employees.length})`}
                                                {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                            </button>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="border-t border-slate-100 bg-slate-50/70 p-4 space-y-2">
                                            {dept.employees.length === 0 ? (
                                                <p className="text-xs text-slate-500 text-center py-2">No officials assigned to this department yet.</p>
                                            ) : (
                                                dept.employees.map((emp) => (
                                                    <div key={emp._id} className="bg-white rounded-xl p-3 border border-slate-200/80 flex items-center justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-bold text-slate-900 truncate">{emp.name || emp.email}</div>
                                                            <div className="text-xs text-slate-500">{emp.authorityLevel} · {emp.email}</div>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getDutyBadgeClass(emp.dutyStatus, emp.isActive, emp.isBanned)}`}>
                                                                {!emp.isActive ? 'Disabled' : emp.isBanned ? 'Blocked' : emp.dutyStatus}
                                                            </span>
                                                            <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold tabular-nums">
                                                                {emp.activeTasks} active
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900">Create Department</h3>
                            <button type="button" onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Department Name</label>
                                <input
                                    type="text"
                                    required
                                    value={createForm.name}
                                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                    placeholder="e.g., Parks & Recreation"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Short Code</label>
                                <input
                                    type="text"
                                    required
                                    value={createForm.code}
                                    onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                                    placeholder="e.g., PRK"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm uppercase focus:outline-none focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Mapped Categories (comma-separated)</label>
                                <input
                                    type="text"
                                    value={createForm.categoriesText}
                                    onChange={(e) => setCreateForm({ ...createForm, categoriesText: e.target.value })}
                                    placeholder="Road, Construction"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                                <textarea
                                    rows={2}
                                    value={createForm.description}
                                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500 resize-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm cursor-pointer disabled:opacity-50"
                            >
                                {submitting ? 'Creating...' : 'Save Department'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageDepartments;
