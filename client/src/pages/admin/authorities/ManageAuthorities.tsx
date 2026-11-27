import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Eye, ShieldAlert, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import CustomSelect from '../../../components/common/CustomSelect';
import MemberDetailsModal, { type MemberDetailsData, type SelectOption } from '../../../components/admin/MemberDetailsModal';

interface ApiAuthority {
    _id: string;
    name?: string;
    department?: string;
    authorityLevel?: string;
    isBanned?: boolean;
    tasksCount?: number;
}

interface AuthorityListItem {
    id: string;
    name: string;
    department: string;
    level: string;
    status: 'Active' | 'Blocked';
    isBanned: boolean;
    tasks: number;
}

interface EditAuthorityForm {
    department: string;
    authorityLevel: string;
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

const STATUS_OPTIONS: SelectOption[] = [
    { value: 'active', label: 'Active' },
    { value: 'banned', label: 'Suspended (Blocked)' },
];

const ManageAuthorities: React.FC = () => {
    const [authorities, setAuthorities] = useState<AuthorityListItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [selectedMember, setSelectedMember] = useState<string | null>(null);
    const [memberDetails, setMemberDetails] = useState<MemberDetailsData | null>(null);
    const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editForm, setEditForm] = useState<EditAuthorityForm>({ department: '', authorityLevel: '', isBanned: false });
    const [saving, setSaving] = useState<boolean>(false);

    const fetchAuthorities = async (): Promise<void> => {
        try {
            const { data } = await axios.get<{ data: { authorities: ApiAuthority[] } }>(
                `${import.meta.env.VITE_API_URL}/api/v1/admin/authorities`,
                { withCredentials: true }
            );

            const formattedAuthorities: AuthorityListItem[] = data.data.authorities.map((auth) => ({
                id: auth._id,
                name: auth.name || '',
                department: auth.department || 'Unassigned',
                level: auth.authorityLevel || 'Unknown',
                status: auth.isBanned ? 'Blocked' : 'Active',
                isBanned: Boolean(auth.isBanned),
                tasks: auth.tasksCount || 0
            }));

            setAuthorities(formattedAuthorities);
        } catch {
            toast.error("Failed to load authorities");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuthorities();

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
            setEditForm({
                department: data.data.member.department || '',
                authorityLevel: data.data.member.authorityLevel || '',
                isBanned: Boolean(data.data.member.isBanned)
            });
        } catch {
            toast.error('Failed to fetch authority details');
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
            toast.success("Authority updated successfully");
            setIsEditing(false);
            openMemberDetails(selectedMember);
        } catch {
            toast.error("Failed to update authority");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800">Authority Management</h1>
                    <p className="text-slate-500 mt-1">Manage officials, approve registrations, and assign departments.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-xl text-white hover:bg-indigo-700 font-medium shadow-lg shadow-indigo-200">
                        Add Authority
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by Name or Department..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase font-bold">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Department</th>
                                <th className="px-6 py-4">Level</th>
                                <th className="px-6 py-4">Assigned Tasks</th>
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
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded-full w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded w-8"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded-full w-16"></div></td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                                                <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : authorities.map((auth) => (
                                <tr key={auth.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                            {auth.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        {auth.name}
                                    </td>
                                    <td className="px-6 py-4">{auth.department}</td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                auth.level === 'HOD'
                                                    ? 'bg-red-50 text-red-700'
                                                    : auth.level === 'Senior'
                                                        ? 'bg-purple-50 text-purple-700'
                                                        : 'bg-indigo-50 text-indigo-700'
                                            }`}
                                        >
                                            {auth.level}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium">
                                        <div className="flex items-center text-slate-700 bg-slate-100 w-max px-2 py-0.5 rounded-lg">
                                            {auth.tasks}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                auth.isBanned ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                                            }`}
                                        >
                                            {auth.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openMemberDetails(auth.id)}
                                                className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-bold text-xs flex items-center"
                                            >
                                                <Eye size={14} className="mr-1" /> Deep Dive
                                            </button>
                                            {auth.isBanned ? (
                                                <button
                                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors tooltip-trigger"
                                                    title="Allow Authority"
                                                >
                                                    <CheckCircle2 size={16} />
                                                </button>
                                            ) : (
                                                <button
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors tooltip-trigger"
                                                    title="Block Authority"
                                                >
                                                    <ShieldAlert size={16} />
                                                </button>
                                            )}
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
                variant="authority"
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                saving={saving}
                onSave={handleSaveEdit}
                editFormContent={
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Department</label>
                            <CustomSelect
                                value={editForm.department}
                                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                                options={DEPT_OPTIONS}
                                className="w-full h-[38px]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Authority Level</label>
                            <CustomSelect
                                value={editForm.authorityLevel}
                                onChange={(e) => setEditForm({ ...editForm, authorityLevel: e.target.value })}
                                options={LEVEL_OPTIONS}
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

export default ManageAuthorities;
