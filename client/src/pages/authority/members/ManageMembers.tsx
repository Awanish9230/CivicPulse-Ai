import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plus, Shield, Building, Activity, CheckCircle } from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext';
import AddMemberModal, { type MemberFormData } from './components/AddMemberModal';
import EmployeeReportModal, { type AuthorityMember, type EmployeeReportData } from './components/EmployeeReportModal';

const getErrorMessage = (error: unknown, fallback: string): string => {
    if (axios.isAxiosError<{ message?: string }>(error)) {
        return error.response?.data?.message || fallback;
    }
    return fallback;
};

const ManageMembers: React.FC = () => {
    const authContext = useContext(AuthContext);
    const user = authContext?.user ?? null;
    const [members, setMembers] = useState<AuthorityMember[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [showModal, setShowModal] = useState<boolean>(false);
    const [formData, setFormData] = useState<MemberFormData>({
        name: '', email: '', password: '', authorityLevel: 'Junior', department: 'General Administration'
    });

    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
    const [reportData, setReportData] = useState<EmployeeReportData | null>(null);
    const [loadingReport, setLoadingReport] = useState<boolean>(false);

    const isHODorAdmin = user?.role === 'Admin' || user?.isAuthorityAdmin || user?.authorityLevel === 'HOD';

    const fetchMembers = async (): Promise<void> => {
        try {
            const { data } = await axios.get<{ data: AuthorityMember[] }>(
                `${import.meta.env.VITE_API_URL}/api/v1/authority/department-members`,
                { withCredentials: true }
            );
            setMembers(data.data);
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Failed to fetch members'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: string } }): void => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        try {
            const { data } = await axios.post<{ message: string }>(
                `${import.meta.env.VITE_API_URL}/api/v1/authority/create`,
                formData,
                { withCredentials: true }
            );
            toast.success(data.message);
            setShowModal(false);
            setFormData({ name: '', email: '', password: '', authorityLevel: 'Junior', department: 'General Administration' });
            fetchMembers();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Failed to create member'));
        }
    };

    const openEmployeeReport = async (employeeId: string): Promise<void> => {
        setSelectedEmployee(employeeId);
        setLoadingReport(true);
        try {
            const { data } = await axios.get<{ data: EmployeeReportData }>(
                `${import.meta.env.VITE_API_URL}/api/v1/authority/employee-report/${employeeId}`,
                { withCredentials: true }
            );
            setReportData(data.data);
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Failed to load employee report'));
            setSelectedEmployee(null);
        } finally {
            setLoadingReport(false);
        }
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Manage Members</h1>
                    <p className="text-slate-500 mt-1">Review department personnel and their performance.</p>
                </div>
                {isHODorAdmin && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                    >
                        <Plus size={20} />
                        Add Member
                    </button>
                )}
            </div>

            {loading ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex justify-between items-center py-4 border-b border-slate-100 animate-pulse">
                            <div className="flex gap-4 items-center">
                                <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                                <div className="space-y-2">
                                    <div className="w-32 h-4 bg-slate-200 rounded"></div>
                                    <div className="w-24 h-3 bg-slate-200 rounded"></div>
                                </div>
                            </div>
                            <div className="w-20 h-6 bg-slate-200 rounded-full"></div>
                            <div className="w-24 h-4 bg-slate-200 rounded"></div>
                            <div className="w-12 h-6 bg-slate-200 rounded"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 font-bold text-slate-600 text-sm">Name</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 text-sm">Level</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 text-sm">Department</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 text-sm">Active Tasks</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 text-sm">Completed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                            No authority members found.
                                        </td>
                                    </tr>
                                ) : (
                                    members.map((member) => (
                                        <tr
                                            key={member._id}
                                            onClick={() => openEmployeeReport(member._id)}
                                            className="border-b border-slate-100 hover:bg-emerald-50/50 transition-colors cursor-pointer"
                                        >
                                            <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-sm border-2 border-emerald-200">
                                                    {member.name ? member.name.substring(0, 2).toUpperCase() : 'A'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{member.name || 'N/A'}</div>
                                                    <div className="text-xs text-slate-400 font-normal">{member.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center w-max gap-1 ${
                                                        member.authorityLevel === 'HOD'
                                                            ? 'bg-red-100 text-red-600 border border-red-200'
                                                            : member.authorityLevel === 'Senior'
                                                                ? 'bg-purple-100 text-purple-600 border border-purple-200'
                                                                : 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                                                    }`}
                                                >
                                                    <Shield size={12} />
                                                    {member.authorityLevel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 text-sm font-semibold flex items-center gap-1.5 mt-2">
                                                <Building size={14} className="text-slate-400" />
                                                {member.department}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-blue-600 font-bold bg-blue-50 w-max px-3 py-1 rounded-lg border border-blue-100">
                                                    <Activity size={14} className="mr-1.5" />
                                                    {member.activeTasks || 0}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-emerald-600 font-bold bg-emerald-50 w-max px-3 py-1 rounded-lg border border-emerald-100">
                                                    <CheckCircle size={14} className="mr-1.5" />
                                                    {member.completedTasks || 0}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <EmployeeReportModal
                isOpen={Boolean(selectedEmployee)}
                loading={loadingReport}
                reportData={reportData}
                onClose={() => setSelectedEmployee(null)}
            />

            <AddMemberModal
                isOpen={showModal}
                formData={formData}
                onChange={handleChange}
                onClose={() => setShowModal(false)}
                onSubmit={handleSubmit}
            />
        </div>
    );
};

export default ManageMembers;
