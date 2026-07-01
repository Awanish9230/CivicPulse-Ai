import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plus, Users, Shield, Building, X, Activity, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';

const ManageMembers = () => {
    const { user } = useContext(AuthContext);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Add Member Modal State
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', authorityLevel: 'Junior', department: 'General Administration'
    });

    // Employee Report Modal State
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);

    const isHODorAdmin = user?.role === 'Admin' || user?.authorityLevel === 'HOD';

    const fetchMembers = async () => {
        try {
            // Using department-members to get active/completed task counts too!
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/authority/department-members`, {
                withCredentials: true
            });
            setMembers(data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch members');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/authority/create`, formData, {
                withCredentials: true
            });
            toast.success(data.message);
            setShowModal(false);
            setFormData({ name: '', email: '', password: '', authorityLevel: 'Junior', department: 'General Administration' });
            fetchMembers(); // Refresh the list
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create member');
        }
    };

    const openEmployeeReport = async (employeeId) => {
        setSelectedEmployee(employeeId);
        setLoadingReport(true);
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/authority/employee-report/${employeeId}`, {
                withCredentials: true
            });
            setReportData(data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load employee report');
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
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
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
                                        <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
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
                                                    {member.name ? member.name.substring(0,2).toUpperCase() : 'A'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{member.name || 'N/A'}</div>
                                                    <div className="text-xs text-slate-400 font-normal">{member.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center w-max gap-1
                                                    ${member.authorityLevel === 'HOD' ? 'bg-red-100 text-red-600 border border-red-200' : 
                                                      member.authorityLevel === 'Senior' ? 'bg-purple-100 text-purple-600 border border-purple-200' : 
                                                      'bg-emerald-100 text-emerald-600 border border-emerald-200'}`}>
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

            {/* Employee Detailed Report Modal */}
            <AnimatePresence>
                {selectedEmployee && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setSelectedEmployee(null)}
                        />
                        
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {loadingReport || !reportData ? (
                                <div className="p-12 flex justify-center items-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-emerald-50/50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-2xl border-4 border-white shadow-sm">
                                                {reportData.employee.name ? reportData.employee.name.substring(0,2).toUpperCase() : 'A'}
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-900">{reportData.employee.name}</h2>
                                                <p className="text-slate-500 text-sm font-semibold flex items-center gap-2 mt-1">
                                                    <span>{reportData.employee.authorityLevel}</span> • 
                                                    <span>{reportData.employee.department}</span> • 
                                                    <span>{reportData.employee.email}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedEmployee(null)} className="p-2 hover:bg-white rounded-full text-slate-400 transition-colors">
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
                                                    <div className="text-3xl font-black text-slate-900">{reportData.stats.activeCount}</div>
                                                </div>
                                            </div>
                                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center">
                                                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mr-4">
                                                    <CheckCircle size={24} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Completed</div>
                                                    <div className="text-3xl font-black text-slate-900">{reportData.stats.completedCount}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center">
                                            <Clock size={18} className="mr-2 text-emerald-500" />
                                            Currently Active Tasks
                                        </h3>
                                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-8">
                                            {reportData.activeTasks.length === 0 ? (
                                                <div className="p-6 text-center text-slate-500 text-sm">No active tasks assigned to this employee.</div>
                                            ) : (
                                                <table className="w-full text-left">
                                                    <thead>
                                                        <tr className="bg-slate-50 border-b border-slate-100">
                                                            <th className="px-4 py-3 text-xs font-bold text-slate-500">ID</th>
                                                            <th className="px-4 py-3 text-xs font-bold text-slate-500">Category</th>
                                                            <th className="px-4 py-3 text-xs font-bold text-slate-500">Priority</th>
                                                            <th className="px-4 py-3 text-xs font-bold text-slate-500">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {reportData.activeTasks.map(task => (
                                                            <tr key={task._id} className="border-b border-slate-50 last:border-0">
                                                                <td className="px-4 py-3 text-xs font-mono text-slate-400">{task._id.slice(-6).toUpperCase()}</td>
                                                                <td className="px-4 py-3 text-sm font-bold text-slate-700">{task.category}</td>
                                                                <td className="px-4 py-3">
                                                                    <span className="text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-600">{task.priority}</span>
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-slate-600">{task.status}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Member Modal (Only HOD or Admin can add members) */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
                    >
                        <h2 className="text-2xl font-black mb-6 text-slate-900">Add New Authority</h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                                <input 
                                    type="text" 
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" 
                                    placeholder="John Doe" 
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Official Email</label>
                                <input 
                                    type="email" 
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" 
                                    placeholder="officer@domain.gov" 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                                <input 
                                    type="password" 
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" 
                                    placeholder="Secure password" 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Level</label>
                                    <select 
                                        name="authorityLevel"
                                        value={formData.authorityLevel}
                                        onChange={handleChange}
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                    >
                                        <option value="Junior">Junior</option>
                                        <option value="Senior">Senior</option>
                                        <option value="HOD">Head of Dept (HOD)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Department</label>
                                    <select 
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                    >
                                        <option value="Public Works">Public Works</option>
                                        <option value="Water & Sanitation">Water & Sanitation</option>
                                        <option value="Power">Power</option>
                                        <option value="Traffic & Safety">Traffic & Safety</option>
                                        <option value="Animal Control">Animal Control</option>
                                        <option value="General Administration">General Administration</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md"
                                >
                                    Create Member
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default ManageMembers;
