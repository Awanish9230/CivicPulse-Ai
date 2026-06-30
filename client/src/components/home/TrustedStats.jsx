import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useInView } from 'react-intersection-observer';

// Default labels mapping
const statLabels = {
    totalComplaints: { label: 'Complaints Reported', suffix: '', color: 'text-indigo-600' },
    resolvedIssues: { label: 'Resolved Issues', suffix: '', color: 'text-emerald-500' },
    resolutionRate: { label: 'Resolution Rate', suffix: '%', color: 'text-blue-500' },
    activeAuthorities: { label: 'Active Authorities', suffix: '', color: 'text-orange-500' },
    citiesCovered: { label: 'Cities Covered', suffix: '', color: 'text-purple-500' },
};

const AnimatedCounter = ({ end, duration, inView }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!inView) return;
        
        let start = 0;
        const totalFrames = Math.round((duration * 1000) / 16); // 60fps
        const increment = end / totalFrames;
        
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [end, duration, inView]);

    return <>{count.toLocaleString()}</>;
};

const TrustedStats = () => {
    const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 });
    const [stats, setStats] = useState({
        totalComplaints: 0,
        resolvedIssues: 0,
        resolutionRate: 0,
        activeAuthorities: 0,
        citiesCovered: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await axios.get('http://localhost:5000/api/v1/public/stats');
                if(data.success) {
                    setStats(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch public stats", error);
            }
        };
        fetchStats();
    }, []);

    return (
        <section className="py-16">
            <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-slate-800">Trusted by Communities Nationwide</h2>
                <p className="text-slate-500 mt-2">Real impact driven by transparency and accountability.</p>
            </div>
            
            <div ref={ref} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {Object.keys(statLabels).map((key, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center transform transition-transform hover:-translate-y-1">
                        <div className={`text-4xl font-black mb-2 ${statLabels[key].color}`}>
                            <AnimatedCounter end={stats[key]} duration={2} inView={inView} />
                            {statLabels[key].suffix}
                        </div>
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                            {statLabels[key].label}
                        </div>
                    </div>
                ))}
                
                {/* Static Monitoring Block */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center transform transition-transform hover:-translate-y-1">
                    <div className="text-4xl font-black mb-2 text-rose-500">
                        <AnimatedCounter end={24} duration={2} inView={inView} />/7
                    </div>
                    <div className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                        Monitoring
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TrustedStats;
