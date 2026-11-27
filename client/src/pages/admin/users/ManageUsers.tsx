import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Eye, Ban, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import CustomSelect from '../../../components/common/CustomSelect';
import MemberDetailsModal, { type MemberDetailsData, type SelectOption } from '../../../components/admin/MemberDetailsModal';

interface ApiUser {
    _id: string;
    anonymousId?: string;
    role: string;
    createdAt?: string;
    isBanned?: boolean;
    complaintsCount?: number;
    strikes?: number;
}

interface UserListItem {
    id: string;
    anonymousId: string;
    role: string;
    joined: string;
    status: 'Active' | 'Suspended';
    complaints: number;
    strikes: number;
}

interface EditUserForm {
    role: string;
    isBanned: boolean;
}

const ROLE_OPTIONS: SelectOption[] = [
    { value: 'Citizen', label: 'Citizen' },
    { value: 'Authority', label: 'Authority' },
    { value: 'Admin', label: 'Admin' },
];

const STATUS_OPTIONS: SelectOption[] = [
    { value: 'active', label: 'Active' },
    { value: 'banned', label: 'Banned' },
];

const ManageUsers: React.FC = () => {
    const [users, setUsers] = useState<UserListItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');

    const [selectedMember, setSelectedMember] = useState<string | null>(null);
    const [memberDetails, setMemberDetails] = useState<MemberDetailsData | null>(null);
    const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editForm, setEditForm] = useState<EditUserForm>({ role: '', isBanned: false });
    const [saving, setSaving] = useState<boolean>(false);

    const fetchUsers = async (): Promise<void> => {
        try {
            const { data } = await axios.get<{ data: { users: ApiUser[] } }>(
                `${import.meta.env.VITE_API_URL}/api/v1/admin/citizens`,
                { withCredentials: true }
            );

            const formattedUsers: UserListItem[] = data.data.users.map((user) => ({
                id: user._id,
                anonymousId: user.anonymousId || '',
                role: user.role,
                joined: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
                status: user.isBanned ? 'Suspended' : 'Active',
                complaints: user.complaintsCount || 0,
                strikes: user.strikes || 0
            }));

            setUsers(formattedUsers);
        } catch {
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

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
    }, []);

    const openMemberDetails = async (memberId: string): Promise<void> => {
        setSelectedMember(memberId);
        setLoadingDetails(true);
        setIsEditing(false);
        try {
            const { data } = await axios.get<{ data: MemberDetailsData }>(
                `${import.meta.env.VITE_API_URL}/api/v1/admin/members/${memberId}`,
                { withCredentials: true }
            );
            setMemberDetails(data.data);
            setEditForm({ role: data.data.member.role, isBanned: Boolean(data.data.member.isBanned) });
        } catch {
            toast.error('Failed to fetch user details');
            setSelectedMember(null);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleSaveEdit = async (): Promise<void> => {
        if (!selectedMember) return;
        setSaving(true);
        try {
            await axios.put(
                `${import.meta.env.VITE_API_URL}/api/v1/admin/members/${selectedMember}`,
                editForm,
                { withCredentials: true }
            );
            toast.success("User updated successfully");
            setIsEditing(false);
            openMemberDetails(selectedMember);
        } catch {
            toast.error("Failed to update user");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800">Citizen Management</h1>
                    <p className="text-slate-500 mt-1">Manage all registered users and their platform access.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium shadow-sm">
                        <Filter size={18} />
                        Filters
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by Anonymous ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase font-bold">
                            <tr>
                                <th className="px-6 py-4">Anonymous ID</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Complaints Filed</th>
                                <th className="px-6 py-4">Strikes</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={`skel-${i}`} className="animate-pulse">
                                        <td className="px-6 py-4 flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                                            <div className="h-4 bg-slate-200 rounded w-24"></div>
                                        </td>
                                        <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded-full w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded w-8"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-4"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded-full w-16"></div></td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                                                <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : users.filter((u) => u.anonymousId.toLowerCase().includes(searchTerm.toLowerCase())).map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                            {user.anonymousId.substring(3, 5)}
                                        </div>
                                        {user.anonymousId}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium">
                                        <div className="flex items-center text-slate-700 bg-slate-100 w-max px-2 py-0.5 rounded-lg">
                                            {user.complaints}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium">
                                        {user.strikes > 0 ? (
                                            <span className="text-red-500 font-bold flex items-center gap-1"><ShieldAlert size={14} /> {user.strikes}</span>
                                        ) : (
                                            <span className="text-slate-400">0</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                user.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                            }`}
                                        >
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openMemberDetails(user.id)}
                                                className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-bold text-xs flex items-center"
                                            >
                                                <Eye size={14} className="mr-1" /> Deep Dive
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                                <Ban size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
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
                editFormContent={
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">System Role</label>
                            <CustomSelect
                                value={editForm.role}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                options={ROLE_OPTIONS}
                                className="w-full h-[38px]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Account Status</label>
                            <CustomSelect
                                value={editForm.isBanned ? 'banned' : 'active'}
                                onChange={(e) => setEditForm({ ...editForm, isBanned: e.target.value === 'banned' })}
                                options={STATUS_OPTIONS}
                                className="w-full h-[38px]"
                            />
                        </div>
                    </div>
                }
            />
        </div>
    );
};

export default ManageUsers;
