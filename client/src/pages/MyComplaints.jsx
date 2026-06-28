import { motion } from 'framer-motion';
import { Search, Filter, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

const mockMyComplaints = [
    {
        id: 'C-8912',
        title: 'Broken Streetlight',
        date: 'Oct 12, 2026',
        status: 'In Progress',
        slaRisk: false
    },
    {
        id: 'C-8900',
        title: 'Water Leakage',
        date: 'Oct 10, 2026',
        status: 'Pending',
        slaRisk: true // > 48h without action
    }
];

const MyComplaints = () => {
    const [filter, setFilter] = useState('All');

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h1 className="text-3xl font-black text-text tracking-tight">My Reports</h1>
                <div className="flex gap-2">
                    {['All', 'Active', 'Resolved'].map(f => (
                        <button 
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${filter === f ? 'bg-text text-white shadow-lg' : 'bg-white text-text/60 border border-border/50 hover:bg-surface'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-4">
                {mockMyComplaints.map((c, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={c.id}
                        className={`bg-white rounded-[2rem] p-6 border transition-all ${c.slaRisk ? 'border-danger/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'border-border/50 shadow-sm'}`}
                    >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-[10px] font-black tracking-widest text-text/40">{c.id}</span>
                                    {c.slaRisk && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-danger bg-danger/10 px-2 py-0.5 rounded-full">
                                            <AlertTriangle size={12} /> SLA breached
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-text">{c.title}</h3>
                                <p className="text-sm text-text/50 mt-1">Reported on {c.date}</p>
                            </div>
                            
                            {/* Tracking Timeline Bar */}
                            <div className="w-full md:w-1/2 flex items-center justify-between relative mt-4 md:mt-0">
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-surface rounded-full -z-10"></div>
                                {/* Active Line */}
                                <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full -z-10 transition-all ${c.slaRisk ? 'bg-danger' : 'bg-primary'}`} style={{ width: c.status === 'In Progress' ? '50%' : '10%' }}></div>
                                
                                {['Submitted', 'Assigned', 'Resolved'].map((step, idx) => {
                                    const isActive = idx === 0 || (idx === 1 && c.status === 'In Progress');
                                    return (
                                        <div key={step} className="flex flex-col items-center">
                                            <div className={`w-4 h-4 rounded-full border-4 mb-2 transition-colors ${isActive ? (c.slaRisk ? 'bg-danger border-danger/30' : 'bg-primary border-primary/30') : 'bg-surface border-white'}`}></div>
                                            <span className={`text-[10px] font-bold ${isActive ? 'text-text' : 'text-text/40'}`}>{step}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default MyComplaints;
