import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { CheckSquare, ArrowUpRight, Search, Clock, MapPin, AlertCircle, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const AuthorityTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/v1/authority/tasks', {
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
            const { data } = await axios.post(`http://localhost:5000/api/v1/authority/tasks/${taskId}/escalate`, {}, {
                withCredentials: true
            });
            toast.success(data.message);
            fetchTasks(); // refresh board
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to escalate task');
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
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                </div>
            ) : tasks.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
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
                            className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="p-6">
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
                                <p className="text-slate-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                                    {task.description}
                                </p>

                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center text-slate-500 text-sm">
                                        <MapPin size={16} className="mr-2 text-blue-500" />
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
                                </div>

                                    <button 
                                        onClick={() => setExpandedMapId(expandedMapId === task._id ? null : task._id)}
                                        className="text-blue-600 font-bold text-sm hover:text-blue-700 transition-colors flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg"
                                    >
                                        <Map size={14} />
                                        {expandedMapId === task._id ? 'Hide Map' : 'View Location'}
                                    </button>
                                    
                                    {task.escalationLevel !== 'HOD' && (
                                        <button 
                                            onClick={() => handleEscalate(task._id)}
                                            className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center transition-colors"
                                        >
                                            Escalate
                                            <ArrowUpRight size={16} className="ml-1" />
                                        </button>
                                    )}
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
        </div>
    );
};

export default AuthorityTasks;
