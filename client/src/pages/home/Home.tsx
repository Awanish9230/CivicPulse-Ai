import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api, { SOCKET_URL } from '../../config/api';
import HeroSection from '../../components/home/HeroSection';
import CityAlertTicker from '../../components/home/CityAlertTicker';
import LiveComplaintMap from '../../components/home/LiveComplaintMap';
import RecentReports from '../../components/home/RecentReports';
import LiveActivityFeed from '../../components/home/LiveActivityFeed';
import AuthorityPerformance from '../../components/home/AuthorityPerformance';
import WorkflowAndTrust from '../../components/home/WorkflowAndTrust';
import FAQSection from '../../components/home/FAQSection';
import CallToAction from '../../components/home/CallToAction';
import FloatingButtons from '../../components/home/FloatingButtons';
import ReportDetailModal from '../../components/home/ReportDetailModal';
import {
    DepartmentPerformanceEntry,
    formatAddressShort,
    PublicActivityEntry,
    PublicMapReport,
    PublicOfficialReply,
    PublicPetitionItem,
    PublicPlatformStats,
    PublicRecentReport
} from '../../components/home/homeData';

interface ApiEnvelope<T> {
    success: boolean;
    data: T;
}

interface SocketComplaintPayload {
    _id: string;
    category: string;
    description: string;
    status: string;
    priority?: string;
    location?: {
        type?: string;
        coordinates: [number, number];
    };
    address?: {
        ward?: string;
        district?: string;
        pinCode?: string;
        fullAddress?: string;
    };
    imageUrl?: string;
    imageUrls?: string[];
    supportCount?: number;
    officialReplies?: PublicOfficialReply[];
    createdAt?: string;
    updatedAt?: string;
}

const EMPTY_STATS: PublicPlatformStats = {
    totalComplaints: 0,
    resolvedIssues: 0,
    inProgressIssues: 0,
    openIssues: 0,
    resolutionRate: 0,
    activeAuthorities: 0,
    areasCovered: 0,
    avgResolutionHours: null,
    activePetitions: 0
};

const Home: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [loading, setLoading] = useState<boolean>(true);
    const [socketConnected, setSocketConnected] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedReport, setSelectedReport] = useState<PublicRecentReport | null>(null);

    const [stats, setStats] = useState<PublicPlatformStats>(EMPTY_STATS);
    const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
    const [mapReports, setMapReports] = useState<PublicMapReport[]>([]);
    const [recentReports, setRecentReports] = useState<PublicRecentReport[]>([]);
    const [leaderboard, setLeaderboard] = useState<DepartmentPerformanceEntry[]>([]);
    const [activities, setActivities] = useState<PublicActivityEntry[]>([]);
    const [petitions, setPetitions] = useState<PublicPetitionItem[]>([]);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.get('report') === 'true') {
            navigate('/complaints', { replace: true });
        }
    }, [location, navigate]);

    const fetchPublicOverview = useCallback(async (isInitial = false) => {
        try {
            const [
                statsResult,
                categoriesResult,
                mapResult,
                recentResult,
                leaderboardResult,
                activityResult,
                petitionsResult
            ] = await Promise.allSettled([
                api.get<ApiEnvelope<Partial<PublicPlatformStats> & { citiesCovered?: number }>>('/public/stats'),
                api.get<ApiEnvelope<Record<string, number>>>('/public/categories'),
                api.get<ApiEnvelope<PublicMapReport[]>>('/public/map'),
                api.get<ApiEnvelope<PublicRecentReport[]>>('/public/recent'),
                api.get<ApiEnvelope<Array<Partial<DepartmentPerformanceEntry>>>>('/public/leaderboard'),
                api.get<ApiEnvelope<PublicActivityEntry[]>>('/public/activity'),
                api.get<ApiEnvelope<PublicPetitionItem[]>>('/public/petitions')
            ]);

            const nextMapReports: PublicMapReport[] =
                mapResult.status === 'fulfilled' && mapResult.value.data.success
                    ? mapResult.value.data.data
                    : [];

            const nextCategories: Record<string, number> =
                categoriesResult.status === 'fulfilled' && categoriesResult.value.data.success
                    ? categoriesResult.value.data.data
                    : {};

            const nextRecent: PublicRecentReport[] =
                recentResult.status === 'fulfilled' && recentResult.value.data.success
                    ? recentResult.value.data.data
                    : [];

            if (categoriesResult.status === 'fulfilled' && categoriesResult.value.data.success) {
                setCategoryCounts(nextCategories);
            }
            if (mapResult.status === 'fulfilled' && mapResult.value.data.success) {
                setMapReports(nextMapReports);
            }
            if (recentResult.status === 'fulfilled' && recentResult.value.data.success) {
                setRecentReports(nextRecent);
            }

            if (statsResult.status === 'fulfilled' && statsResult.value.data.success) {
                const raw = statsResult.value.data.data;
                const openFromMap = nextMapReports.filter(
                    (r) => r.status === 'Submitted' || r.status === 'Verified'
                ).length;
                const inProgressFromMap = nextMapReports.filter(
                    (r) => r.status === 'Assigned' || r.status === 'In Progress'
                ).length;

                setStats({
                    totalComplaints: raw.totalComplaints ?? nextMapReports.length,
                    resolvedIssues: raw.resolvedIssues ?? 0,
                    inProgressIssues: raw.inProgressIssues ?? inProgressFromMap,
                    openIssues: raw.openIssues ?? openFromMap,
                    resolutionRate: raw.resolutionRate ?? 0,
                    activeAuthorities: raw.activeAuthorities ?? 0,
                    areasCovered: raw.areasCovered ?? raw.citiesCovered ?? 0,
                    avgResolutionHours: raw.avgResolutionHours ?? null,
                    activePetitions: raw.activePetitions ?? 0
                });
            }

            if (leaderboardResult.status === 'fulfilled' && leaderboardResult.value.data.success) {
                const normalizedBoard: DepartmentPerformanceEntry[] = leaderboardResult.value.data.data
                    .filter((item): item is Partial<DepartmentPerformanceEntry> & { _id: string } => Boolean(item._id))
                    .map((item) => {
                        const categoryTotal = item.total ?? nextCategories[item._id] ?? item.resolved ?? 0;
                        const resolved = item.resolved ?? 0;
                        const inProgress = item.inProgress ?? Math.max(0, categoryTotal - resolved);
                        const resolutionRate = item.resolutionRate ?? (categoryTotal > 0 ? Math.round((resolved / categoryTotal) * 100) : 0);
                        return {
                            _id: item._id,
                            total: categoryTotal,
                            resolved,
                            inProgress,
                            resolutionRate
                        };
                    });
                setLeaderboard(normalizedBoard);
            }

            if (activityResult.status === 'fulfilled' && activityResult.value.data.success) {
                setActivities(activityResult.value.data.data);
            } else if (nextRecent.length > 0 || nextMapReports.length > 0) {
                const source = nextRecent.length > 0 ? nextRecent : nextMapReports.slice(0, 6);
                setActivities(
                    source.map((item) => ({
                        _id: item._id,
                        category: item.category,
                        description: item.description,
                        status: item.status,
                        priority: item.priority,
                        area: formatAddressShort(item.address),
                        timestamp: item.createdAt || new Date().toISOString()
                    }))
                );
            }

            if (petitionsResult.status === 'fulfilled' && petitionsResult.value.data.success) {
                setPetitions(petitionsResult.value.data.data);
            }
        } catch (error) {
            console.error('Failed to load public overview:', error);
        } finally {
            if (isInitial) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        fetchPublicOverview(true);
    }, [fetchPublicOverview]);

    useEffect(() => {
        const socket = io(SOCKET_URL, { withCredentials: true });

        socket.on('connect', () => setSocketConnected(true));
        socket.on('disconnect', () => setSocketConnected(false));

        socket.on('new_complaint', (complaint: SocketComplaintPayload) => {
            const nowIso = complaint.createdAt || new Date().toISOString();

            setActivities((prev) => [
                {
                    _id: complaint._id,
                    category: complaint.category,
                    description: complaint.description,
                    status: complaint.status || 'Submitted',
                    priority: complaint.priority,
                    area: formatAddressShort(complaint.address),
                    timestamp: nowIso,
                    eventType: 'new'
                },
                ...prev.filter((item) => item._id !== complaint._id).slice(0, 7)
            ]);

            if (complaint.location?.coordinates?.length === 2) {
                const mapEntry: PublicMapReport = {
                    _id: complaint._id,
                    category: complaint.category,
                    description: complaint.description,
                    status: complaint.status || 'Submitted',
                    priority: complaint.priority,
                    location: complaint.location,
                    address: complaint.address,
                    supportCount: complaint.supportCount ?? 1,
                    createdAt: nowIso
                };
                setMapReports((prev) => [mapEntry, ...prev.filter((r) => r._id !== complaint._id)]);
            }

            const recentEntry: PublicRecentReport = {
                _id: complaint._id,
                category: complaint.category,
                description: complaint.description,
                status: complaint.status || 'Submitted',
                priority: complaint.priority,
                location: complaint.location,
                address: complaint.address,
                imageUrl: complaint.imageUrl,
                imageUrls: complaint.imageUrls,
                supportCount: complaint.supportCount ?? 1,
                officialReplies: complaint.officialReplies ?? [],
                replyCount: Array.isArray(complaint.officialReplies) ? complaint.officialReplies.length : 0,
                createdAt: nowIso
            };
            setRecentReports((prev) => [recentEntry, ...prev.filter((r) => r._id !== complaint._id)].slice(0, 6));

            fetchPublicOverview(false);
        });

        socket.on('complaint_status_update', (updated: SocketComplaintPayload) => {
            const nowIso = updated.updatedAt || new Date().toISOString();

            setActivities((prev) => [
                {
                    _id: updated._id,
                    category: updated.category,
                    description: updated.description,
                    status: updated.status,
                    priority: updated.priority,
                    area: formatAddressShort(updated.address),
                    timestamp: nowIso,
                    eventType: 'status'
                },
                ...prev.slice(0, 7)
            ]);

            setMapReports((prev) =>
                prev.map((item) =>
                    item._id === updated._id ? { ...item, status: updated.status } : item
                )
            );
            setRecentReports((prev) =>
                prev.map((item) =>
                    item._id === updated._id ? { ...item, status: updated.status } : item
                )
            );

            fetchPublicOverview(false);
        });

        socket.on('complaint_deleted', ({ _id }: { _id: string }) => {
            setMapReports((prev) => prev.filter((item) => item._id !== _id));
            setRecentReports((prev) => prev.filter((item) => item._id !== _id));
            setActivities((prev) => prev.filter((item) => item._id !== _id));
            fetchPublicOverview(false);
        });

        return () => {
            socket.disconnect();
        };
    }, [fetchPublicOverview]);

    const searchMatchCount = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return mapReports.length;
        return mapReports.filter((r) => {
            const hay = `${r.category} ${r.description} ${r.status} ${r.address?.ward || ''} ${r.address?.district || ''} ${r.address?.fullAddress || ''}`.toLowerCase();
            return hay.includes(query);
        }).length;
    }, [mapReports, searchQuery]);

    const handleSelectActivity = useCallback(
        (activity: PublicActivityEntry) => {
            const matchedRecent = recentReports.find((r) => r._id === activity._id);
            if (matchedRecent) {
                setSelectedReport(matchedRecent);
                return;
            }
            const matchedMap = mapReports.find((r) => r._id === activity._id);
            setSelectedReport({
                _id: activity._id,
                category: activity.category,
                description: activity.description,
                status: activity.status,
                priority: activity.priority,
                location: matchedMap?.location,
                address: matchedMap?.address || { fullAddress: activity.area },
                supportCount: matchedMap?.supportCount ?? 1,
                replyCount: 0,
                createdAt: activity.timestamp
            });
        },
        [recentReports, mapReports]
    );

    const handleJumpToMap = useCallback(() => {
        document.getElementById('civic-live-map')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    return (
        <div className="space-y-6 sm:space-y-7 pb-10 font-sans text-slate-900">
            <HeroSection
                stats={stats}
                loading={loading}
                socketConnected={socketConnected}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                matchCount={searchMatchCount}
                onJumpToMap={handleJumpToMap}
            />

            <CityAlertTicker
                activities={activities}
                onSelectActivity={handleSelectActivity}
            />

            <LiveComplaintMap
                reports={mapReports}
                categoryCounts={categoryCounts}
                loading={loading}
                searchQuery={searchQuery}
            />

            <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
                <div className="xl:col-span-8">
                    <RecentReports
                        reports={recentReports}
                        loading={loading}
                        searchQuery={searchQuery}
                        onSelectReport={setSelectedReport}
                    />
                </div>
                <div className="xl:col-span-4">
                    <LiveActivityFeed
                        activities={activities}
                        loading={loading}
                        socketConnected={socketConnected}
                        onSelectActivity={handleSelectActivity}
                    />
                </div>
            </section>

            <AuthorityPerformance
                leaderboard={leaderboard}
                petitions={petitions}
                loading={loading}
            />

            <WorkflowAndTrust />

            <FAQSection />

            <CallToAction />

            <ReportDetailModal
                report={selectedReport}
                onClose={() => setSelectedReport(null)}
            />

            <FloatingButtons />
        </div>
    );
};

export default Home;
