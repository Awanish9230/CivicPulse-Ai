import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrainCircuit, Sparkles, RefreshCw, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

const AdminAIDashboard = () => {
    const [insights, setInsights] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchInsights = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('http://localhost:5000/api/v1/admin/ai/insights', { withCredentials: true });
            setInsights(data.data.aiAnalysis);
        } catch (error) {
            toast.error("Failed to fetch AI Insights");
            setInsights("An error occurred while generating insights. Check API keys and server logs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3">
                        <BrainCircuit className="text-orange-600" size={32} />
                        AI Insights Dashboard
                    </h1>
                    <p className="text-slate-500 mt-1">Powered by Google Gemini 2.5 Flash to detect anomalies and provide recommendations.</p>
                </div>
                <button 
                    onClick={fetchInsights}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 rounded-xl text-white hover:bg-orange-700 font-medium shadow-lg shadow-orange-200 disabled:opacity-50 transition-all"
                >
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    {loading ? "Generating..." : "Regenerate Analysis"}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-6 text-white shadow-xl shadow-orange-500/20">
                    <Sparkles className="mb-4" size={32} />
                    <h3 className="text-lg font-bold mb-1">Predictive Analysis</h3>
                    <p className="text-orange-100 text-sm">AI monitors recent trends to predict infrastructure failure hotspots.</p>
                </div>
                <div className="bg-gradient-to-br from-rose-500 to-orange-500 rounded-3xl p-6 text-white shadow-xl shadow-rose-500/20">
                    <AlertTriangle className="mb-4" size={32} />
                    <h3 className="text-lg font-bold mb-1">Fraud Detection</h3>
                    <p className="text-rose-100 text-sm">Automatically flags duplicate and spam complaints to reduce workload.</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/20">
                    <ShieldCheck className="mb-4" size={32} />
                    <h3 className="text-lg font-bold mb-1">Automated Triage</h3>
                    <p className="text-emerald-100 text-sm">Assigns severity and recommends departments instantly.</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                    <Activity className="text-indigo-600" size={24} />
                    <h2 className="text-xl font-bold text-slate-800">Latest Live Analysis</h2>
                </div>
                
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 font-medium">Gemini AI is analyzing millions of data points...</p>
                    </div>
                ) : (
                    <div className="prose prose-slate prose-indigo max-w-none">
                        <ReactMarkdown>{insights}</ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAIDashboard;
