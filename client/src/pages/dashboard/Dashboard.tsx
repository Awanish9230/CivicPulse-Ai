import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { AlertTriangle, Map, Clock, CheckCircle, User } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useLocalFirst } from '../../hooks/useLocalFirst';
import StatCard, { StatCardSkeleton } from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import OperationsMap from './components/OperationsMap';
import LiveIssueCard from './components/LiveIssueCard';
import type { Complaint, User as UserType } from '../../types';

interface GeoLocation {
    lat: number;
    lng: number;
}

interface DashboardStats {
    today: number;
    pending: number;
    critical: number;
    resolved: number;
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const Dashboard: React.FC = () => {
    const { user } = useContext(AuthContext);
    const [filter, setFilter] = useState<string>('All');
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
            withCredentials: true
        });
        setSocket(newSocket);
        return () => {
            newSocket.close();
        };
    }, []);

    const calculateStats = useCallback((data: Complaint[]) => {
        const today = new Date().toDateString();
        let tCount = 0;
        let pCount = 0;
        let cCount = 0;
        let rCount = 0;

        data.forEach((c) => {
            if (new Date(c.createdAt).toDateString() === today) tCount++;
            if (c.status === 'Submitted' || c.status === 'In Progress') pCount++;
            if (c.priority === 'Critical') cCount++;
            if (c.status === 'Resolved' || c.status === 'Closed') rCount++;
        });

        setStats({ today: tCount, pending: pCount, critical: cCount, resolved: rCount });
    }, []);

    const fetchComplaintsCallback = useCallback(async (
        lat: number | null = null,
        lng: number | null = null,
        rds: string | null = null
    ): Promise<Complaint[]> => {
        let url = `${import.meta.env.VITE_API_URL}/api/v1/complaint/all`;
        if (lat && lng) {
            url += `?lat=${lat}&lng=${lng}&radius=${rds || 10}`;
        }

        const { data } = await axios.get<{ data: Complaint[] }>(url, { withCredentials: true });
        const fetchedComplaints = data.data;
        calculateStats(fetchedComplaints);
        return fetchedComplaints;
    }, [calculateStats]);

    const {
        data: complaints,
        setData: setComplaints,
        loading: complaintsLoading,
        refresh: fetchComplaints
    } = useLocalFirst('dashboard_complaints', fetchComplaintsCallback, [] as Complaint[]);

    const [stats, setStats] = useState<DashboardStats>({
        today: 0,
        pending: 0,
        critical: 0,
        resolved: 0
    });

    const [radius, setRadius] = useState<string>('10');
    const [location, setLocation] = useState<GeoLocation | null>(null);
    const [locationDenied, setLocationDenied] = useState<boolean>(false);
    const [showRadiusMap, setShowRadiusMap] = useState<boolean>(true);

    const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState<string>('');
    const [replying, setReplying] = useState<boolean>(false);

    const handleUpvote = async (complaintId: string) => {
        setComplaints((prev) =>
            prev.map((c) =>
                c._id === complaintId
                    ? { ...c, supportCount: (c.supportCount || 0) + 1, isSupported: true }
                    : c
            )
        );

        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/v1/complaint/${complaintId}/upvote`,
                {},
                { withCredentials: true }
            );
            toast.success("Impact footprint recorded!");
        } catch {
            setComplaints((prev) =>
                prev.map((c) =>
                    c._id === complaintId
                        ? { ...c, supportCount: Math.max(0, (c.supportCount || 1) - 1), isSupported: false }
                        : c
                )
            );
            toast.error("Failed to record footprint");
        }
    };

    const handleReply = async (complaintId: string) => {
        if (!replyContent.trim()) return;
        setReplying(true);
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/v1/complaint/${complaintId}/reply`,
                { content: replyContent },
                { withCredentials: true }
            );

            toast.success("Reply posted successfully");
            setReplyContent('');
            setActiveReplyId(null);
            fetchComplaints();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || "Failed to post reply");
        } finally {
            setReplying(false);
        }
    };

    useEffect(() => {
        if (!socket) return;

        const handleNewComplaint = (complaint: Complaint) => {
            setComplaints((prev) => [complaint, ...prev]);
        };

        const handleComplaintUpdate = (updatedComplaint: Complaint) => {
            setComplaints((prev) =>
                prev.map((c) => (c._id === updatedComplaint._id ? updatedComplaint : c))
            );
        };

        const handleComplaintResolved = () => {
            fetchComplaints();
        };

        socket.on('newComplaint', handleNewComplaint);
        socket.on('complaintUpdated', handleComplaintUpdate);
        socket.on('complaintResolved', handleComplaintResolved);

        return () => {
            socket.off('newComplaint', handleNewComplaint);
            socket.off('complaintUpdated', handleComplaintUpdate);
            socket.off('complaintResolved', handleComplaintResolved);
        };
    }, [socket, setComplaints, fetchComplaints]);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setLocation({ lat, lng });
                    setLocationDenied(false);
                    fetchComplaints(lat, lng, radius);
                },
                (error) => {
                    console.warn("Location permission denied", error);
                    if (!locationDenied) {
                        toast.error("Location denied. Showing only your complaints.");
                    }
                    setLocationDenied(true);
                    fetchComplaints(null, null, null);
                },
                { timeout: 10000 }
            );
        } else {
            if (!locationDenied) toast.error("Geolocation not supported.");
            fetchComplaints(null, null, null);
        }

        const localSocket = io(`${import.meta.env.VITE_API_URL}`);
        localSocket.on('new_complaint', (newComplaint: Complaint) => {
            setComplaints((prev) => {
                const updated = [newComplaint, ...prev];
                calculateStats(updated);
                return updated;
            });
        });

        return () => {
            localSocket.disconnect();
        };
    }, [radius]);

    const filteredComplaints = complaints.filter((c) => {
        if (filter === 'All') return true;
        if (filter === 'Pending') return c.status === 'Submitted' || c.status === 'In Progress';
        if (filter === 'Critical') return c.priority === 'Critical';
        return true;
    });

    const displayUserName = user
        ? ((user as UserType & { displayName?: string }).displayName || user.anonymousId || user.email)
        : 'Guest';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full max-w-7xl mx-auto space-y-8 pb-12 w-full overflow-x-hidden"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/50 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-text tracking-tight mb-1">Civic Dashboard</h1>
                    <p className="text-text/50 font-medium">Real-time overview of civic issues and SLA metrics.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 bg-white border border-border/50 px-4 py-2 rounded-xl shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User size={16} className="text-primary" />
                        </div>
                        <div className="truncate">
                            <div className="text-sm font-bold text-text leading-tight truncate max-w-[120px]">
                                {displayUserName}
                            </div>
                            <div className="text-[10px] text-text/50 font-bold uppercase tracking-wider">
                                {user ? user.role : 'Visitor'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {complaintsLoading ? (
                    <>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </>
                ) : (
                    <>
                        <StatCard
                            title="Today's Reports"
                            value={stats.today}
                            icon={Map}
                            iconBgClass="bg-primary/10 text-primary"
                            accentBgClass="bg-primary/5"
                            hoverBorderClass="hover:border-primary/30"
                        />
                        <StatCard
                            title="Pending Resolution"
                            value={stats.pending}
                            icon={Clock}
                            iconBgClass="bg-orange-500/10 text-orange-500"
                            accentBgClass="bg-orange-500/5"
                            hoverBorderClass="hover:border-orange-500/30"
                        />
                        <StatCard
                            title="Critical SLA Breaches"
                            value={stats.critical}
                            icon={AlertTriangle}
                            iconBgClass="bg-red-500/10 text-red-500"
                            accentBgClass="bg-red-500/5"
                            hoverBorderClass="hover:border-red-500/30"
                        />
                        <StatCard
                            title="Successfully Resolved"
                            value={stats.resolved}
                            icon={CheckCircle}
                            iconBgClass="bg-green-500/10 text-green-500"
                            accentBgClass="bg-green-500/5"
                            hoverBorderClass="hover:border-green-500/30"
                        />
                    </>
                )}
            </motion.div>

            <div className="flex flex-col gap-8 flex-1">
                <OperationsMap
                    complaints={filteredComplaints}
                    location={location}
                    locationDenied={locationDenied}
                    radius={radius}
                    setRadius={setRadius}
                    showRadiusMap={showRadiusMap}
                    setShowRadiusMap={setShowRadiusMap}
                />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="w-full flex flex-col"
                >
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="font-black text-2xl text-slate-800 tracking-tight">Live Issue Feed</h2>
                            <p className="text-sm font-medium text-slate-500 mt-1">Real-time reports awaiting authority action</p>
                        </div>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/60">
                            {['All', 'Pending', 'Critical'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                                        filter === f
                                            ? 'bg-white text-primary shadow-sm border border-slate-100'
                                            : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6 w-full pt-2 pb-6">
                        {filteredComplaints.length === 0 && (
                            <EmptyState
                                icon={CheckCircle}
                                title="Inbox Zero"
                                description="No active complaints found matching the filter."
                                iconWrapperClassName="bg-primary/5 w-24 h-24 rounded-[2rem] text-primary opacity-80"
                                containerClassName="text-center text-slate-500 py-24 bg-white/60 backdrop-blur-xl rounded-[3rem] border border-slate-200/60 w-full col-span-full shadow-sm"
                            />
                        )}
                        {filteredComplaints.map((c, i) => (
                            <LiveIssueCard
                                key={c._id}
                                complaint={c}
                                index={i}
                                isReplyOpen={activeReplyId === c._id}
                                replyContent={replyContent}
                                replying={replying}
                                onUpvote={handleUpvote}
                                onToggleReply={(id) => setActiveReplyId(activeReplyId === id ? null : id)}
                                onReplyContentChange={setReplyContent}
                                onSubmitReply={handleReply}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Dashboard;
