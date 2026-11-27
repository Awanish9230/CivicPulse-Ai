import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Layers } from 'lucide-react';
import CustomSelect from '../../../components/common/CustomSelect';
import CivicVectorMap, {
    OPENFREEMAP_STYLES,
    VectorMapMode,
    VectorMapPoint,
    VectorMapStyle
} from '../../../components/common/CivicVectorMap';
import { getTimeAgo } from '../../../utils/dateUtils';
import type { Complaint } from '../../../types';

interface GeoLocation {
    lat: number;
    lng: number;
}

interface OperationsMapProps {
    complaints: Complaint[];
    location: GeoLocation | null;
    locationDenied: boolean;
    radius: string;
    setRadius: React.Dispatch<React.SetStateAction<string>>;
    showRadiusMap: boolean;
    setShowRadiusMap: React.Dispatch<React.SetStateAction<boolean>>;
}

const OperationsMap: React.FC<OperationsMapProps> = ({
    complaints,
    location,
    locationDenied,
    radius,
    setRadius,
    showRadiusMap,
    setShowRadiusMap
}) => {
    const [viewMode, setViewMode] = useState<VectorMapMode>('both');
    const [styleKey, setStyleKey] = useState<VectorMapStyle>('bright');

    const mapCenter: [number, number] = location ? [location.lat, location.lng] : [28.6139, 77.2090];
    const mapZoom = location ? (radius === 'All' ? 5 : (Number(radius) > 50 ? 7 : 11)) : 12;

    const vectorPoints = useMemo<VectorMapPoint[]>(
        () =>
            complaints
                .filter((c) => Array.isArray(c.location?.coordinates) && c.location.coordinates.length === 2)
                .map((c) => ({
                    id: c._id,
                    lat: c.location!.coordinates[1],
                    lng: c.location!.coordinates[0],
                    category: c.category,
                    description: c.description,
                    status: c.status,
                    priority: c.priority,
                    area: c.address?.ward || c.address?.district || c.address?.fullAddress || 'Verified Location',
                    supportCount: c.supportCount ?? 1,
                    timeAgo: getTimeAgo(c.createdAt) || 'Recent',
                    weight:
                        1 +
                        (c.priority === 'Critical' ? 0.9 : c.priority === 'High' ? 0.5 : 0.2) +
                        Math.min(0.8, Math.log1p(c.supportCount ?? 1) * 0.3)
                })),
        [complaints]
    );

    const parsedRadiusKm = radius !== 'All' ? parseInt(radius, 10) : null;
    const focusMode = location && radius !== 'All' ? 'nearMe' : radius === 'All' && vectorPoints.length > 0 ? 'allReports' : 'center';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full bg-white rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-border/50 flex flex-col overflow-hidden h-[540px]"
        >
            <div className="p-5 sm:p-6 border-b border-border/50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white z-10">
                <div>
                    <h2 className="font-black text-xl text-text">Live Operations Map</h2>
                    <p className="text-xs font-medium text-text/50">
                        Free vector street map & real-time density hotspots
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {locationDenied && (
                        <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                            Location Denied
                        </span>
                    )}

                    <div className="inline-flex rounded-xl bg-surface p-1 border border-border/50">
                        {(Object.keys(OPENFREEMAP_STYLES) as VectorMapStyle[]).map((key) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setStyleKey(key)}
                                className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                    styleKey === key ? 'bg-white text-text shadow-xs' : 'text-text/60 hover:text-text'
                                }`}
                            >
                                {OPENFREEMAP_STYLES[key].label}
                            </button>
                        ))}
                    </div>

                    <div className="inline-flex rounded-xl bg-surface p-1 border border-border/50">
                        <button
                            type="button"
                            onClick={() => setViewMode('both')}
                            className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'both' ? 'bg-white text-primary shadow-xs' : 'text-text/60 hover:text-text'}`}
                        >
                            Hybrid
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('heatmap')}
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'heatmap' ? 'bg-white text-orange-600 shadow-xs' : 'text-text/60 hover:text-text'}`}
                        >
                            <Flame size={13} /> Heatmap
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('pins')}
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'pins' ? 'bg-white text-text shadow-xs' : 'text-text/60 hover:text-text'}`}
                        >
                            <Layers size={13} /> Pins
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowRadiusMap(!showRadiusMap)}
                        className={`text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer ${showRadiusMap ? 'bg-primary text-white' : 'bg-surface text-text/60 border border-border/50'}`}
                    >
                        {showRadiusMap ? 'Hide Radius' : 'Show Radius'}
                    </button>

                    <div className="w-40">
                        <CustomSelect
                            value={radius}
                            onChange={(e) => setRadius(e.target.value)}
                            disabled={locationDenied}
                            options={[
                                { value: 'All', label: 'All Range' },
                                { value: '5', label: 'Within 5 km' },
                                { value: '10', label: 'Within 10 km' },
                                { value: '20', label: 'Within 20 km' },
                                { value: '50', label: 'Within 50 km' },
                                { value: '100', label: 'Within 100 km' },
                                { value: '200', label: 'Within 200 km' }
                            ]}
                            className="bg-surface border border-border/50 rounded-xl px-4 py-2.5 text-sm font-bold text-text focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-surface relative overflow-hidden">
                <CivicVectorMap
                    points={vectorPoints}
                    styleKey={styleKey}
                    mode={viewMode}
                    userLocation={location && !locationDenied ? [location.lat, location.lng] : null}
                    focusMode={focusMode}
                    defaultCenter={mapCenter}
                    defaultZoom={mapZoom}
                    radiusKm={parsedRadiusKm}
                    showRadius={Boolean(location && !locationDenied && showRadiusMap && parsedRadiusKm)}
                />
            </div>
        </motion.div>
    );
};

export default OperationsMap;
