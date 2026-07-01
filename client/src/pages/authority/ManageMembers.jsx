import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plus, Users, Search, Shield, Building } from 'lucide-react';
import { motion } from 'framer-motion';

const ManageMembers = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        authorityLevel: 'Junior',
        department: 'General'
    });

    const fetchMembers = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/authority/members`, {
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
            setFormData({ name: '', email: '', password: '', authorityLevel: 'Junior', department: 'General' });
            fetchMembers(); // Refresh the list
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create member');
        }
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Manage Members</h1>
                    <p className="text-slate-500 mt-1">Add or review authority personnel (Officer access only)</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                >
                    <Plus size={20} />
                    Add Member
                </button>
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
                                    <th className="px-6 py-4 font-bold text-slate-600 text-sm">Email</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 text-sm">Level</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 text-sm">Department</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 text-sm">Status</th>
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
                                        <tr key={member._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                                                    {member.name ? member.name.substring(0,2).toUpperCase() : 'A'}
                                                </div>
                                                {member.name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 text-sm">{member.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center w-max gap-1
                                                    ${member.authorityLevel === 'HOD' ? 'bg-red-100 text-red-600' : 
                                                      member.authorityLevel === 'Senior' ? 'bg-purple-100 text-purple-600' : 
                                                      'bg-green-100 text-green-600'}`}>
                                                    <Shield size={12} />
                                                    {member.authorityLevel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 text-sm flex items-center gap-1.5">
                                                <Building size={14} className="text-slate-400" />
                                                {member.department}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-full border border-green-200">
                                                    Active
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
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
                                        <option value="General">General / Master Admin</option>
                                        <option value="Sanitation">Sanitation & Garbage</option>
                                        <option value="Roads">Roads & Transport</option>
                                        <option value="Electricity">Electricity & Power</option>
                                        <option value="Water">Water & Sewage</option>
                                        <option value="Animal Control">Animal Control</option>
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
