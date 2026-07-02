import React from 'react';
import { BrainCircuit, Filter, Layers, Target, FileText, HeartHandshake, Map, CheckCircle } from 'lucide-react';

const aiFeatures = [
    { title: "Spam Detection", desc: "Filters out irrelevant or fake complaints instantly.", icon: Filter, color: "text-red-500", bg: "bg-red-50" },
    { title: "Duplicate Clustering", desc: "Groups identical issues from multiple users.", icon: Layers, color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Priority Prediction", desc: "Automatically flags urgent hazards.", icon: Target, color: "text-orange-500", bg: "bg-orange-50" },
    { title: "Auto Assignment", desc: "Routes issues to the exact municipal department.", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50" },
    { title: "Complaint Summary", desc: "Generates concise summaries for authorities.", icon: FileText, color: "text-purple-500", bg: "bg-purple-50" },
    { title: "Sentiment Analysis", desc: "Gauges citizen frustration levels over time.", icon: HeartHandshake, color: "text-pink-500", bg: "bg-pink-50" },
    { title: "Hotspot Detection", desc: "Identifies failing infrastructure zones.", icon: Map, color: "text-indigo-500", bg: "bg-indigo-50" },
];

const AIFeatures = () => {
    return (
        <section className="py-20 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full blur-[100px] -z-10" />

            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm mb-4">
                    <BrainCircuit size={16} /> Powered by Google Gemini 2.5 Flash
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight">AI at the Core of <br/> Civic Governance</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {aiFeatures.map((feat, idx) => (
                    <div key={idx} className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/60 shadow-lg shadow-indigo-100/20 hover:-translate-y-2 transition-transform">
                        <div className={`w-12 h-12 rounded-xl ${feat.bg} flex items-center justify-center mb-4`}>
                            <feat.icon className={feat.color} size={24} />
                        </div>
                        <h3 className="font-bold text-slate-800 mb-2">{feat.title}</h3>
                        <p className="text-sm text-slate-500">{feat.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default AIFeatures;
