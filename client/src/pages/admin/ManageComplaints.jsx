import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Eye, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

const ManageComplaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchComplaints = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/admin/complaints`, { withCredentials: true });
            
            const formattedComplaints = data.data.complaints.map(comp => ({
                id: comp._id,
                title: comp.title,
                category: comp.category,
                status: comp.status,
                date: new Date(comp.createdAt).toLocaleDateString(),
                location: comp.location?.address || 'Unknown'
            }));
            
            setComplaints(formattedComplaints);
        } catch (error) {
            toast.error("Failed to load complaints");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();

        const socket = io(`${import.meta.env.VITE_API_URL}`);
        socket.on('connect', () => socket.emit('joinAdminRoom'));
        socket.on('stats_update', (data) => {
            if (data.type === 'new_complaint' || data.type === 'complaint_resolved' || data.type === 'complaint_deleted') {
                fetchComplaints();
            }
        });

        return () => socket.disconnect();
    }, []);

    const handleAdminDelete = async (complaintId) => {
        if (!window.confirm("Are you sure you want to permanently delete this complaint? This is an administrative override.")) return;
        
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/admin/complaints/${complaintId}`, { withCredentials: true });
            toast.success("Complaint forcefully deleted");
            // The socket will trigger fetchComplaints automatically
        } catch (error) {
            toast.error("Failed to delete complaint");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800">Complaint Management</h1>
                    <p className="text-slate-500 mt-1">Global view of all platform complaints and their statuses.</p>
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
                            placeholder="Search complaints by ID, title, or location..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase font-bold">
                            <tr>
                                <th className="px-6 py-4">Title</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={`skel-${i}`} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-3/4"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-1/2"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-2/3"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-1/2"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded-full w-20"></div></td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                                                <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                                                <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : complaints.map((comp) => (
                                <tr key={comp.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-800">{comp.title}</td>
                                    <td className="px-6 py-4">{comp.category}</td>
                                    <td className="px-6 py-4">{comp.location}</td>
                                    <td className="px-6 py-4 text-slate-500">{comp.date}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                            comp.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                                            comp.status === 'In Progress' ? 'bg-indigo-100 text-indigo-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                            {comp.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                <Eye size={16} />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleAdminDelete(comp.id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors tooltip-trigger"
                                                title="Force Delete Override"
                                            >
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

export default ManageComplaints;
