import React, { useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
    User as UserIcon,
    Mail,
    Phone,
    Building2,
    ShieldCheck,
    KeyRound,
    Save,
    Edit3,
    X,
    CheckCircle2,
    Clock,
    BadgeCheck,
    Eye,
    EyeOff
} from 'lucide-react';
import api from '../../config/api';
import { AuthContext } from '../../context/AuthContext';
import type { DutyStatus, RoleSummary } from '../../types';

interface StaffProfilePageProps {
    variant: 'admin' | 'authority';
}

const DUTY_OPTIONS: DutyStatus[] = ['On Duty', 'Busy', 'Off Duty', 'On Leave'];

const StaffProfilePage: React.FC<StaffProfilePageProps> = ({ variant }) => {
    const { user, fetchUser } = useContext(AuthContext);
    const isAdminTheme = variant === 'admin';

    const [isEditing, setIsEditing] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [bio, setBio] = useState('');
    const [dutyStatus, setDutyStatus] = useState<DutyStatus>('On Duty');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    useEffect(() => {
        if (!user) return;
        setName(user.name || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
        setBio(user.bio || '');
        setDutyStatus(user.dutyStatus || 'On Duty');
    }, [user]);

    if (!user) {
        return (
            <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center text-slate-500">
                Please sign in to view your profile.
            </div>
        );
    }

    const customRoleObj =
        user.customRole && typeof user.customRole === 'object'
            ? (user.customRole as RoleSummary)
            : null;

    const handleCancelEdit = () => {
        setName(user.name || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
        setBio(user.bio || '');
        setDutyStatus(user.dutyStatus || 'On Duty');
        setIsEditing(false);
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Full name is required');
            return;
        }
        setSavingProfile(true);
        try {
            await api.patch('/user/me', {
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                bio: bio.trim(),
                dutyStatus
            });
            await fetchUser();
            setIsEditing(false);
            toast.success('Profile updated successfully');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update profile';
            toast.error(msg);
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('New password and confirmation do not match');
            return;
        }
        setSavingPassword(true);
        try {
            await api.post('/user/change-password', {
                currentPassword,
                newPassword
            });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            toast.success('Password changed successfully');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to change password';
            toast.error(msg);
        } finally {
            setSavingPassword(false);
        }
    };

    const accentBg = isAdminTheme
        ? 'from-orange-500 to-red-600 shadow-orange-500/20'
        : 'from-emerald-500 to-teal-600 shadow-emerald-500/20';
    const accentBtn = isAdminTheme
        ? 'bg-orange-600 hover:bg-orange-700 text-white'
        : 'bg-emerald-600 hover:bg-emerald-700 text-white';
    const accentBadge = isAdminTheme
        ? 'bg-orange-50 text-orange-700 border-orange-200'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200';
    const focusBorder = isAdminTheme ? 'focus:border-orange-500' : 'focus:border-emerald-500';

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900">
                        {isAdminTheme ? 'Administrator Profile' : 'Authority Official Profile'}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        View your non-anonymous municipal credentials, contact details, permissions, and update account security.
                    </p>
                </div>

                {!isEditing && (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors cursor-pointer ${accentBtn}`}
                    >
                        <Edit3 size={16} />
                        Edit Profile Details
                    </button>
                )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className={`w-20 h-20 rounded-3xl bg-linear-to-br ${accentBg} flex items-center justify-center font-black text-3xl text-white shadow-lg shrink-0`}>
                            {(user.name || user.email || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-2xl font-black text-slate-900">
                                    {user.name || 'Official Member'}
                                </h2>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${accentBadge}`}>
                                    {user.isAuthorityAdmin
                                        ? (user.role === 'Admin' ? 'Master Admin' : 'Authority Admin (All Depts)')
                                        : `${user.authorityLevel || user.role} Officer`}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                    {user.dutyStatus || 'On Duty'}
                                </span>
                            </div>
                            <div className="text-sm text-slate-500 flex items-center gap-3 flex-wrap">
                                <span className="inline-flex items-center gap-1.5">
                                    <Mail size={14} className="text-slate-400" />
                                    {user.email}
                                </span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Building2 size={14} className="text-slate-400" />
                                    {user.department || 'General Administration'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:items-end gap-1 text-xs text-slate-500">
                        <div className="font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                            ID: {user.anonymousId || user._id}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mt-1">
                            <CheckCircle2 size={12} />
                            Non-Anonymous Verified Account
                        </span>
                    </div>
                </div>

                {isEditing ? (
                    <form onSubmit={handleSaveProfile} className="p-6 sm:p-8 space-y-5 bg-slate-50/40">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900 focus:outline-none ${focusBorder}`}
                                    placeholder="e.g. Awanish Verma · Master Admin"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Official Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900 focus:outline-none ${focusBorder}`}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Contact Phone</label>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+91 98XXXXXX00"
                                    className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-none ${focusBorder}`}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Duty Presence</label>
                                <select
                                    value={dutyStatus}
                                    onChange={(e) => setDutyStatus(e.target.value as DutyStatus)}
                                    className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900 focus:outline-none ${focusBorder}`}
                                >
                                    {DUTY_OPTIONS.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Bio / Responsibilities</label>
                            <textarea
                                rows={3}
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                maxLength={300}
                                placeholder="Add your municipal jurisdiction or office note..."
                                className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none ${focusBorder}`}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold cursor-pointer"
                            >
                                <X size={15} />
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={savingProfile}
                                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50 ${accentBtn}`}
                            >
                                <Save size={15} />
                                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <UserIcon size={13} /> Full Name
                            </div>
                            <div className="text-sm font-black text-slate-900">{user.name || 'Not set'}</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <Mail size={13} /> Official Email
                            </div>
                            <div className="text-sm font-bold text-slate-900 break-all">{user.email}</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <Phone size={13} /> Phone Number
                            </div>
                            <div className="text-sm font-bold text-slate-900">{user.phone || 'Not provided'}</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <Building2 size={13} /> Department & Tier
                            </div>
                            <div className="text-sm font-bold text-slate-900">
                                {user.department || 'General Administration'} ({user.authorityLevel || user.role})
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <BadgeCheck size={13} /> Assigned System Role
                            </div>
                            <div className="text-sm font-bold text-slate-900">
                                {customRoleObj ? customRoleObj.name : user.role}
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <Clock size={13} /> Joined Date
                            </div>
                            <div className="text-sm font-bold text-slate-900">
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Official'}
                            </div>
                        </div>
                        {user.bio && (
                            <div className="sm:col-span-2 lg:col-span-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bio / Responsibilities</div>
                                <div className="text-sm text-slate-700">{user.bio}</div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {Array.isArray(user.permissions) && user.permissions.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                        <ShieldCheck size={18} className={isAdminTheme ? 'text-orange-600' : 'text-emerald-600'} />
                        Active Role Permissions
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {user.permissions.map((perm) => (
                            <span
                                key={perm}
                                className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono text-xs font-bold text-slate-700"
                            >
                                {perm}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <KeyRound size={19} className={isAdminTheme ? 'text-orange-600' : 'text-emerald-600'} />
                            Update Password
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Change your account password while keeping your session active.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer"
                    >
                        {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
                        {showPasswords ? 'Hide' : 'Show'}
                    </button>
                </div>

                <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Current Password</label>
                        <input
                            type={showPasswords ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm focus:outline-none ${focusBorder}`}
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">New Password</label>
                        <input
                            type={showPasswords ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                            className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm focus:outline-none ${focusBorder}`}
                            placeholder="Min 6 characters"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Confirm New Password</label>
                        <input
                            type={showPasswords ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm focus:outline-none ${focusBorder}`}
                            placeholder="Confirm password"
                        />
                    </div>
                    <div className="md:col-span-3 flex justify-end">
                        <button
                            type="submit"
                            disabled={savingPassword}
                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${accentBtn}`}
                        >
                            <KeyRound size={15} />
                            {savingPassword ? 'Updating Password...' : 'Change Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StaffProfilePage;
