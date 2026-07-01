import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { CheckSquare, ArrowUpRight, Clock, MapPin, AlertCircle, Map, UserPlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { AuthContext } from '../../context/AuthContext';

const AuthorityTasks = () => {
    const { user } = useContext(AuthContext);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedMapId, setExpandedMapId] = useState(null);

    // Assignment Modal State
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [departmentMembers, setDepartmentMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    const isSeniorOrHOD = user?.role === 'Admin' || user?.authorityLevel === 'Senior' || user?.authorityLevel === 'HOD';

    const fetchTasks = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/authority/tasks`, {
                withCredentials: true
            });
            setTasks(data.data);
        } catch (error) {
            toast.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleEscalate = async (taskId) => {
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/authority/tasks/${taskId}/escalate`, {}, {
                withCredentials: true
            });
            toast.success(data.message);
            fetchTasks(); // refresh board
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to escalate task');
        }
    };

    const handleUpdateTask = async (taskId, updates) => {
        try {
            const { data } = await axios.patch(`${import.meta.env.VITE_API_URL}/api/v1/authority/tasks/${taskId}`, updates, {
                withCredentials: true
            });
            toast.success(data.message);
            fetchTasks(); // refresh board
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update task');
        }
    };

    const getDepartmentForCategory = (category) => {
        switch(category) {
            case 'Road':
            case 'Construction':
                return 'Public Works';
            case 'Electricity':
            case 'Street Light':
                return 'Power';
            case 'Garbage':
            case 'Water':
            case 'Drainage':
            case 'Illegal Dumping':
                return 'Water & Sanitation';
            case 'Traffic':
                return 'Traffic & Safety';
            case 'Animal':
                return 'Animal Control';
            default:
                return 'General Administration';
        }
    };

    const openAssignModal = async (taskId) => {
        setSelectedTaskId(taskId);
        setAssignModalOpen(true);
        setLoadingMembers(true);
        
        const task = tasks.find(t => t._id === taskId);
        const targetDepartment = task ? getDepartmentForCategory(task.category) : null;

        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/authority/department-members`, {
                withCredentials: true
            });
            
            // Filter members based on department and rank
            const filteredMembers = data.data.filter(member => {
                // If the user is Admin, they can assign anyone in the target department
                // If the user is Authority, they only got their own department members anyway, but we still ensure rank rules
                
                const isCorrectDepartment = user?.role === 'Admin' ? member.department === targetDepartment : true;
                
                // Rank rules: 
                // Admin can assign to anyone
                // HOD can assign to Senior, Junior
                // Senior can assign to Junior
                let isCorrectRank = false;
                if (user?.role === 'Admin') isCorrectRank = true;
                else if (user?.authorityLevel === 'HOD') isCorrectRank = ['Senior', 'Junior'].includes(member.authorityLevel);
                else if (user?.authorityLevel === 'Senior') isCorrectRank = member.authorityLevel === 'Junior';
                
                return isCorrectDepartment && isCorrectRank;
            });

            setDepartmentMembers(filteredMembers);
        } catch (error) {
            toast.error('Failed to load department members');
        } finally {
            setLoadingMembers(false);
        }
    };

    const handleAssign = async (assigneeId) => {
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/authority/tasks/${selectedTaskId}/assign`, { assigneeId }, {
                withCredentials: true
            });
            toast.success(data.message);
            setAssignModalOpen(false);
            fetchTasks();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign task');
        }
    };

    const getPriorityColor = (priority) => {
        switch(priority) {
            case 'Critical': return 'text-red-600 bg-red-100 border-red-200';
            case 'High': return 'text-orange-600 bg-orange-100 border-orange-200';
            case 'Medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
            case 'Low': return 'text-green-600 bg-green-100 border-green-200';
            default: return 'text-slate-600 bg-slate-100 border-slate-200';
        }
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Task Board</h1>
                    <p className="text-slate-500 mt-1">Manage and escalate incoming civic complaints.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
                </div>
            ) : tasks.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
                        <CheckSquare size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">You're all caught up!</h3>
                    <p className="text-slate-500">There are no active tasks assigned to your escalation level.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {tasks.map((task) => (
                        <motion.div 
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={task._id}
                            className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                        >
                            <div className="p-6 flex flex-col flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(task.priority)}`}>
                                        {task.priority} Priority
                                    </span>
                                    <span className="text-xs font-bold text-slate-400">
                                        ID: {task._id.slice(-6).toUpperCase()}
                                    </span>
                                </div>
                                
                                <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1">
                                    {task.category} Issue
                                </h3>

                                {(task.imageUrls?.[0] || task.imageUrl) && (
                                    <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 h-48 bg-slate-100 flex-shrink-0">
                                        <img src={task.imageUrls?.[0] || task.imageUrl} alt="Issue" className="w-full h-full object-cover" />
                                    </div>
                                )}

                                <p className="text-slate-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                                    {task.description}
                                </p>

                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center text-slate-500 text-sm">
                                        <MapPin size={16} className="mr-2 text-emerald-500" />
                                        <span className="line-clamp-1">{task.address?.fullAddress || 'Location provided via GPS'}</span>
                                    </div>
                                    <div className="flex items-center text-slate-500 text-sm">
                                        <Clock size={16} className="mr-2 text-slate-400" />
                                        <span>Reported {new Date(task.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {task.escalationLevel !== 'Junior' && (
                                        <div className="flex items-center text-red-500 text-sm font-bold">
                                            <AlertCircle size={16} className="mr-2" />
                                            <span>Escalated to: {task.escalationLevel}</span>
                                        </div>
                                    )}
                                    {task.assignedTo && (
                                        <div className="flex items-center text-indigo-600 text-sm font-bold bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                                            <div className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-xs mr-2 border border-indigo-300">
                                                {task.assignedTo.name.substring(0,2).toUpperCase()}
                                            </div>
                                            <span>Handling: {task.assignedTo.name} ({task.assignedTo.authorityLevel})</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-auto">
                                    <div className="pt-4 border-t border-slate-100 space-y-3 pb-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">Update Status</label>
                                            <select 
                                                value={task.status} 
                                                onChange={(e) => handleUpdateTask(task._id, { status: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                                            >
                                                <option value="Submitted">Submitted</option>
                                                <option value="Verified">Verified</option>
                                                <option value="Assigned">Assigned</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Resolved">Resolved</option>
                                                <option value="Rejected">Rejected</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">Expected Completion</label>
                                            <input 
                                                type="date" 
                                                value={task.expectedCompletionDate ? new Date(task.expectedCompletionDate).toISOString().split('T')[0] : ''}
                                                onChange={(e) => handleUpdateTask(task._id, { expectedCompletionDate: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-2">
                                        <button 
                                            onClick={() => setExpandedMapId(expandedMapId === task._id ? null : task._id)}
                                            className="text-emerald-600 font-bold text-sm hover:text-emerald-700 transition-colors flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg flex-1 justify-center"
                                        >
                                            <Map size={14} />
                                            {expandedMapId === task._id ? 'Hide Map' : 'Location'}
                                        </button>
                                        
                                        {isSeniorOrHOD && (
                                            <button 
                                                onClick={() => openAssignModal(task._id)}
                                                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center transition-colors flex-1 justify-center"
                                            >
                                                <UserPlus size={14} className="mr-1" />
                                                Assign
                                            </button>
                                        )}

                                        {task.escalationLevel !== 'HOD' && (
                                            <button 
                                                onClick={() => handleEscalate(task._id)}
                                                className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center transition-colors flex-1 justify-center"
                                            >
                                                Escalate
                                                <ArrowUpRight size={14} className="ml-1" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {expandedMapId === task._id && task.location?.coordinates && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                                        >
                                            <div className="h-48 w-full">
                                                <MapContainer 
                                                    center={[task.location.coordinates[1], task.location.coordinates[0]]} 
                                                    zoom={16} 
                                                    scrollWheelZoom={false} 
                                                    className="h-full w-full z-0"
                                                >
                                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                    <Marker position={[task.location.coordinates[1], task.location.coordinates[0]]} />
                                                </MapContainer>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Assignment Modal */}
            <AnimatePresence>
                {assignModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setAssignModalOpen(false)}
                        />
                        
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl w-full max-w-2xl shadow-xl z-10 overflow-hidden flex flex-col max-h-[80vh]"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900">Assign Task</h2>
                                    <p className="text-slate-500 text-sm mt-1">Select an official from your department.</p>
                                </div>
                                <button onClick={() => setAssignModalOpen(false)} className="p-2 hover:bg-white rounded-full text-slate-400 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                {loadingMembers ? (
                                    <div className="flex justify-center p-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {departmentMembers.map(member => (
                                            <div key={member._id} className="flex items-center justify-between p-4 border border-slate-200 rounded-2xl hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors group">
                                                <div>
                                                    <h4 className="font-bold text-slate-900 group-hover:text-emerald-700">{member.name}</h4>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                                            {member.authorityLevel}
                                                        </span>
                                                        <span className="text-xs text-slate-500 flex items-center">
                                                            <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
                                                            {member.activeTasks} Active
                                                        </span>
                                                        <span className="text-xs text-slate-500 flex items-center">
                                                            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
                                                            {member.completedTasks} Completed
                                                        </span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleAssign(member._id)}
                                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                                                >
                                                    Assign
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AuthorityTasks;
