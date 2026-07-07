import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { CheckSquare, ArrowUpRight, Clock, MapPin, AlertCircle, Map as MapIcon, UserPlus, X, Camera, Search, Filter, Download, List, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { AuthContext } from '../../context/AuthContext';
import ImageCarousel from '../../components/common/ImageCarousel';
import CameraCapture from '../../components/complaints/CameraCapture';
import CustomSelect from '../../components/common/CustomSelect';

const AuthorityTasks = () => {
    const { user } = useContext(AuthContext);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedMapId, setExpandedMapId] = useState(null);

    // Advanced Filtering & View State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterPriority, setFilterPriority] = useState('All');
    const [filterCategory, setFilterCategory] = useState('All');
    const [sortBy, setSortBy] = useState('Newest');
    const [viewMode, setViewMode] = useState('List'); // 'List' or 'Map'
    const [replyMessages, setReplyMessages] = useState({});

    // Assignment Modal State
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [departmentMembers, setDepartmentMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    // Resolution Modal State
    const [resolveModalOpen, setResolveModalOpen] = useState(false);
    const [resolutionImages, setResolutionImages] = useState([]);
    const [resolutionGps, setResolutionGps] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [testModeBypass, setTestModeBypass] = useState(false);
    const [resolving, setResolving] = useState(false);

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

    const handleResolveTask = async (e) => {
        e.preventDefault();
        if (resolutionImages.length < 2) {
            toast.error("At least 2 resolution images are required.");
            return;
        }
        if (!resolutionGps && !testModeBypass) {
            toast.error("GPS location is required to resolve this task.");
            return;
        }

        setResolving(true);
        const formData = new FormData();
        formData.append('status', 'Resolved');
        
        // Convert data URLs to blobs if they are from CameraCapture
        for (let i = 0; i < resolutionImages.length; i++) {
            const img = resolutionImages[i];
            if (typeof img === 'string' && img.startsWith('data:image')) {
                const res = await fetch(img);
                const blob = await res.blob();
                formData.append('resolutionImages', blob, `resolution_${i}.jpg`);
            } else {
                formData.append('resolutionImages', img);
            }
        }
        
        if (resolutionGps) {
            formData.append('gps[lat]', resolutionGps.lat);
            formData.append('gps[lng]', resolutionGps.lng);
        }
        if (testModeBypass) {
            formData.append('testModeBypass', 'true');
        }

        try {
            const { data } = await axios.patch(`${import.meta.env.VITE_API_URL}/api/v1/authority/tasks/${selectedTaskId}`, formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            toast.success(data.message);
            setResolveModalOpen(false);
            setResolutionImages([]);
            setResolutionGps(null);
            setTestModeBypass(false);
            fetchTasks(); // refresh board
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to resolve task');
        } finally {
            setResolving(false);
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
        }
    };

    const exportToCSV = () => {
        const headers = ['ID', 'Category', 'Priority', 'Status', 'Description', 'Date Reported', 'Location'];
        const csvRows = [headers.join(',')];
        
        filteredTasks.forEach(task => {
            const row = [
                task._id,
                task.category,
                task.priority,
                task.status,
                `"${task.description?.replace(/"/g, '""') || ''}"`,
                new Date(task.createdAt).toLocaleDateString(),
                `"${task.address?.fullAddress || ''}"`
            ];
            csvRows.push(row.join(','));
        });
        
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `tasks_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("CSV Export downloaded!");
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.description?.toLowerCase().includes(searchTerm.toLowerCase()) || task._id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || task.status === filterStatus;
        const matchesPriority = filterPriority === 'All' || task.priority === filterPriority;
        const matchesCategory = filterCategory === 'All' || task.category === filterCategory;
        return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    }).sort((a, b) => {
        if (sortBy === 'Newest') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'Oldest') return new Date(a.createdAt) - new Date(b.createdAt);
        if (sortBy === 'Priority (High)') {
            const levels = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
            return (levels[b.priority] || 0) - (levels[a.priority] || 0);
        }
        return 0;
    });

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Task Board</h1>
                    <p className="text-slate-500 mt-1">Manage and escalate incoming civic complaints.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={exportToCSV} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
                        <Download size={18} /> Export CSV
                    </button>
                    <div className="flex bg-slate-200 p-1 rounded-xl">
                        <button 
                            onClick={() => setViewMode('List')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'List' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <List size={16} /> List
                        </button>
                        <button 
                            onClick={() => setViewMode('Map')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'Map' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <MapIcon size={16} /> Map
                        </button>
                    </div>
                </div>
            </div>

            {/* Control Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search tasks by ID or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                </div>
                <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
                    <CustomSelect 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        options={[
                            { value: 'All', label: 'All Statuses' },
                            { value: 'Submitted', label: 'Submitted' },
                            { value: 'Verified', label: 'Verified' },
                            { value: 'In Progress', label: 'In Progress' },
                            { value: 'Resolved', label: 'Resolved' }
                        ]}
                        className="w-40 bg-slate-50"
                    />
                    <CustomSelect 
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        options={[
                            { value: 'All', label: 'All Priorities' },
                            { value: 'Critical', label: 'Critical' },
                            { value: 'High', label: 'High' },
                            { value: 'Medium', label: 'Medium' },
                            { value: 'Low', label: 'Low' }
                        ]}
                        className="w-40 bg-slate-50"
                    />
                    <CustomSelect 
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        options={[
                            { value: 'All', label: 'All Categories' },
                            { value: 'Road', label: 'Road' },
                            { value: 'Water', label: 'Water' },
                            { value: 'Electricity', label: 'Electricity' },
                            { value: 'Garbage', label: 'Garbage' }
                        ]}
                        className="w-40 bg-slate-50"
                    />
                    <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block"></div>
                    <CustomSelect 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        options={[
                            { value: 'Newest', label: 'Newest First' },
                            { value: 'Oldest', label: 'Oldest First' },
                            { value: 'Priority (High)', label: 'Highest Priority' }
                        ]}
                        className="w-40 bg-slate-50"
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col gap-4 shadow-sm animate-pulse h-[400px]">
                            <div className="flex justify-between">
                                <div className="w-24 h-6 bg-slate-200 rounded-full"></div>
                                <div className="w-16 h-6 bg-slate-200 rounded"></div>
                            </div>
                            <div className="w-3/4 h-6 bg-slate-200 rounded mt-2"></div>
                            <div className="w-full h-40 bg-slate-200 rounded-xl"></div>
                            <div className="w-full h-4 bg-slate-200 rounded"></div>
                            <div className="w-1/2 h-4 bg-slate-200 rounded"></div>
                        </div>
                    ))}
                </div>
            ) : tasks.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
                        <CheckSquare size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">You're all caught up!</h3>
                    <p className="text-slate-500">There are no active tasks assigned to your escalation level.</p>
                </div>
            ) : viewMode === 'Map' ? (
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm h-[600px] relative">
                    <MapContainer 
                        center={[20.5937, 78.9629]} // Default to India center, you could calculate bounds here
                        zoom={5} 
                        style={{ height: '100%', width: '100%', zIndex: 0 }}
                    >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        {filteredTasks.filter(t => t.location?.coordinates).map(task => (
                            <Marker 
                                key={task._id} 
                                position={[task.location.coordinates[1], task.location.coordinates[0]]}
                            >
                                <Popup className="rounded-xl overflow-hidden">
                                    <div className="p-1 min-w-[200px]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">ID: {task._id.slice(-6).toUpperCase()}</span>
                                        </div>
                                        <h4 className="font-bold text-slate-800 mb-1">{task.category}</h4>
                                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{task.description}</p>
                                        <button onClick={() => setViewMode('List')} className="w-full py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors">
                                            View Details
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <Search size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">No tasks found</h3>
                    <p className="text-slate-500">Try adjusting your search or filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredTasks.map((task) => (
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

                                {(task.imageUrls?.length > 0 || task.imageUrl) && (
                                    <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 h-48 bg-slate-100 flex-shrink-0 relative group">
                                        <ImageCarousel images={task.imageUrls?.length > 0 ? task.imageUrls : [task.imageUrl]} />
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
                                            <CustomSelect 
                                                value={task.status} 
                                                onChange={(e) => {
                                                    if (e.target.value === 'Resolved') {
                                                        setSelectedTaskId(task._id);
                                                        setResolveModalOpen(true);
                                                    } else {
                                                        handleUpdateTask(task._id, { status: e.target.value });
                                                    }
                                                }}
                                                options={[
                                                    { value: 'Submitted', label: 'Submitted' },
                                                    { value: 'Verified', label: 'Verified' },
                                                    { value: 'Assigned', label: 'Assigned' },
                                                    { value: 'In Progress', label: 'In Progress' },
                                                    { value: 'Resolved', label: 'Resolved' },
                                                    { value: 'Rejected', label: 'Rejected' }
                                                ]}
                                                className="w-full bg-slate-50 focus:ring-2 focus:ring-emerald-500"
                                            />
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
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">Send Official Reply</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={replyMessages[task._id] || ''}
                                                    onChange={(e) => setReplyMessages({...replyMessages, [task._id]: e.target.value})}
                                                    placeholder="Type a message to the citizen..."
                                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                                                />
                                                <button 
                                                    onClick={() => {
                                                        if(replyMessages[task._id]?.trim()) {
                                                            handleUpdateTask(task._id, { replyMessage: replyMessages[task._id] });
                                                            setReplyMessages({...replyMessages, [task._id]: ''});
                                                        }
                                                    }}
                                                    disabled={!replyMessages[task._id]?.trim()}
                                                    className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-colors"
                                                >
                                                    <Send size={16} />
                                                </button>
                                            </div>
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

            {/* Resolve Modal */}
            <AnimatePresence>
                {resolveModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => {
                                setResolveModalOpen(false);
                                setResolutionImages([]);
                            }}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800">Resolve Task</h3>
                                    <p className="text-xs font-medium text-slate-500 mt-1">Upload proof of resolution</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        setResolveModalOpen(false);
                                        setResolutionImages([]);
                                    }}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <form onSubmit={handleResolveTask} className="p-4 md:p-6 flex flex-col gap-4">
                                <div className="bg-orange-50 border border-orange-200 text-orange-800 text-sm font-medium p-4 rounded-xl flex items-start gap-3">
                                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                    <p>You must upload <strong>at least 2 images</strong> showing the resolved issue. The citizen will be asked to verify this resolution.</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Resolution Images (Min 2)</label>
                                    
                                    <div className="flex gap-4">
                                        {resolutionImages.length < 5 && (
                                            <button 
                                                type="button"
                                                onClick={() => setIsCameraOpen(true)}
                                                className="w-24 h-24 shrink-0 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 text-emerald-600 flex flex-col items-center justify-center gap-2 hover:bg-emerald-100 hover:border-emerald-400 transition-colors"
                                            >
                                                <Camera size={24} />
                                                <span className="text-xs font-bold">Live Capture</span>
                                            </button>
                                        )}
                                        <div className="flex-1 flex gap-2 overflow-x-auto pb-2">
                                            {resolutionImages.map((img, i) => (
                                                <div key={i} className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden relative border border-slate-200">
                                                    <img src={typeof img === 'string' ? img : URL.createObjectURL(img)} alt="Resolution" className="w-full h-full object-cover" />
                                                    <button 
                                                        type="button"
                                                        onClick={() => setResolutionImages(resolutionImages.filter((_, idx) => idx !== i))}
                                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-md p-1 opacity-80 hover:opacity-100"
                                                    >
                                                        <X size={12}/>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        For authenticity, resolutions must be captured live at the physical location.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 mt-2 bg-slate-100 p-3 rounded-xl border border-slate-200">
                                    <input 
                                        type="checkbox" 
                                        id="testModeBypass" 
                                        checked={testModeBypass}
                                        onChange={(e) => setTestModeBypass(e.target.checked)}
                                        className="w-4 h-4 text-emerald-600 bg-white border-slate-300 rounded focus:ring-emerald-500"
                                    />
                                    <label htmlFor="testModeBypass" className="text-sm font-bold text-slate-700">
                                        [DEV ONLY] Bypass GPS Radius & AI Verification
                                    </label>
                                </div>

                                {resolutionImages.length > 0 && (
                                    <div className="text-sm font-medium text-slate-600">
                                        {resolutionImages.length} image(s) selected
                                    </div>
                                )}

                                <div className="mt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setResolveModalOpen(false);
                                            setResolutionImages([]);
                                            setResolutionGps(null);
                                        }}
                                        className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={resolving || resolutionImages.length < 2}
                                        className="flex-1 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/20"
                                    >
                                        {resolving ? 'Uploading...' : 'Submit Resolution'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Camera Overlay */}
            <AnimatePresence>
                {isCameraOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100]"
                    >
                        <CameraCapture 
                            onClose={() => setIsCameraOpen(false)}
                            onCapture={(data) => {
                                setResolutionImages(prev => [...prev, ...data.photos]);
                                setResolutionGps(data.gps);
                                setIsCameraOpen(false);
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AuthorityTasks;
