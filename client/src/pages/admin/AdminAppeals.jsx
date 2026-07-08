import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Check, X, ShieldAlert, User, Clock } from 'lucide-react';

const AdminAppeals = () => {
    const [appeals, setAppeals] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAppeals = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/appeal/list`, {
                withCredentials: true
            });
            setAppeals(data.data);
        } catch (error) {
            toast.error('Failed to fetch appeals');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppeals();
    }, []);

    const handleResolve = async (id, status) => {
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/v1/appeal/resolve/${id}`,
                { status, note: "Reviewed by Admin" },
                { withCredentials: true }
            );
            toast.success(`Appeal ${status} successfully`);
            fetchAppeals();
        } catch (error) {
            toast.error(`Failed to ${status.toLowerCase()} appeal`);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Ban Appeals</h1>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : appeals.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-slate-100 shadow-sm">
                    <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-slate-700">No Pending Appeals</h3>
                    <p className="text-slate-500">All user appeals have been resolved.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {appeals.map(appeal => (
                        <div key={appeal._id} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                        appeal.status === 'Pending' ? 'bg-orange-100 text-orange-600' :
                                        appeal.status === 'Approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                    }`}>
                                        {appeal.status}
                                    </span>
                                    <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                                        <Clock size={12} />
                                        {new Date(appeal.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-2 font-medium">
                                    <User size={14} className="text-slate-400" />
                                    <span>User ID: {appeal.user?._id}</span>
                                    <span className="text-slate-300">|</span>
                                    <span className="text-red-500 font-bold">{appeal.user?.strikes} Strikes</span>
                                </div>
                                <p className="text-slate-700 text-sm italic bg-slate-50 p-3 rounded-lg border border-slate-100">"{appeal.reason}"</p>
                            </div>
                            
                            {appeal.status === 'Pending' && (
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => handleResolve(appeal._id, 'Approved')}
                                        className="flex items-center gap-1 bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                                    >
                                        <Check size={16} /> Approve & Unban
                                    </button>
                                    <button
                                        onClick={() => handleResolve(appeal._id, 'Rejected')}
                                        className="flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                                    >
                                        <X size={16} /> Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminAppeals;
