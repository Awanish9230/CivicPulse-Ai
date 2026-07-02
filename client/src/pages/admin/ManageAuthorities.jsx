import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Eye, Ban, ShieldAlert, CheckCircle2, Activity, CheckCircle, MapPin, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const ManageAuthorities = () => {
    const [authorities, setAuthorities] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [selectedMember, setSelectedMember] = useState(null);
    const [memberDetails, setMemberDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [expandedMapId, setExpandedMapId] = useState(null);

    const fetchAuthorities = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/admin/authorities`, { withCredentials: true });
            
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

    const openMemberDetails = async (memberId) => {
        setSelectedMember(memberId);
        setLoadingDetails(true);
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/admin/members/${memberId}`, {
                withCredentials: true
            });
            setMemberDetails(data.data);
        } catch (error) {
            toast.error('Failed to fetch authority details');
            setSelectedMember(null);
        } finally {
            setLoadingDetails(false);
        }
    };

    const getPriorityColor = (priority) => {
        switch(priority) {
            case 'Critical': return 'text-red-600 bg-red-100';
            case 'High': return 'text-orange-600 bg-orange-100';
            case 'Medium': return 'text-yellow-600 bg-yellow-100';
            case 'Low': return 'text-green-600 bg-green-100';
            default: return 'text-slate-600 bg-slate-100';
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
                            {authorities.map((auth) => (
                                <tr key={auth.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                            {auth.name.substring(0,2).toUpperCase()}
                                        </div>
                                        {auth.name}
                                    </td>
                                    <td className="px-6 py-4">{auth.department}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                            auth.level === 'HOD' ? 'bg-red-50 text-red-700' :
                                            auth.level === 'Senior' ? 'bg-purple-50 text-purple-700' :
                                            'bg-indigo-50 text-indigo-700'
                                        }`}>
                                            {auth.level}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium">
                                        <div className="flex items-center text-slate-700 bg-slate-100 w-max px-2 py-0.5 rounded-lg">
                                            {auth.tasks}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                            auth.isBanned ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                            {auth.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => openMemberDetails(auth.id)}
                                                className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-bold text-xs flex items-center"
                                            >
                                                <Eye size={14} className="mr-1"/> Deep Dive
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

            {/* Deep Dive Modal */}
            <AnimatePresence>
                {selectedMember && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setSelectedMember(null)}
                        />
                        
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {loadingDetails || !memberDetails ? (
                                <div className="p-12 flex justify-center items-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-indigo-50/30">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-2xl shadow-sm border-2 border-indigo-200">
                                                {memberDetails.member.name ? memberDetails.member.name.substring(0,2).toUpperCase() : 'A'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h2 className="text-2xl font-black text-slate-900">{memberDetails.member.name}</h2>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                        memberDetails.member.isBanned ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                        {memberDetails.member.isBanned ? 'BLOCKED' : 'ACTIVE'}
                                                    </span>
                                                </div>
                                                <p className="text-slate-500 text-sm font-medium mt-1 flex items-center gap-2">
                                                    <span className="font-bold text-slate-700">{memberDetails.member.authorityLevel}</span> •
                                                    <span>{memberDetails.member.department}</span> •
                                                    <span>{memberDetails.member.email}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedMember(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                            <X size={24} />
                                        </button>
                                    </div>

                                    <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center">
                                                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mr-4">
                                                    <Activity size={24} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Active Load</div>
                                                    <div className="text-3xl font-black text-slate-900">{memberDetails.stats.activeCount}</div>
                                                </div>
                                            </div>
                                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center">
                                                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mr-4">
                                                    <CheckCircle size={24} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Completed</div>
                                                    <div className="text-3xl font-black text-slate-900">{memberDetails.stats.completedCount}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center">
                                            <Activity size={18} className="mr-2 text-indigo-500" />
                                            Active Assigned Tasks
                                        </h3>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                            {memberDetails.activeTasks.length === 0 ? (
                                                <div className="col-span-2 p-6 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl">No active tasks assigned to this authority.</div>
                                            ) : (
                                                memberDetails.activeTasks.map(task => (
                                                    <div key={task._id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${getPriorityColor(task.priority)}`}>
                                                                {task.priority}
                                                            </span>
                                                            <span className="text-xs font-bold text-slate-400">ID: {task._id.slice(-6).toUpperCase()}</span>
                                                        </div>
                                                        <h4 className="font-bold text-slate-800 mb-1">{task.category} Issue</h4>
                                                        <p className="text-sm text-slate-500 line-clamp-2 mb-3 flex-1">{task.description}</p>
                                                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                                                            <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                                                {task.status}
                                                            </div>
                                                            <button 
                                                                onClick={() => setExpandedMapId(expandedMapId === task._id ? null : task._id)}
                                                                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center"
                                                            >
                                                                <MapPin size={12} className="mr-1"/> Location
                                                            </button>
                                                        </div>

                                                        {/* Map Expansion */}
                                                        <AnimatePresence>
                                                            {expandedMapId === task._id && task.location?.coordinates && (
                                                                <motion.div 
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: 'auto' }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    className="mt-3 rounded-xl overflow-hidden border border-slate-200 h-32"
                                                                >
                                                                    <MapContainer 
                                                                        center={[task.location.coordinates[1], task.location.coordinates[0]]} 
                                                                        zoom={15} 
                                                                        scrollWheelZoom={false} 
                                                                        className="h-full w-full z-0"
                                                                    >
                                                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                                        <Marker position={[task.location.coordinates[1], task.location.coordinates[0]]} />
                                                                    </MapContainer>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center">
                                            <CheckCircle size={18} className="mr-2 text-emerald-500" />
                                            Recently Completed Tasks ({memberDetails.stats.completedCount})
                                        </h3>
                                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-xs font-bold text-slate-500">ID</th>
                                                        <th className="px-4 py-3 text-xs font-bold text-slate-500">Category</th>
                                                        <th className="px-4 py-3 text-xs font-bold text-slate-500">Resolved Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {memberDetails.completedTasks.slice(0, 10).map(task => (
                                                        <tr key={task._id} className="border-t border-slate-100">
                                                            <td className="px-4 py-3 text-xs font-mono text-slate-400">{task._id.slice(-6).toUpperCase()}</td>
                                                            <td className="px-4 py-3 text-sm font-medium text-slate-700">{task.category}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-500">{new Date(task.updatedAt).toLocaleDateString()}</td>
                                                        </tr>
                                                    ))}
                                                    {memberDetails.completedTasks.length === 0 && (
                                                        <tr>
                                                            <td colSpan="3" className="px-4 py-4 text-center text-slate-500 text-sm">No resolved tasks.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ManageAuthorities;
