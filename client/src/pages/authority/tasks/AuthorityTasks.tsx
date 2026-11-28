import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { CheckSquare, Map as MapIcon, Search, Download, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../../../context/AuthContext';
import CameraCapture, { type GpsPoint } from '../../../components/complaints/CameraCapture';
import EmptyState from '../../../components/common/EmptyState';
import { getDepartmentForCategory } from '../../../utils/complaintUtils';
import TaskFilters from './components/TaskFilters';
import TaskMapView from './components/TaskMapView';
import TaskCard from './components/TaskCard';
import AssignTaskModal, { type DepartmentMember } from './components/AssignTaskModal';
import ResolveTaskModal from './components/ResolveTaskModal';
import type { Complaint } from '../../../types';

interface TaskUpdates {
    status?: string;
    expectedCompletionDate?: string;
    replyMessage?: string;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
    if (axios.isAxiosError<{ message?: string }>(error)) {
        return error.response?.data?.message || fallback;
    }
    return fallback;
};

const AuthorityTasks: React.FC = () => {
    const authContext = useContext(AuthContext);
    const user = authContext?.user ?? null;
    const [tasks, setTasks] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [expandedMapId, setExpandedMapId] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [filterPriority, setFilterPriority] = useState<string>('All');
    const [filterCategory, setFilterCategory] = useState<string>('All');
    const [sortBy, setSortBy] = useState<string>('Newest');
    const [viewMode, setViewMode] = useState<'List' | 'Map'>('List');
    const [replyMessages, setReplyMessages] = useState<Record<string, string>>({});

    const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [departmentMembers, setDepartmentMembers] = useState<DepartmentMember[]>([]);
    const [loadingMembers, setLoadingMembers] = useState<boolean>(false);

    const [resolveModalOpen, setResolveModalOpen] = useState<boolean>(false);
    const [resolutionImages, setResolutionImages] = useState<(string | File)[]>([]);
    const [resolutionGps, setResolutionGps] = useState<GpsPoint | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
    const [testModeBypass, setTestModeBypass] = useState<boolean>(false);
    const [resolving, setResolving] = useState<boolean>(false);

    const isSeniorOrHOD = user?.role === 'Admin' || user?.authorityLevel === 'Senior' || user?.authorityLevel === 'HOD';

    const fetchTasks = async (): Promise<void> => {
        try {
            const { data } = await axios.get<{ data: Complaint[] }>(`${import.meta.env.VITE_API_URL}/api/v1/authority/tasks`, {
                withCredentials: true
            });
            setTasks(data.data);
        } catch {
            toast.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleEscalate = async (taskId: string): Promise<void> => {
        try {
            const { data } = await axios.post<{ message: string }>(
                `${import.meta.env.VITE_API_URL}/api/v1/authority/tasks/${taskId}/escalate`,
                {},
                { withCredentials: true }
            );
            toast.success(data.message);
            fetchTasks();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Failed to escalate task'));
        }
    };

    const handleUpdateTask = async (taskId: string, updates: TaskUpdates): Promise<void> => {
        try {
            const { data } = await axios.patch<{ message: string }>(
                `${import.meta.env.VITE_API_URL}/api/v1/authority/tasks/${taskId}`,
                updates,
                { withCredentials: true }
            );
            toast.success(data.message);
            fetchTasks();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Failed to update task'));
        }
    };

    const handleResolveTask = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
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
            formData.append('gps[lat]', String(resolutionGps.lat));
            formData.append('gps[lng]', String(resolutionGps.lng));
        }
        if (testModeBypass) {
            formData.append('testModeBypass', 'true');
        }

        try {
            const { data } = await axios.patch<{ message: string }>(
                `${import.meta.env.VITE_API_URL}/api/v1/authority/tasks/${selectedTaskId}`,
                formData,
                {
                    withCredentials: true,
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            );
            toast.success(data.message);
            setResolveModalOpen(false);
            setResolutionImages([]);
            setResolutionGps(null);
            setTestModeBypass(false);
            fetchTasks();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Failed to resolve task'));
        } finally {
            setResolving(false);
        }
    };

    const filteredTasks = tasks
        .filter((task) => {
            const matchesSearch =
                task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task._id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'All' || task.status === filterStatus;
            const matchesPriority = filterPriority === 'All' || task.priority === filterPriority;
            const matchesCategory = filterCategory === 'All' || task.category === filterCategory;
            return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
        })
        .sort((a, b) => {
            if (sortBy === 'Newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            if (sortBy === 'Oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            if (sortBy === 'Priority (High)') {
                const levels: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
                return (levels[b.priority || ''] || 0) - (levels[a.priority || ''] || 0);
            }
            return 0;
        });

    const exportToCSV = (): void => {
        const headers = ['ID', 'Category', 'Priority', 'Status', 'Description', 'Date Reported', 'Location'];
        const csvRows = [headers.join(',')];

        filteredTasks.forEach((task) => {
            const row = [
                task._id,
                task.category,
                task.priority || '',
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

    const openAssignModal = async (taskId: string): Promise<void> => {
        setSelectedTaskId(taskId);
        setAssignModalOpen(true);
        setLoadingMembers(true);

        const task = tasks.find((t) => t._id === taskId);
        const targetDepartment = task ? getDepartmentForCategory(task.category) : null;

        try {
            const { data } = await axios.get<{ data: DepartmentMember[] }>(
                `${import.meta.env.VITE_API_URL}/api/v1/authority/department-members`,
                { withCredentials: true }
            );

            const filteredMembers = data.data.filter((member) => {
                const isCorrectDepartment = user?.role === 'Admin' ? member.department === targetDepartment : true;

                let isCorrectRank = false;
                if (user?.role === 'Admin') isCorrectRank = true;
                else if (user?.authorityLevel === 'HOD') isCorrectRank = ['Senior', 'Junior'].includes(member.authorityLevel);
                else if (user?.authorityLevel === 'Senior') isCorrectRank = member.authorityLevel === 'Junior';

                return isCorrectDepartment && isCorrectRank;
            });

            setDepartmentMembers(filteredMembers);
        } catch {
            toast.error('Failed to load department members');
        } finally {
            setLoadingMembers(false);
        }
    };

    const handleAssign = async (assigneeId: string): Promise<void> => {
        try {
            const { data } = await axios.post<{ message: string }>(
                `${import.meta.env.VITE_API_URL}/api/v1/authority/tasks/${selectedTaskId}/assign`,
                { assigneeId },
                { withCredentials: true }
            );
            toast.success(data.message);
            setAssignModalOpen(false);
            fetchTasks();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Failed to assign task'));
        }
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Task Board</h1>
                    <p className="text-slate-500 mt-1">Manage and escalate incoming civic complaints.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={exportToCSV}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap"
                    >
                        <Download size={18} /> Export CSV
                    </button>
                    <div className="flex bg-slate-200 p-1 rounded-xl w-full sm:w-auto">
                        <button
                            onClick={() => setViewMode('List')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                                viewMode === 'List' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <List size={16} /> List
                        </button>
                        <button
                            onClick={() => setViewMode('Map')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                                viewMode === 'Map' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <MapIcon size={16} /> Map
                        </button>
                    </div>
                </div>
            </div>

            <TaskFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                filterPriority={filterPriority}
                setFilterPriority={setFilterPriority}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                sortBy={sortBy}
                setSortBy={setSortBy}
            />

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
                <EmptyState
                    icon={CheckSquare}
                    title="You're all caught up!"
                    description="There are no active tasks assigned to your escalation level."
                    iconWrapperClassName="w-20 h-20 bg-emerald-50 rounded-full text-emerald-500"
                    containerClassName="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm"
                />
            ) : viewMode === 'Map' ? (
                <TaskMapView tasks={filteredTasks} onSwitchToList={() => setViewMode('List')} />
            ) : filteredTasks.length === 0 ? (
                <EmptyState
                    icon={Search}
                    title="No tasks found"
                    description="Try adjusting your search or filters."
                    iconWrapperClassName="w-20 h-20 bg-slate-50 rounded-full text-slate-400"
                    containerClassName="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm"
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredTasks.map((task) => (
                        <TaskCard
                            key={task._id}
                            task={task}
                            isExpandedMap={expandedMapId === task._id}
                            isSeniorOrHOD={isSeniorOrHOD}
                            replyValue={replyMessages[task._id] || ''}
                            onReplyChange={(val) => setReplyMessages({ ...replyMessages, [task._id]: val })}
                            onSendReply={() => {
                                if (replyMessages[task._id]?.trim()) {
                                    handleUpdateTask(task._id, { replyMessage: replyMessages[task._id] });
                                    setReplyMessages({ ...replyMessages, [task._id]: '' });
                                }
                            }}
                            onStatusChange={(nextStatus) => {
                                if (nextStatus === 'Resolved') {
                                    setSelectedTaskId(task._id);
                                    setResolveModalOpen(true);
                                } else {
                                    handleUpdateTask(task._id, { status: nextStatus });
                                }
                            }}
                            onDateChange={(date) => handleUpdateTask(task._id, { expectedCompletionDate: date })}
                            onToggleMap={() => setExpandedMapId(expandedMapId === task._id ? null : task._id)}
                            onOpenAssign={() => openAssignModal(task._id)}
                            onEscalate={() => handleEscalate(task._id)}
                        />
                    ))}
                </div>
            )}

            <AssignTaskModal
                isOpen={assignModalOpen}
                loading={loadingMembers}
                members={departmentMembers}
                onClose={() => setAssignModalOpen(false)}
                onAssign={handleAssign}
            />

            <ResolveTaskModal
                isOpen={resolveModalOpen}
                resolutionImages={resolutionImages}
                setResolutionImages={setResolutionImages}
                testModeBypass={testModeBypass}
                setTestModeBypass={setTestModeBypass}
                resolving={resolving}
                onOpenCamera={() => setIsCameraOpen(true)}
                onClose={() => {
                    setResolveModalOpen(false);
                    setResolutionImages([]);
                    setResolutionGps(null);
                }}
                onSubmit={handleResolveTask}
            />

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
                                setResolutionImages((prev) => [...prev, ...data.photos]);
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
