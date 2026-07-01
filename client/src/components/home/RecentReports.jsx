import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import { ArrowUp, MapPin, Clock, MessageSquare } from 'lucide-react';

const RecentReports = () => {
    const [reports, setReports] = useState([]);

    useEffect(() => {
        const fetchRecent = async () => {
            try {
                const { data } = await api.get('/public/recent');
                if (data.success) {
                    setReports(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch recent reports", error);
            }
        };
        fetchRecent();
    }, []);

    const getStatusColor = (status) => {
        switch(status) {
            case 'Resolved': return "text-emerald-600 bg-emerald-50 border-emerald-200";
            case 'In Progress': return "text-amber-600 bg-amber-50 border-amber-200";
            default: return "text-indigo-600 bg-indigo-50 border-indigo-200"; // Pending / Verified
        }
    };
    return (
        <section className="py-20 bg-slate-50 -mx-6 px-6 lg:-mx-20 lg:px-20 rounded-[40px] border border-slate-100">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-800">Recent Community Reports</h2>
                    <p className="text-slate-500 mt-2 text-lg">See what your neighbors are fixing.</p>
                </div>
                <button className="hidden md:block text-indigo-600 font-bold hover:text-indigo-700">View All Reports &rarr;</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {reports.map((report) => (
                    <div key={report._id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                        <div className="h-48 overflow-hidden relative">
                            <img src={report.imageUrl || (report.imageUrls && report.imageUrls[0]) || "https://images.unsplash.com/photo-1519782508688-6934c9c585c5?q=80&w=400&h=300&auto=format&fit=crop"} alt={report.category || "Report"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(report.status)}`}>
                                {report.status || "Pending"}
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-800 mb-2 truncate">{report.category ? `${report.category} Issue` : "Untitled"}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                                <MapPin size={16} /> <span className="truncate">{report.address?.fullAddress || report.address?.ward || report.address?.district || 'Location Hidden'}</span>
                            </div>
                            
                            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-4 text-slate-500">
                                    <div className="flex items-center gap-1 font-bold text-slate-700">
                                        <ArrowUp size={18} className="text-indigo-500" /> {report.supportCount || 0}
                                    </div>
                                    <div className="flex items-center gap-1 text-sm">
                                        <MessageSquare size={16} /> 0
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                    <Clock size={14} /> {new Date(report.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <button className="md:hidden w-full mt-8 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm">
                View All Reports
            </button>
        </section>
    );
};

export default RecentReports;
