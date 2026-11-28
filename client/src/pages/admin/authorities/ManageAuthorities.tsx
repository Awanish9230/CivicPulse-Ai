import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import {
    Search,
    Eye,
    ShieldAlert,
    Plus,
    KeyRound,
    ShieldCheck,
    Trash2,
    X,
    Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import CustomSelect from '../../../components/common/CustomSelect';
import MemberDetailsModal, {
    type MemberDetailsData,
    type SelectOption
} from '../../../components/admin/MemberDetailsModal';
import TempPasswordModal, {
    type ResetPasswordResult
} from '../../../components/admin/TempPasswordModal';
import type { RoleSummary } from '../../../types';

interface ApiAuthority {
    _id: string;
    name?: string;
    email?: string;
    role: 'Authority' | 'Admin';
    department?: string;
    authorityLevel?: string;
    dutyStatus?: string;
    isAuthorityAdmin?: boolean;
    customRole?: RoleSummary | null;
    isActive?: boolean;
    isBanned?: boolean;
    activeTasksCount?: number;
    completedTasksCount?: number;
    tasksCount?: number;
}

interface AuthoritySummaryStats {
    total: number;
    presentCount: number;
    disabledCount: number;
    blockedCount: number;
}

interface EditAuthorityForm {
    department: string;
    authorityLevel: string;
    dutyStatus: string;
    customRole: string;
    isAuthorityAdmin: boolean;
    isActive: boolean;
    isBanned: boolean;
}

const DEPT_OPTIONS: SelectOption[] = [
    { value: 'Public Works', label: 'Public Works' },
    { value: 'Water & Sanitation', label: 'Water & Sanitation' },
    { value: 'Power', label: 'Power' },
    { value: 'Traffic & Safety', label: 'Traffic & Safety' },
    { value: 'Animal Control', label: 'Animal Control' },
    { value: 'General Administration', label: 'General Administration' },
];

const LEVEL_OPTIONS: SelectOption[] = [
    { value: 'Junior', label: 'Junior' },
    { value: 'Senior', label: 'Senior' },
    { value: 'HOD', label: 'HOD (Head of Department)' },
];

const DUTY_OPTIONS: SelectOption[] = [
    { value: 'On Duty', label: 'On Duty' },
    { value: 'Busy', label: 'Busy' },
    { value: 'Off Duty', label: 'Off Duty' },
    { value: 'On Leave', label: 'On Leave' },
];

const ManageAuthorities: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'officials' | 'roles'>('officials');
    const [authorities, setAuthorities] = useState<ApiAuthority[]>([]);
    const [summary, setSummary] = useState<AuthoritySummaryStats>({ total: 0, presentCount: 0, disabledCount: 0, blockedCount: 0 });
    const [loading, setLoading] = useState<boolean>(true);

    const [search, setSearch] = useState<string>('');
    const [deptFilter, setDeptFilter] = useState<string>('All');
    const [dutyFilter, setDutyFilter] = useState<string>('All');
    const [statusFilter, setStatusFilter] = useState<string>('All');

    const [roles, setRoles] = useState<RoleSummary[]>([]);
    const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);

    const [selectedMember, setSelectedMember] = useState<string | null>(null);
    const [memberDetails, setMemberDetails] = useState<MemberDetailsData | null>(null);
    const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editForm, setEditForm] = useState<EditAuthorityForm>({
        department: '',
        authorityLevel: '',
        dutyStatus: 'On Duty',
        customRole: '',
        isAuthorityAdmin: false,
        isActive: true,
        isBanned: false
    });
    const [saving, setSaving] = useState<boolean>(false);

    const [showCreateOfficial, setShowCreateOfficial] = useState<boolean>(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Authority',
        department: 'Power',
        authorityLevel: 'Junior',
        dutyStatus: 'On Duty',
        isAuthorityAdmin: false,
        customRoleId: ''
    });

    const [showRoleModal, setShowRoleModal] = useState<boolean>(false);
    const [editingRole, setEditingRole] = useState<RoleSummary | null>(null);
    const [roleForm, setRoleForm] = useState<{
        name: string;
        scope: 'Authority' | 'Admin';
        description: string;
        permissions: string[];
    }>({
        name: '',
        scope: 'Authority',
        description: '',
        permissions: ['resolve_tasks']
    });

    const [resetModalData, setResetModalData] = useState<ResetPasswordResult | null>(null);

    const fetchAuthorities = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (search.trim()) params.set('search', search.trim());
            if (deptFilter !== 'All') params.set('department', deptFilter);
            if (dutyFilter !== 'All') params.set('dutyStatus', dutyFilter);
            if (statusFilter !== 'All') params.set('status', statusFilter);

            const { data } = await axios.get<{
                data: { authorities: ApiAuthority[]; summary: AuthoritySummaryStats };
            }>(
                `${import.meta.env.VITE_API_URL}/api/v1/admin/authorities?${params.toString()}`,
                { withCredentials: true }
            );
            setAuthorities(data.data.authorities || []);
            if (data.data.summary) setSummary(data.data.summary);
        } catch {
            toast.error('Failed to load authorities');
        } finally {
            setLoading(false);
        }
    }, [search, deptFilter, dutyFilter, statusFilter]);

    const fetchRoles = useCallback(async () => {
        try {
            const { data } = await axios.get<{
                data: { roles: RoleSummary[]; availablePermissions: string[] };
            }>(
                `${import.meta.env.VITE_API_URL}/api/v1/admin/roles`,
                { withCredentials: true }
            );
            setRoles(data.data.roles || []);
            setAvailablePermissions(data.data.availablePermissions || []);
        } catch {
            toast.error('Failed to load roles');
        }
    }, []);

    useEffect(() => {
        fetchAuthorities();
    }, [fetchAuthorities]);

    useEffect(() => {
        fetchRoles();
        const socket = io(`${import.meta.env.VITE_API_URL}`);
        socket.on('connect', () => socket.emit('joinAdminRoom'));
        socket.on('stats_update', (data: { type: string }) => {
            if (data.type === 'new_user') fetchAuthorities();
        });
        socket.on('user_updated', () => {
            fetchAuthorities();
        });
        return () => {
            socket.disconnect();
        };
    }, [fetchAuthorities, fetchRoles]);

    const handleToggleStatus = async (
        id: string,
        payload: { isActive?: boolean; isBanned?: boolean }
    ) => {
        try {
            await axios.patch(
                `${import.meta.env.VITE_API_URL}/api/v1/admin/members/${id}/status`,
                payload,
                { withCredentials: true }
            );
            toast.success('Account status updated');
            fetchAuthorities();
        } catch (err: unknown) {
            const msg = axios.isAxiosError<{ message?: string }>(err)
                ? err.response?.data?.message || 'Status update failed'
                : 'Status update failed';
            toast.error(msg);
        }
    };

    const handleResetPassword = async (id: string) => {
        try {
            const { data } = await axios.post<{ data: ResetPasswordResult }>(
                `${import.meta.env.VITE_API_URL}/api/v1/admin/members/${id}/reset-password`,
                {},
                { withCredentials: true }
            );
            setResetModalData(data.data);
            toast.success('Temporary password generated');
        } catch {
            toast.error('Failed to reset password');
        }
    };

    const openMemberDetails = async (memberId: string) => {
        setSelectedMember(memberId);
        setLoadingDetails(true);
        setIsEditing(false);
        try {
            const { data } = await axios.get<{ data: MemberDetailsData }>(
                `${import.meta.env.VITE_API_URL}/api/v1/admin/members/${memberId}`,
                { withCredentials: true }
            );
            setMemberDetails(data.data);
            const m = data.data.member;
            const roleId = typeof m.customRole === 'object' && m.customRole ? m.customRole._id : (m.customRole || '');
            setEditForm({
                department: m.department || 'General Administration',
                authorityLevel: m.authorityLevel || 'Junior',
                dutyStatus: m.dutyStatus || 'On Duty',
                customRole: roleId,
                isAuthorityAdmin: Boolean(m.isAuthorityAdmin),
                isActive: m.isActive !== false,
                isBanned: Boolean(m.isBanned)
            });
        } catch {
            toast.error('Failed to fetch official details');
            setSelectedMember(null);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!selectedMember) return;
        setSaving(true);
        try {
            await axios.put(
                `${import.meta.env.VITE_API_URL}/api/v1/admin/members/${selectedMember}`,
                {
                    ...editForm,
                    customRole: editForm.customRole || null
                },
                { withCredentials: true }
            );
            toast.success('Official access updated');
            setIsEditing(false);
            fetchAuthorities();
            openMemberDetails(selectedMember);
        } catch {
            toast.error('Failed to update official');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateOfficial = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/v1/admin/authorities`,
                {
                    ...createForm,
                    customRoleId: createForm.customRoleId || undefined
                },
                { withCredentials: true }
            );
            toast.success('Official account created');
            setShowCreateOfficial(false);
            setCreateForm({
                name: '',
                email: '',
                password: '',
                role: 'Authority',
                department: 'Power',
                authorityLevel: 'Junior',
                dutyStatus: 'On Duty',
                isAuthorityAdmin: false,
                customRoleId: ''
            });
            fetchAuthorities();
        } catch (err: unknown) {
            const msg = axios.isAxiosError<{ message?: string }>(err)
                ? err.response?.data?.message || 'Failed to create account'
                : 'Failed to create account';
            toast.error(msg);
        }
    };

    const handleSaveRole = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingRole) {
                await axios.put(
                    `${import.meta.env.VITE_API_URL}/api/v1/admin/roles/${editingRole._id}`,
                    roleForm,
                    { withCredentials: true }
                );
                toast.success('Role updated');
            } else {
                await axios.post(
                    `${import.meta.env.VITE_API_URL}/api/v1/admin/roles`,
                    roleForm,
                    { withCredentials: true }
                );
                toast.success('Role created');
            }
            setShowRoleModal(false);
            setEditingRole(null);
            fetchRoles();
        } catch (err: unknown) {
            const msg = axios.isAxiosError<{ message?: string }>(err)
                ? err.response?.data?.message || 'Failed to save role'
                : 'Failed to save role';
            toast.error(msg);
        }
    };

    const handleDeleteRole = async (roleId: string) => {
        try {
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/v1/admin/roles/${roleId}`,
                { withCredentials: true }
            );
            toast.success('Role deleted');
            fetchRoles();
        } catch (err: unknown) {
            const msg = axios.isAxiosError<{ message?: string }>(err)
                ? err.response?.data?.message || 'Failed to delete role'
                : 'Failed to delete role';
            toast.error(msg);
        }
    };

    const togglePermission = (perm: string) => {
        setRoleForm((prev) => ({
            ...prev,
            permissions: prev.permissions.includes(perm)
                ? prev.permissions.filter((p) => p !== perm)
                : [...prev.permissions, perm]
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900">Officials, Authority Admins & Roles</h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Create Authority Admins or department staff, configure custom roles, toggle access, or reset passwords in one click.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-xl bg-slate-200/70 p-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab('officials')}
                            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                activeTab === 'officials' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                            }`}
                        >
                            Officials & Admins
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('roles')}
                            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                activeTab === 'roles' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                            }`}
                        >
                            Roles & Permissions ({roles.length})
                        </button>
                    </div>

                    {activeTab === 'officials' ? (
                        <button
                            type="button"
                            onClick={() => setShowCreateOfficial(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                        >
                            <Plus size={16} /> Create Official / Admin
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingRole(null);
                                setRoleForm({ name: '', scope: 'Authority', description: '', permissions: ['resolve_tasks'] });
                                setShowRoleModal(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                        >
                            <Plus size={16} /> Create Role
                        </button>
                    )}
                </div>
            </div>

            {activeTab === 'officials' ? (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200">
                            <div className="text-xs font-bold text-slate-500 uppercase">Total Staff & Admins</div>
                            <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{summary.total}</div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200">
                            <div className="text-xs font-bold text-emerald-600 uppercase">Present (On Duty)</div>
                            <div className="text-2xl font-black text-emerald-700 mt-1 tabular-nums">{summary.presentCount}</div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200">
                            <div className="text-xs font-bold text-slate-500 uppercase">Disabled Accounts</div>
                            <div className="text-2xl font-black text-slate-700 mt-1 tabular-nums">{summary.disabledCount}</div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200">
                            <div className="text-xs font-bold text-rose-600 uppercase">Blocked Accounts</div>
                            <div className="text-2xl font-black text-rose-700 mt-1 tabular-nums">{summary.blockedCount}</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search official, email..."
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                                />
                            </div>
                            <CustomSelect
                                value={deptFilter}
                                onChange={(e) => setDeptFilter(e.target.value)}
                                options={[{ value: 'All', label: 'All Departments' }, ...DEPT_OPTIONS, { value: 'Master Admin', label: 'Master Admin' }]}
                                className="bg-slate-50 text-xs"
                            />
                            <CustomSelect
                                value={dutyFilter}
                                onChange={(e) => setDutyFilter(e.target.value)}
                                options={[{ value: 'All', label: 'All Duty Statuses' }, ...DUTY_OPTIONS]}
                                className="bg-slate-50 text-xs"
                            />
                            <CustomSelect
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                options={[
                                    { value: 'All', label: 'All Account States' },
                                    { value: 'active', label: 'Enabled & Unblocked' },
                                    { value: 'disabled', label: 'Disabled Only' },
                                    { value: 'blocked', label: 'Blocked Only' }
                                ]}
                                className="bg-slate-50 text-xs"
                            />
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase font-bold">
                                        <th className="p-4">Official</th>
                                        <th className="p-4">Department & Tier</th>
                                        <th className="p-4">Duty Status</th>
                                        <th className="p-4">Workload</th>
                                        <th className="p-4">Enabled</th>
                                        <th className="p-4 text-right">Block / Reset / Inspect</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-slate-400">Loading staff roster...</td>
                                        </tr>
                                    ) : authorities.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-slate-400">No officials match the current filters.</td>
                                        </tr>
                                    ) : (
                                        authorities.map((auth) => {
                                            const isEnabled = auth.isActive !== false;
                                            const isBlocked = Boolean(auth.isBanned);
                                            return (
                                                <tr key={auth._id} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="p-4">
                                                        <div className="font-bold text-slate-900 flex items-center gap-2">
                                                            {auth.name || auth.email}
                                                            {auth.isAuthorityAdmin && (
                                                                <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-black">
                                                                    ALL-DEPT ADMIN
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-slate-500">{auth.email}</div>
                                                        {auth.customRole && (
                                                            <div className="text-[11px] font-semibold text-indigo-600 mt-0.5">
                                                                Role: {auth.customRole.name}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-semibold text-slate-800">{auth.department || 'Master Admin'}</div>
                                                        <span className="text-xs font-bold text-slate-500">{auth.role === 'Admin' ? 'System Admin' : auth.authorityLevel}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span
                                                            className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                                                auth.dutyStatus === 'On Duty'
                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                    : auth.dutyStatus === 'Busy'
                                                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                                            }`}
                                                        >
                                                            {auth.dutyStatus || 'On Duty'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-xs tabular-nums">
                                                        <div className="font-bold text-indigo-700">{auth.activeTasksCount ?? 0} active</div>
                                                        <div className="text-slate-500">{auth.completedTasksCount ?? 0} completed</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleStatus(auth._id, { isActive: !isEnabled })}
                                                            aria-label="Toggle enabled status"
                                                            className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                                                                isEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                                                            }`}
                                                        >
                                                            <div
                                                                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                                                                    isEnabled ? 'translate-x-6' : 'translate-x-0'
                                                                }`}
                                                            />
                                                        </button>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleStatus(auth._id, { isBanned: !isBlocked })}
                                                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                                                                    isBlocked
                                                                        ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700'
                                                                        : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
                                                                }`}
                                                            >
                                                                {isBlocked ? 'Unblock' : 'Block'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleResetPassword(auth._id)}
                                                                title="One-Click Reset Password"
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold cursor-pointer"
                                                            >
                                                                <KeyRound size={13} /> Reset PW
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => openMemberDetails(auth._id)}
                                                                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer"
                                                                title="Inspect & Edit"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {roles.map((role) => (
                        <div key={role._id} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 flex flex-col">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-black text-slate-900">{role.name}</h3>
                                        {role.isSystem && (
                                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">SYSTEM</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">{role.description}</p>
                                </div>
                                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                                    {role.scope}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5 flex-1">
                                {role.permissions.map((perm) => (
                                    <span key={perm} className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700">
                                        {perm.replace(/_/g, ' ')}
                                    </span>
                                ))}
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                <span className="inline-flex items-center gap-1 font-bold text-slate-600">
                                    <Users size={13} /> {role.assignedCount ?? 0} assigned
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingRole(role);
                                            setRoleForm({
                                                name: role.name,
                                                scope: role.scope === 'Admin' ? 'Admin' : 'Authority',
                                                description: role.description || '',
                                                permissions: role.permissions
                                            });
                                            setShowRoleModal(true);
                                        }}
                                        className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold cursor-pointer"
                                    >
                                        Edit
                                    </button>
                                    {!role.isSystem && (
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteRole(role._id)}
                                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <MemberDetailsModal
                isOpen={Boolean(selectedMember)}
                onClose={() => setSelectedMember(null)}
                loading={loadingDetails}
                memberDetails={memberDetails}
                variant="authority"
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                saving={saving}
                onSave={handleSaveEdit}
                onQuickResetPassword={selectedMember ? () => handleResetPassword(selectedMember) : undefined}
                editFormContent={
                    <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Department</label>
                            <CustomSelect value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} options={DEPT_OPTIONS} className="bg-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hierarchy Tier</label>
                            <CustomSelect value={editForm.authorityLevel} onChange={(e) => setEditForm({ ...editForm, authorityLevel: e.target.value })} options={LEVEL_OPTIONS} className="bg-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Duty Presence</label>
                            <CustomSelect value={editForm.dutyStatus} onChange={(e) => setEditForm({ ...editForm, dutyStatus: e.target.value })} options={DUTY_OPTIONS} className="bg-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Assigned Role</label>
                            <CustomSelect
                                value={editForm.customRole}
                                onChange={(e) => setEditForm({ ...editForm, customRole: e.target.value })}
                                options={[
                                    { value: '', label: 'Default Tier Permissions' },
                                    ...roles.map((r) => ({ value: r._id, label: r.name }))
                                ]}
                                className="bg-white"
                            />
                        </div>
                        <div className="flex flex-col gap-2 pb-1">
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editForm.isAuthorityAdmin}
                                    onChange={(e) => setEditForm({ ...editForm, isAuthorityAdmin: e.target.checked })}
                                />
                                Authority Admin (All Depts)
                            </label>
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editForm.isActive}
                                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                                />
                                Account Enabled
                            </label>
                        </div>
                    </div>
                }
            />

            {showCreateOfficial && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="text-orange-600" size={22} />
                                <h3 className="text-lg font-black text-slate-900">Create Official / Authority Admin</h3>
                            </div>
                            <button type="button" onClick={() => setShowCreateOfficial(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateOfficial} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Full Display Name (e.g., Awanish Verma · Power)</label>
                                <input
                                    type="text"
                                    required
                                    value={createForm.name}
                                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                    placeholder="Awanish Verma · Power"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Official Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={createForm.email}
                                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                        placeholder="awanish.power@civicpulse.gov"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Initial Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={createForm.password}
                                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Portal Role</label>
                                    <CustomSelect
                                        value={createForm.role}
                                        onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                                        options={[
                                            { value: 'Authority', label: 'Authority Official' },
                                            { value: 'Admin', label: 'System Super Admin' }
                                        ]}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Custom Role</label>
                                    <CustomSelect
                                        value={createForm.customRoleId}
                                        onChange={(e) => setCreateForm({ ...createForm, customRoleId: e.target.value })}
                                        options={[
                                            { value: '', label: 'Auto by Tier' },
                                            ...roles.map((r) => ({ value: r._id, label: r.name }))
                                        ]}
                                    />
                                </div>
                            </div>

                            {createForm.role === 'Authority' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Department</label>
                                        <CustomSelect value={createForm.department} onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })} options={DEPT_OPTIONS} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Hierarchy Tier</label>
                                        <CustomSelect value={createForm.authorityLevel} onChange={(e) => setCreateForm({ ...createForm, authorityLevel: e.target.value })} options={LEVEL_OPTIONS} />
                                    </div>
                                </div>
                            )}

                            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-orange-50 border border-orange-200 text-xs font-bold text-orange-900 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={createForm.isAuthorityAdmin}
                                    onChange={(e) => setCreateForm({ ...createForm, isAuthorityAdmin: e.target.checked })}
                                />
                                Grant Authority Admin Access (Manage ALL departments, tasks, and officials inside Authority Panel)
                            </label>

                            <button
                                type="submit"
                                className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm cursor-pointer"
                            >
                                Create Account
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showRoleModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900">{editingRole ? 'Edit Role & Permissions' : 'Create Custom Role'}</h3>
                            <button type="button" onClick={() => setShowRoleModal(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveRole} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Role Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={roleForm.name}
                                        onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                                        placeholder="e.g., Zonal Coordinator"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Scope</label>
                                    <CustomSelect
                                        value={roleForm.scope}
                                        onChange={(e) => setRoleForm({ ...roleForm, scope: e.target.value as 'Authority' | 'Admin' })}
                                        options={[
                                            { value: 'Authority', label: 'Authority Scope' },
                                            { value: 'Admin', label: 'Admin Scope' }
                                        ]}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={roleForm.description}
                                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2">Permissions</label>
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 rounded-2xl bg-slate-50 border border-slate-200">
                                    {availablePermissions.map((perm) => (
                                        <label key={perm} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={roleForm.permissions.includes(perm)}
                                                onChange={() => togglePermission(perm)}
                                            />
                                            {perm.replace(/_/g, ' ')}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm cursor-pointer"
                            >
                                {editingRole ? 'Save Role Changes' : 'Create Role'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <TempPasswordModal data={resetModalData} onClose={() => setResetModalData(null)} />
        </div>
    );
};

export default ManageAuthorities;
