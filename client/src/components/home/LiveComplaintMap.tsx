import React, { useEffect, useMemo, useState } from 'react';
import { Flame, Layers, MapPin, ArrowUpRight, LocateFixed, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import CivicVectorMap, {
    OPENFREEMAP_STYLES,
    VectorMapMode,
    VectorMapPoint,
    VectorMapStyle
} from '../common/CivicVectorMap';
import { getTimeAgo } from '../../utils/dateUtils';
import { getDistanceFromLatLonInKm } from '../../utils/geoUtils';
import {
    COMPLAINT_CATEGORIES,
    formatAddressShort,
    PublicMapReport
} from './homeData';

type LatLngTuple = [number, number];
type MapFocus = 'nearMe' | 'allReports';
type StatusBucket = 'All' | 'Open' | 'In Progress' | 'Resolved';

interface LiveComplaintMapProps {
    reports: PublicMapReport[];
    categoryCounts: Record<string, number>;
    loading: boolean;
    searchQuery: string;
}

const DEFAULT_CENTER: LatLngTuple = [22.7196, 75.8577];
const NEAR_RADIUS_KM = 25;

const matchesStatusBucket = (status: string | undefined, bucket: StatusBucket): boolean => {
    if (bucket === 'All') return true;
    if (bucket === 'Open') return status === 'Submitted' || status === 'Verified';
    if (bucket === 'In Progress') return status === 'Assigned' || status === 'In Progress';
    return status === 'Resolved' || status === 'Closed';
};

const getReportHeatWeight = (report: PublicMapReport): number => {
    const priorityBoost =
        report.priority === 'Critical'
            ? 0.9
            : report.priority === 'High'
                ? 0.55
                : report.priority === 'Medium'
                    ? 0.25
                    : 0;
    const supportBoost = Math.min(0.9, Math.log1p(report.supportCount ?? 1) * 0.35);
    return 1 + priorityBoost + supportBoost;
};

const LiveComplaintMap: React.FC<LiveComplaintMapProps> = ({
    reports,
    categoryCounts,
    loading,
    searchQuery
}) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [statusFilter, setStatusFilter] = useState<StatusBucket>('All');
    const [mapMode, setMapMode] = useState<VectorMapMode>('both');
    const [styleKey, setStyleKey] = useState<VectorMapStyle>('bright');
    const [userLocation, setUserLocation] = useState<LatLngTuple | null>(null);
    const [mapFocus, setMapFocus] = useState<MapFocus>('nearMe');

    useEffect(() => {
        if (!('geolocation' in navigator)) {
            setMapFocus('allReports');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation([pos.coords.latitude, pos.coords.longitude]);
                setMapFocus('nearMe');
            },
            () => {
                setMapFocus('allReports');
            },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
        );
    }, []);

    const handleFocusMyLocation = () => {
        if (userLocation) {
            setMapFocus('nearMe');
            return;
        }
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLocation([pos.coords.latitude, pos.coords.longitude]);
                    setMapFocus('nearMe');
                },
                () => setMapFocus('allReports'),
                { enableHighAccuracy: false, timeout: 8000 }
            );
        }
    };

    const totalCategoryReports = useMemo(
        () => Object.values(categoryCounts).reduce((sum, count) => sum + count, 0),
        [categoryCounts]
    );

    const validReports = useMemo(
        () =>
            reports.filter(
                (r) =>
                    Array.isArray(r.location?.coordinates) &&
                    r.location.coordinates.length === 2 &&
                    Number.isFinite(r.location.coordinates[0]) &&
                    Number.isFinite(r.location.coordinates[1]) &&
                    (r.location.coordinates[0] !== 0 || r.location.coordinates[1] !== 0)
            ),
        [reports]
    );

    const filteredReports = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return validReports.filter((r) => {
            if (selectedCategory !== 'All' && r.category !== selectedCategory) return false;
            if (!matchesStatusBucket(r.status, statusFilter)) return false;
            if (!query) return true;
            const hay = `${r.category} ${r.description} ${r.status} ${r.address?.ward || ''} ${r.address?.district || ''} ${r.address?.fullAddress || ''}`.toLowerCase();
            return hay.includes(query);
        });
    }, [validReports, selectedCategory, statusFilter, searchQuery]);

    const nearbyCount = useMemo(() => {
        if (!userLocation) return filteredReports.length;
        return filteredReports.filter((r) => {
            const lat = r.location.coordinates[1];
            const lng = r.location.coordinates[0];
            return getDistanceFromLatLonInKm(userLocation[0], userLocation[1], lat, lng) <= NEAR_RADIUS_KM;
        }).length;
    }, [filteredReports, userLocation]);

    const handleModeChange = (nextMode: VectorMapMode) => {
        setMapMode(nextMode);
        if ((nextMode === 'heatmap' || nextMode === 'both') && mapFocus === 'nearMe' && nearbyCount === 0 && filteredReports.length > 0) {
            setMapFocus('allReports');
        }
    };

    const vectorPoints = useMemo<VectorMapPoint[]>(
        () =>
            filteredReports.map((r) => ({
                id: r._id,
                lat: r.location.coordinates[1],
                lng: r.location.coordinates[0],
                category: r.category,
                description: r.description,
                status: r.status,
                priority: r.priority,
                area: formatAddressShort(r.address),
                supportCount: r.supportCount ?? 1,
                timeAgo: getTimeAgo(r.createdAt) || 'Recent',
                weight: getReportHeatWeight(r)
            })),
        [filteredReports]
    );

    const statusOptions: Array<{ key: StatusBucket; label: string; dotClass: string }> = [
        { key: 'All', label: 'All Statuses', dotClass: 'bg-slate-500' },
        { key: 'Open', label: 'Submitted / Verified', dotClass: 'bg-indigo-600' },
        { key: 'In Progress', label: 'In Progress', dotClass: 'bg-amber-500' },
        { key: 'Resolved', label: 'Resolved', dotClass: 'bg-emerald-500' }
    ];

    return (
        <section
            id="civic-live-map"
            className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5 sm:p-7 space-y-5"
        >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
                        <MapPin size={14} /> OpenFreeMap Vector Geospatial Feed
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Live Civic Issue Map & Categories
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        High-resolution vector street maps with live thermal hotspots and auto-clustered reports.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                    <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/70">
                        <button
                            type="button"
                            onClick={handleFocusMyLocation}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                mapFocus === 'nearMe'
                                    ? 'bg-white text-indigo-700 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <LocateFixed size={14} /> My Location
                        </button>
                        <button
                            type="button"
                            onClick={() => setMapFocus('allReports')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                mapFocus === 'allReports'
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Globe size={14} /> All Reports ({filteredReports.length})
                        </button>
                    </div>

                    <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/70">
                        {(Object.keys(OPENFREEMAP_STYLES) as VectorMapStyle[]).map((key) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setStyleKey(key)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    styleKey === key
                                        ? 'bg-white text-slate-900 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {OPENFREEMAP_STYLES[key].label}
                            </button>
                        ))}
                    </div>

                    <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/70">
                        <button
                            type="button"
                            onClick={() => handleModeChange('pins')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                mapMode === 'pins'
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Layers size={14} /> Pins
                        </button>
                        <button
                            type="button"
                            onClick={() => handleModeChange('heatmap')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                mapMode === 'heatmap'
                                    ? 'bg-white text-orange-600 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Flame size={14} /> Heatmap
                        </button>
                        <button
                            type="button"
                            onClick={() => handleModeChange('both')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                mapMode === 'both'
                                    ? 'bg-white text-indigo-700 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Hybrid
                        </button>
                    </div>

                    <Link
                        to="/dashboard"
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50/60 hover:border-indigo-200 hover:text-indigo-700 text-xs font-bold text-slate-700 transition-all group"
                    >
                        Full Radar
                        <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                <button
                    type="button"
                    onClick={() => setSelectedCategory('All')}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${
                        selectedCategory === 'All'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-indigo-300'
                    }`}
                >
                    <span>All Issues</span>
                    <span
                        className={`px-1.5 py-0.5 rounded-md text-[11px] tabular-nums ${
                            selectedCategory === 'All'
                                ? 'bg-white/20 text-white'
                                : 'bg-white text-slate-600 border border-slate-200/80'
                        }`}
                    >
                        {totalCategoryReports}
                    </span>
                </button>

                {COMPLAINT_CATEGORIES.map((cat) => {
                    const count = categoryCounts[cat.name] || 0;
                    const isSelected = selectedCategory === cat.name;
                    const Icon = cat.icon;
                    return (
                        <button
                            key={cat.name}
                            type="button"
                            onClick={() => setSelectedCategory(cat.name)}
                            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${
                                isSelected
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                            }`}
                        >
                            <Icon size={14} className={isSelected ? 'text-white' : 'text-slate-500'} />
                            <span>{cat.name}</span>
                            <span
                                className={`px-1.5 py-0.5 rounded-md text-[11px] tabular-nums ${
                                    isSelected
                                        ? 'bg-white/20 text-white'
                                        : 'bg-slate-100 text-slate-600'
                                }`}
                            >
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div
                className="relative h-[420px] sm:h-[480px] lg:h-[520px] w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 z-0"
                style={{ minHeight: '420px' }}
            >
                {loading ? (
                    <div className="w-full h-full skeleton-box flex items-center justify-center">
                        <span className="px-4 py-2 rounded-xl bg-white/95 border border-slate-200 text-xs font-bold text-slate-600 shadow-xs">
                            Loading vector map & live coordinates...
                        </span>
                    </div>
                ) : (
                    <CivicVectorMap
                        points={vectorPoints}
                        styleKey={styleKey}
                        mode={mapMode}
                        userLocation={userLocation}
                        focusMode={mapFocus}
                        defaultCenter={DEFAULT_CENTER}
                        defaultZoom={12}
                        radiusKm={NEAR_RADIUS_KM}
                        showRadius={mapFocus === 'nearMe' && Boolean(userLocation)}
                    />
                )}

                {!loading && mapFocus === 'nearMe' && userLocation && nearbyCount === 0 && filteredReports.length > 0 && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4 z-10">
                        <div className="pointer-events-auto bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold text-slate-700 shadow-md flex flex-wrap items-center gap-3">
                            <span>
                                0 active reports within {NEAR_RADIUS_KM} km of your location · {filteredReports.length} mapped across active zones
                            </span>
                            <button
                                type="button"
                                onClick={() => setMapFocus('allReports')}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                            >
                                View All {filteredReports.length} Reports
                            </button>
                        </div>
                    </div>
                )}

                {!loading && filteredReports.length === 0 && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4 z-10">
                        <div className="pointer-events-auto bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
                            No geo-tagged reports match the current filter.
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                    {statusOptions.map((opt) => (
                        <button
                            key={opt.key}
                            type="button"
                            onClick={() => setStatusFilter(opt.key)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                                statusFilter === opt.key
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white hover:border-slate-300'
                            }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${opt.dotClass}`} />
                            {opt.label}
                        </button>
                    ))}
                </div>
                <span className="font-semibold text-slate-600 tabular-nums">
                    {userLocation
                        ? `${nearbyCount} within ${NEAR_RADIUS_KM} km · ${filteredReports.length} total mapped`
                        : `Showing ${filteredReports.length} of ${validReports.length} mapped reports`}
                </span>
            </div>
        </section>
    );
};

export default LiveComplaintMap;
