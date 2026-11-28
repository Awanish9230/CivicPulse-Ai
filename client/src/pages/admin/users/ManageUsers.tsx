import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Eye, Ban, ShieldAlert, KeyRound } from 'lucide-react';
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

interface ApiUser {
    _id: string;
    anonymousId?: string;
    email?: string;
    role: string;
    createdAt?: string;
    isActive?: boolean;
    isBanned?: boolean;
    complaintsCount?: number;
    strikes?: number;
}

interface EditUserForm {
    role: string;
    isActive: boolean;
    isBanned: boolean;
}

const ROLE_OPTIONS: SelectOption[] = [
    { value: 'Citizen', label: 'Citizen' },
    { value: 'Authority', label: 'Authority' },
    { value: 'Admin', label: 'Admin' },
];

const ManageUsers: React.FC = () => {
    const [users, setUsers] = useState<ApiUser[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('All');

    const [selectedMember, setSelectedMember] = useState<string | null>(null);
    const [memberDetails, setMemberDetails] = useState<MemberDetailsData | null>(null);
    const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editForm, setEditForm] = useState<EditUserForm>({ role: '', isActive: true, isBanned: false });
    const [saving, setSaving] = useState<boolean>(false);
    const [resetModalData, setResetModalData] = useState<ResetPasswordResult | null>(null);

    const fetchUsers = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (searchTerm.trim()) params.set('search', searchTerm.trim());
            if (statusFilter !== 'All') params.set('status', statusFilter);

            const { data } = await axios.get<{ data: { users: ApiUser[] } }>(
                `${import.meta.env.VITE_API_URL}/api/v1/admin/citizens?${params.toString()}`,
                { withCredentials: true }
            );
            setUsers(data.data.users || []);
        } catch {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [searchTerm, statusFilter]);

    useEffect(() => {
        fetchUsers();

        const socket = io(`${import.meta.env.VITE_API_URL}`);
        socket.on('connect', () => socket.emit('joinAdminRoom'));
        socket.on('stats_update', (data: { type: string }) => {
            if (data.type === 'new_user') fetchUsers();
        });
        socket.on('user_updated', () => {
            fetchUsers();
        });

        return () => {
            socket.disconnect();
        };
    }, [fetchUsers]);

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
            toast.success('Citizen account status updated');
            fetchUsers();
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
            setEditForm({
                role: data.data.member.role,
                isActive: data.data.member.isActive !== false,
                isBanned: Boolean(data.data.member.isBanned)
            });
        } catch {
            toast.error('Failed to fetch user details');
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
                editForm,
                { withCredentials: true }
            );
            toast.success('User updated successfully');
            setIsEditing(false);
            fetchUsers();
            openMemberDetails(selectedMember);
        } catch {
            toast.error('Failed to update user');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900">Manage Citizens</h1>
                <p className="text-slate-500 mt-1 text-sm">
                    Inspect citizen engagement, enable/disable or block accounts, change roles, or issue 1-click password resets.
                </p>
            </div>

            <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by email or name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                        />
                    </div>
                    <div className="w-full sm:w-52">
                        <CustomSelect
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            options={[
                                { value: 'All', label: 'All States' },
                                { value: 'active', label: 'Enabled & Active' },
                                { value: 'disabled', label: 'Disabled Only' },
                                { value: 'blocked', label: 'Blocked Only' }
                            ]}
                            className="bg-slate-50 text-xs"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase font-bold">
                                <th className="p-4">Citizen Identity</th>
                                <th className="p-4">Joined</th>
                                <th className="p-4">Reports / Strikes</th>
                                <th className="p-4">Enabled</th>
                                <th className="p-4 text-right">Block / Reset / Inspect</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400">Loading citizens...</td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400">No citizens found.</td>
                                </tr>
                            ) : (
                                users.map((u) => {
                                    const isEnabled = u.isActive !== false;
                                    const isBlocked = Boolean(u.isBanned);
                                    return (
                                        <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="p-4">
                                                <div className="font-mono font-bold text-slate-800">{u.anonymousId || u._id.slice(-6)}</div>
                                                <div className="text-xs text-slate-500">{u.email}</div>
                                            </td>
                                            <td className="p-4 text-slate-500 text-xs">
                                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800">{u.complaintsCount ?? 0} filed</div>
                                                <span className={`inline-flex items-center gap-1 text-xs font-bold ${(u.strikes ?? 0) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                                    <ShieldAlert size={12} /> {u.strikes ?? 0} strikes
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStatus(u._id, { isActive: !isEnabled })}
                                                    aria-label="Toggle citizen enabled status"
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
                                                        onClick={() => handleToggleStatus(u._id, { isBanned: !isBlocked })}
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                                                            isBlocked
                                                                ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700'
                                                                : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
                                                        }`}
                                                    >
                                                        <Ban size={12} />
                                                        {isBlocked ? 'Unblock' : 'Block'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleResetPassword(u._id)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold cursor-pointer"
                                                    >
                                                        <KeyRound size={12} /> Reset PW
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openMemberDetails(u._id)}
                                                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 cursor-pointer"
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

            <MemberDetailsModal
                isOpen={Boolean(selectedMember)}
                onClose={() => setSelectedMember(null)}
                loading={loadingDetails}
                memberDetails={memberDetails}
                variant="citizen"
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                saving={saving}
                onSave={handleSaveEdit}
                onQuickResetPassword={selectedMember ? () => handleResetPassword(selectedMember) : undefined}
                editFormContent={
                    <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Role</label>
                            <CustomSelect value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} options={ROLE_OPTIONS} className="bg-white" />
                        </div>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 pb-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={editForm.isActive}
                                onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                            />
                            Account Enabled
                        </label>
                        <label className="flex items-center gap-2 text-xs font-bold text-rose-700 pb-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={editForm.isBanned}
                                onChange={(e) => setEditForm({ ...editForm, isBanned: e.target.checked })}
                            />
                            Blocked / Suspended
                        </label>
                    </div>
                }
            />

            <TempPasswordModal data={resetModalData} onClose={() => setResetModalData(null)} />
        </div>
    );
};

export default ManageUsers;
