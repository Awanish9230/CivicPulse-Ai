import { useState } from 'react';

const Dashboard = () => {
    const [filter, setFilter] = useState('All');

    const complaints = [
        { id: '1', type: 'Road', status: 'Pending', priority: 'High', area: 'Ward 4', date: '2026-06-28' },
        { id: '2', type: 'Garbage', status: 'In Progress', priority: 'Medium', area: 'Ward 2', date: '2026-06-27' },
        { id: '3', type: 'Water', status: 'Resolved', priority: 'Critical', area: 'Ward 1', date: '2026-06-26' },
    ];

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
                    <p className="text-3xl font-bold mt-2">24</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
                    <h3 className="text-text/60 font-medium">Pending</h3>
                    <p className="text-3xl font-bold text-warning mt-2">12</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
                    <h3 className="text-text/60 font-medium">Critical</h3>
                    <p className="text-3xl font-bold text-danger mt-2">3</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
                    <h3 className="text-text/60 font-medium">Resolved (This Week)</h3>
                    <p className="text-3xl font-bold text-secondary mt-2">89</p>
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
                <div className="bg-white rounded-2xl shadow-sm border border-border flex flex-col">
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
                        {complaints.map(c => (
                            <div key={c.id} className="p-3 mb-2 rounded-xl border border-border hover:border-primary/50 transition-colors cursor-pointer group">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-sm">{c.type}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        c.priority === 'Critical' ? 'bg-danger/10 text-danger' :
                                        c.priority === 'High' ? 'bg-warning/10 text-warning' :
                                        'bg-primary/10 text-primary'
                                    }`}>
                                        {c.priority}
                                    </span>
                                </div>
                                <div className="text-xs text-text/60 mb-2">{c.area} • {c.date}</div>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${
                                        c.status === 'Resolved' ? 'bg-secondary' :
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
