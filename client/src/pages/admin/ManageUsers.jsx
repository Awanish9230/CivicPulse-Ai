import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, MoreVertical, Edit2, Trash2, Ban, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/v1/admin/citizens', { withCredentials: true });
            
            // Map the returned users to the format expected by the table
            const formattedUsers = data.data.users.map(user => ({
                id: user._id,
                anonymousId: user.anonymousId,
                role: user.role,
                joined: new Date(user.createdAt).toLocaleDateString(),
                status: user.isSuspended ? 'Suspended' : 'Active', // Assuming we have isSuspended later
                complaints: user.complaintsCount
            }));
            
            setUsers(formattedUsers);
        } catch (error) {
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800">Citizen Management</h1>
                    <p className="text-slate-500 mt-1">Manage all registered users and their platform access.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium">
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
                                <th className="px-6 py-4">Joined Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-800">{user.anonymousId}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium">{user.complaints}</td>
                                    <td className="px-6 py-4 text-slate-500">{user.joined}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                            user.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                        }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                                                <Ban size={16} />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
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

export default ManageUsers;
