import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, MoreVertical, Edit2, Trash2, ShieldAlert, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ManageAuthorities = () => {
    const [authorities, setAuthorities] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAuthorities = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/v1/admin/authorities', { withCredentials: true });
            
            const formattedAuthorities = data.data.authorities.map(auth => ({
                id: auth._id,
                name: auth.name,
                department: auth.department || 'Unassigned',
                level: auth.authorityLevel || 'Unknown',
                status: auth.isBanned ? 'Blocked' : 'Active',
                isBanned: auth.isBanned,
                tasks: auth.tasksCount || 0
            }));
            
            setAuthorities(formattedAuthorities);
        } catch (error) {
            toast.error("Failed to load authorities");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuthorities();
    }, []);

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
                            {authorities.map((auth) => (
                                <tr key={auth.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-800">{auth.name}</td>
                                    <td className="px-6 py-4">{auth.department}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                                            {auth.level}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium">{auth.tasks}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                            auth.isBanned ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                            {auth.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {auth.isBanned ? (
                                                <button 
                                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors tooltip-trigger" 
                                                    title="Allow Authority"
                                                    onClick={() => {/* Implement unban */}}
                                                >
                                                    <CheckCircle2 size={16} />
                                                </button>
                                            ) : (
                                                <button 
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors tooltip-trigger" 
                                                    title="Block Authority"
                                                    onClick={() => {/* Implement ban */}}
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
        </div>
    );
};

export default ManageAuthorities;
