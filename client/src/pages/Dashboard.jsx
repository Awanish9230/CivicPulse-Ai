import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const [filter, setFilter] = useState('All');
    const [complaints, setComplaints] = useState([]);
    const [stats, setStats] = useState({
        today: 0,
        pending: 0,
        critical: 0,
        resolved: 0
    });

    const fetchComplaints = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/v1/complaint/all', {
                withCredentials: true
            });
            const fetchedComplaints = data.data;
            setComplaints(fetchedComplaints);
            calculateStats(fetchedComplaints);
        } catch (error) {
            console.error("Failed to fetch complaints:", error);
            toast.error("Failed to load dashboard data");
        }
    };

    const calculateStats = (data) => {
        const today = new Date().toDateString();
        let tCount = 0, pCount = 0, cCount = 0, rCount = 0;

        data.forEach(c => {
            if (new Date(c.createdAt).toDateString() === today) tCount++;
            if (c.status === 'Submitted' || c.status === 'In Progress') pCount++;
            if (c.priority === 'Critical') cCount++;
            if (c.status === 'Resolved' || c.status === 'Closed') rCount++;
        });

        setStats({ today: tCount, pending: pCount, critical: cCount, resolved: rCount });
    };

    useEffect(() => {
        fetchComplaints();

        // Socket.io connection for real-time updates
        const socket = io('http://localhost:5000');
        
        socket.on('new_complaint', (newComplaint) => {
            toast('New complaint reported!', { icon: '🚨' });
            setComplaints(prev => {
                const updated = [newComplaint, ...prev];
                calculateStats(updated);
                return updated;
            });
        });

        return () => socket.disconnect();
    }, []);

    const filteredComplaints = complaints.filter(c => {
        if (filter === 'All') return true;
        if (filter === 'Pending') return c.status === 'Submitted' || c.status === 'In Progress';
        if (filter === 'Critical') return c.priority === 'Critical';
        return true;
    });

    return (
        <div className="flex flex-col h-full max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-text">Authority Dashboard</h1>
                <div className="flex items-center gap-4">
                    <div className="bg-surface px-4 py-2 rounded-full font-medium shadow-sm border border-border">
                        Officer ID: AUTH-8291
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
                    <h3 className="text-text/60 font-medium">Today's Complaints</h3>
                    <p className="text-3xl font-bold mt-2">{stats.today}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
                    <h3 className="text-text/60 font-medium">Pending</h3>
                    <p className="text-3xl font-bold text-warning mt-2">{stats.pending}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
                    <h3 className="text-text/60 font-medium">Critical</h3>
                    <p className="text-3xl font-bold text-danger mt-2">{stats.critical}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
                    <h3 className="text-text/60 font-medium">Resolved</h3>
                    <p className="text-3xl font-bold text-secondary mt-2">{stats.resolved}</p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                
                {/* Map Area Placeholder */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-border flex flex-col overflow-hidden min-h-[400px]">
                    <div className="p-4 border-b border-border flex justify-between items-center bg-surface">
                        <h2 className="font-bold text-lg">Live Complaint Map</h2>
                        <select className="bg-white border border-border rounded-md px-2 py-1 text-sm outline-none">
                            <option>All Wards</option>
                            <option>Ward 1</option>
                            <option>Ward 2</option>
                        </select>
                    </div>
                    <div className="flex-1 bg-surface flex items-center justify-center relative">
                        <p className="text-text/50">Interactive Leaflet Map will load here.</p>
                        
                        {/* Fake Map Markers */}
                        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-road rounded-full animate-pulse border-2 border-white shadow-md cursor-pointer"></div>
                        <div className="absolute top-1/2 right-1/3 w-4 h-4 bg-water rounded-full animate-pulse border-2 border-white shadow-md cursor-pointer"></div>
                        <div className="absolute bottom-1/3 left-1/2 w-4 h-4 bg-garbage rounded-full animate-pulse border-2 border-white shadow-md cursor-pointer"></div>
                    </div>
                </div>

                {/* Complaint List */}
                <div className="bg-white rounded-2xl shadow-sm border border-border flex flex-col max-h-[600px]">
                    <div className="p-4 border-b border-border">
                        <h2 className="font-bold text-lg mb-3">Recent Complaints</h2>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {['All', 'Pending', 'Critical'].map(f => (
                                <button 
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-surface hover:bg-surface/80 text-text/80'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2">
                        {filteredComplaints.length === 0 && (
                            <p className="text-center text-text/50 mt-4 text-sm">No complaints found.</p>
                        )}
                        {filteredComplaints.map(c => (
                            <div key={c._id} className="p-3 mb-2 rounded-xl border border-border hover:border-primary/50 transition-colors cursor-pointer group">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-sm">{c.category}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        c.priority === 'Critical' ? 'bg-danger/10 text-danger' :
                                        c.priority === 'High' ? 'bg-warning/10 text-warning' :
                                        'bg-primary/10 text-primary'
                                    }`}>
                                        {c.priority}
                                    </span>
                                </div>
                                <div className="text-xs text-text/60 mb-2 truncate">{c.address?.ward || 'Unknown location'} • {new Date(c.createdAt).toLocaleDateString()}</div>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${
                                        c.status === 'Resolved' || c.status === 'Closed' ? 'bg-secondary' :
                                        c.status === 'In Progress' ? 'bg-primary' : 'bg-warning'
                                    }`}></span>
                                    <span className="text-xs font-medium">{c.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
