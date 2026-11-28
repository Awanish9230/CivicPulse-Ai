import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Camera } from 'lucide-react';
import { useState, useEffect, type FormEvent } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import CameraCapture, { type CaptureResult } from '../../components/complaints/CameraCapture';
import ReportModal from '../../components/complaints/ReportModal';
import LocationMapModal from '../../components/common/LocationMapModal';
import EmptyState from '../../components/common/EmptyState';
import ComplaintCard from './components/ComplaintCard';
import EditComplaintModal from './components/EditComplaintModal';
import type { Complaint } from '../../types';

const MyComplaints = () => {
    const [filter, setFilter] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [expandedMapComplaint, setExpandedMapComplaint] = useState<Complaint | null>(null);
    const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
    const [captureData, setCaptureData] = useState<CaptureResult | null>(null);
    const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

    const toggleReplies = (id: string) => {
        setExpandedReplies((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const fetchMyComplaints = async () => {
        try {
            const { data } = await axios.get<{ data: Complaint[] }>(
                `${import.meta.env.VITE_API_URL}/api/v1/complaint/my-complaints`,
                { withCredentials: true }
            );
            setComplaints(data.data || []);
        } catch (error: unknown) {
            const err = error as { response?: { data?: unknown }; message?: string };
            console.error('MyComplaints fetch error:', err.response?.data || err.message);
            toast.error("Failed to load your complaints.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyComplaints();
    }, []);

    const handleFeedback = async (id: string, action: 'Accept' | 'Reject') => {
        const userPrompt = action === 'Accept'
            ? "Any optional comments for accepting this resolution?"
            : "Please provide a reason for rejecting this resolution. This will reopen the issue and escalate it.";

        const comment = window.prompt(userPrompt);

        if (action === 'Reject' && (!comment || comment.trim() === '')) {
            toast.error("You must provide a reason to reject the resolution.");
            return;
        }

        if (comment === null) return;

        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/v1/complaint/${id}/feedback`,
                { isResolved: action === 'Accept', feedback: comment },
                { withCredentials: true }
            );
            toast.success(`Resolution ${action.toLowerCase()}ed successfully`);
            fetchMyComplaints();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || `Failed to ${action.toLowerCase()} resolution`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this complaint? This cannot be undone.")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/complaint/${id}`, {
                withCredentials: true
            });
            toast.success("Complaint deleted successfully");
            fetchMyComplaints();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || "Failed to delete complaint");
        }
    };

    const handleEditSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingComplaint) return;
        try {
            await axios.patch(
                `${import.meta.env.VITE_API_URL}/api/v1/complaint/${editingComplaint._id}`,
                {
                    category: editingComplaint.category,
                    description: editingComplaint.description
                },
                { withCredentials: true }
            );
            toast.success("Complaint updated successfully");
            setEditingComplaint(null);
            fetchMyComplaints();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || "Failed to update complaint");
        }
    };

    const filteredComplaints = complaints.filter((c) => {
        const matchesFilter = filter === 'All'
            ? true
            : filter === 'Active'
                ? c.status !== 'Resolved' && c.status !== 'Closed'
                : c.status === filter;
        const matchesSearch =
            c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c._id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const isSlaBreached = (createdAt: string, status: string): boolean => {
        if (status === 'Resolved' || status === 'Closed') return false;
        const diffInHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
        return diffInHours > 48;
    };

    const handlePhotoCaptured = (data: CaptureResult) => {
        setCaptureData(data);
        setIsCameraOpen(false);
    };

    const handleReportSuccess = () => {
        setCaptureData(null);
        fetchMyComplaints();
    };

    return (
        <div className="max-w-[1600px] mx-auto pb-20 px-4 md:px-6">
            <div className="sticky top-0 z-30 bg-[#F8FAFC]/90 backdrop-blur-xl pt-6 pb-4 border-b border-border/50 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">My Reports</h1>
                        <p className="text-sm text-text/50 font-medium mt-0.5">Track your complaints</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text/40" size={16} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                        <button
                            onClick={() => setIsCameraOpen(true)}
                            className="shrink-0 bg-primary hover:bg-blue-700 text-white font-bold h-10 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shadow-primary/20"
                        >
                            <Camera size={16} />
                            <span className="hidden sm:inline text-sm">Raise Complaint</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-1 mt-5 overflow-x-auto no-scrollbar bg-slate-100/50 p-1 rounded-xl w-full md:w-max border border-border/50">
                    {['All', 'Active', 'Verified', 'In Progress', 'Resolved'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                filter === f
                                    ? 'bg-surface text-primary shadow-sm border border-border/60'
                                    : 'text-text/50 hover:text-text/80 hover:bg-slate-200/50'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-surface rounded-[1rem] p-4 border border-border/50 shadow-sm animate-pulse h-80 flex flex-col gap-3">
                            <div className="flex justify-between"><div className="w-16 h-6 bg-slate-200 rounded"></div><div className="w-20 h-6 bg-slate-200 rounded"></div></div>
                            <div className="w-full h-32 bg-slate-200 rounded-xl mt-2"></div>
                            <div className="w-3/4 h-4 bg-slate-200 rounded mt-2"></div>
                            <div className="w-1/2 h-4 bg-slate-200 rounded"></div>
                            <div className="mt-auto flex justify-between"><div className="w-24 h-8 bg-slate-200 rounded-lg"></div><div className="w-16 h-8 bg-slate-200 rounded-lg"></div></div>
                        </div>
                    ))
                ) : filteredComplaints.length === 0 ? (
                    <EmptyState
                        icon={FileText}
                        title="No Reports Found"
                        description="You don't have any complaints matching your criteria."
                        actionLabel="Raise First Complaint"
                        onAction={() => setIsCameraOpen(true)}
                    />
                ) : (
                    <AnimatePresence>
                        {filteredComplaints.map((c) => (
                            <ComplaintCard
                                key={c._id}
                                complaint={c}
                                slaRisk={isSlaBreached(c.createdAt, c.status)}
                                isExpandedReplies={Boolean(expandedReplies[c._id])}
                                onToggleReplies={toggleReplies}
                                onFeedback={handleFeedback}
                                onEdit={setEditingComplaint}
                                onDelete={handleDelete}
                                onOpenMap={setExpandedMapComplaint}
                            />
                        ))}
                    </AnimatePresence>
                )}
            </div>

            <LocationMapModal
                isOpen={Boolean(expandedMapComplaint)}
                onClose={() => setExpandedMapComplaint(null)}
                coordinates={expandedMapComplaint?.location?.coordinates}
                subtitle={
                    expandedMapComplaint?.address
                        ? `${expandedMapComplaint.address.line1 || ''}, ${expandedMapComplaint.address.district || ''}`
                        : undefined
                }
            />

            <EditComplaintModal
                complaint={editingComplaint}
                onChange={setEditingComplaint}
                onClose={() => setEditingComplaint(null)}
                onSubmit={handleEditSubmit}
            />

            <AnimatePresence>
                {isCameraOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed inset-0 z-[100]"
                    >
                        <CameraCapture
                            onClose={() => setIsCameraOpen(false)}
                            onCapture={handlePhotoCaptured}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {captureData && (
                    <ReportModal
                        captureData={captureData}
                        onClose={() => setCaptureData(null)}
                        onSuccess={handleReportSuccess}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyComplaints;
