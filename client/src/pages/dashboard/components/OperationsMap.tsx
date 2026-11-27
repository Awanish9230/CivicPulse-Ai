import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import CustomSelect from '../../../components/common/CustomSelect';
import type { Complaint } from '../../../types';

interface GeoLocation {
    lat: number;
    lng: number;
}

interface MapUpdaterProps {
    center: [number, number];
    zoom: number;
}

const MapUpdater: React.FC<MapUpdaterProps> = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom, { duration: 1.5 });
    }, [center, zoom, map]);
    return null;
};

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
    const mapCenter: [number, number] = location ? [location.lat, location.lng] : [28.6139, 77.2090];
    const mapZoom = location ? (radius === 'All' ? 5 : (Number(radius) > 50 ? 7 : 11)) : 12;

    const groupedByCoord = complaints.reduce<Record<string, Complaint[]>>((acc, c) => {
        if (!c.location?.coordinates) return acc;
        const key = `${c.location.coordinates[1]},${c.location.coordinates[0]}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(c);
        return acc;
    }, {});

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full bg-white rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-border/50 flex flex-col overflow-hidden h-[500px]"
        >
            <div className="p-6 border-b border-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white z-10">
                <div>
                    <h2 className="font-black text-xl text-text">Live Operations Map</h2>
                    <p className="text-xs font-medium text-text/50">Tracking active incidents across the city</p>
                </div>
                <div className="flex items-center gap-3">
                    {locationDenied && (
                        <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                            Location Denied
                        </span>
                    )}
                    <button
                        onClick={() => setShowRadiusMap(!showRadiusMap)}
                        className={`text-xs font-bold px-3 py-2 rounded-xl transition-colors ${showRadiusMap ? 'bg-primary text-white' : 'bg-surface text-text/60 border border-border/50'}`}
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
            <div className="flex-1 bg-surface relative overflow-hidden group">
                <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    scrollWheelZoom={true}
                    className="h-full w-full z-0"
                >
                    <MapUpdater center={mapCenter} zoom={mapZoom} />
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />

                    {location && !locationDenied && showRadiusMap && radius !== 'All' && (
                        <Circle
                            center={[location.lat, location.lng]}
                            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 2 }}
                            radius={parseInt(radius, 10) * 1000}
                        />
                    )}

                    {Object.entries(groupedByCoord).map(([coordKey, groupComplaints]) => {
                        const [lat, lng] = coordKey.split(',').map(Number);
                        const hasCritical = groupComplaints.some((c) => c.priority === 'Critical');
                        const hasPending = groupComplaints.some((c) => c.status !== 'Resolved' && c.status !== 'Closed');
                        const color = hasCritical ? '#ef4444' : hasPending ? '#f97316' : '#22c55e';
                        const glowOpacity = Math.min(0.15 + (groupComplaints.length - 1) * 0.05, 0.5);

                        return (
                            <React.Fragment key={coordKey}>
                                <CircleMarker
                                    center={[lat, lng]}
                                    pathOptions={{ color: 'transparent', fillColor: color, fillOpacity: glowOpacity }}
                                    radius={25 + Math.min(groupComplaints.length * 2, 10)}
                                />
                                <CircleMarker
                                    center={[lat, lng]}
                                    pathOptions={{ color: 'white', weight: 1, fillColor: color, fillOpacity: 0.8 }}
                                    radius={6 + (groupComplaints.length > 1 ? 2 : 0)}
                                >
                                    <Popup>
                                        <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                            <div className="font-bold text-xs text-slate-500 mb-2 border-b border-slate-200 pb-1 sticky top-0 bg-white">
                                                {groupComplaints.length} Issue{groupComplaints.length > 1 ? 's' : ''} reported here
                                            </div>
                                            {groupComplaints.map((c) => (
                                                <div key={c._id} className="mb-2 pb-2 border-b border-slate-100 last:border-0 last:mb-0 last:pb-0">
                                                    <div className="font-bold text-sm text-slate-800">{c.category} Issue</div>
                                                    <div className="text-xs text-slate-500 mb-1">{c.status} | {c.priority} Priority</div>
                                                    <div className="text-[10px] text-slate-400">ID: {c._id.slice(-6).toUpperCase()}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </Popup>
                                </CircleMarker>
                            </React.Fragment>
                        );
                    })}
                </MapContainer>
            </div>
        </motion.div>
    );
};

export default OperationsMap;
