import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LiveComplaintMap = () => {
    const [reports, setReports] = useState([]);

    useEffect(() => {
        const fetchMapData = async () => {
            try {
                const { data } = await api.get('/public/map');
                if (data.success) {
                    setReports(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch map data", error);
            }
        };
        fetchMapData();
    }, []);
    // Default center (New Delhi for demonstration)
    const center = [28.6139, 77.2090];

    return (
        <section className="py-20">
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-800">Live Complaint Map</h2>
                    <p className="text-slate-500 mt-2 text-lg">Visualize urban issues in real-time across the city.</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-sm font-bold text-slate-600">Open</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-sm font-bold text-slate-600">Resolved</span></div>
                </div>
            </div>

            <div className="h-[500px] w-full rounded-[40px] overflow-hidden border border-slate-200 shadow-sm relative z-0">
                <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                    
                    {/* Heatmap mock (Circles) */}
                    <Circle center={[28.6139, 77.2090]} pathOptions={{ fillColor: 'red', color: 'transparent' }} radius={400} />
                    <Circle center={[28.6200, 77.2150]} pathOptions={{ fillColor: 'orange', color: 'transparent' }} radius={300} />

                    {/* Markers */}
                    {reports.map(report => {
                        // Assuming location has lat/lng or similar structure based on the schema
                        // For this demo, let's parse mock or assume coordinates exist
                        const lng = report.location?.coordinates?.[0] || (77.2 + Math.random() * 0.1);
                        const lat = report.location?.coordinates?.[1] || (28.6 + Math.random() * 0.1);
                        
                        return (
                            <Marker key={report._id} position={[lat, lng]}>
                                <Popup>
                                    <div className="font-bold text-slate-800">{report.title}</div>
                                    <div className="text-xs text-slate-500">Status: {report.status}</div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </div>
        </section>
    );
};

export default LiveComplaintMap;
