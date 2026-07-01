import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, map.getZoom());
        }
    }, [center, map]);
    return null;
};

const HeatmapLayer = ({ points }) => {
    const map = useMap();
    useEffect(() => {
        if (!points || points.length === 0) return;
        
        const heatLayer = L.heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 15,
            gradient: { 0.4: 'blue', 0.6: 'lime', 0.8: 'yellow', 1: 'red' }
        }).addTo(map);

        return () => {
            map.removeLayer(heatLayer);
        };
    }, [points, map]);
    return null;
};

const LiveComplaintMap = () => {
    const [reports, setReports] = useState([]);
    const [center, setCenter] = useState([28.6139, 77.2090]); // Default to New Delhi
    const [heatPoints, setHeatPoints] = useState([]);

    useEffect(() => {
        const fetchMapData = async () => {
            try {
                const { data } = await api.get('/public/map');
                if (data.success) {
                    setReports(data.data);
                    
                    const points = [];
                    data.data.forEach(r => {
                        if (r.location?.coordinates?.length === 2) {
                            points.push([r.location.coordinates[1], r.location.coordinates[0], 1]); // [lat, lng, intensity]
                        }
                    });
                    setHeatPoints(points);

                    // Center on the first valid location found
                    if (points.length > 0) {
                        setCenter([points[0][0], points[0][1]]);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch map data", error);
            }
        };
        fetchMapData();
    }, []);

    return (
        <section className="py-20">
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-800">Live Complaint Map</h2>
                    <p className="text-slate-500 mt-2 text-lg">Visualize urban issues in real-time across the city.</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-sm font-bold text-slate-600">High Density</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-sm font-bold text-slate-600">Low Density</span></div>
                </div>
            </div>

            <div className="h-[500px] w-full rounded-[40px] overflow-hidden border border-slate-200 shadow-sm relative z-0">
                <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                    
                    <MapUpdater center={center} />
                    <HeatmapLayer points={heatPoints} />
                </MapContainer>
            </div>
        </section>
    );
};

export default LiveComplaintMap;
