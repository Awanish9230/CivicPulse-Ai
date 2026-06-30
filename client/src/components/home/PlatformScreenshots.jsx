import React, { useState } from 'react';
import { Monitor, Smartphone, ChevronLeft, ChevronRight } from 'lucide-react';

const screenshots = [
    { title: "Citizen Dashboard", desc: "Track your complaints, upvote issues, and engage with the community.", bg: "from-indigo-500 to-blue-600" },
    { title: "Admin Control Panel", desc: "Full oversight of platform operations, analytics, and authority management.", bg: "from-orange-500 to-red-600" },
    { title: "Authority Dashboard", desc: "Manage assigned complaints, update statuses, and communicate with citizens.", bg: "from-emerald-500 to-teal-600" },
    { title: "AI Analytics", desc: "Gemini-powered insights including sentiment analysis and hotspot detection.", bg: "from-purple-500 to-indigo-600" },
];

const PlatformScreenshots = () => {
    const [current, setCurrent] = useState(0);
    const next = () => setCurrent((prev) => (prev + 1) % screenshots.length);
    const prev = () => setCurrent((prev) => (prev - 1 + screenshots.length) % screenshots.length);
    const s = screenshots[current];

    return (
        <section className="py-20">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-black text-slate-800">Platform Showcase</h2>
                <p className="text-slate-500 mt-3 text-lg">Explore CivicPulse AI's powerful dashboards.</p>
            </div>

            <div className={`relative bg-gradient-to-br ${s.bg} rounded-[40px] p-8 md:p-16 text-white overflow-hidden`}>
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 blur-[100px] rounded-full pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                    <div className="w-full md:w-1/2 space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white font-bold text-sm backdrop-blur-sm">
                            <Monitor size={16} /> {current + 1} / {screenshots.length}
                        </div>
                        <h3 className="text-3xl md:text-4xl font-black">{s.title}</h3>
                        <p className="text-lg text-white/80 leading-relaxed">{s.desc}</p>
                        
                        <div className="flex gap-3 pt-4">
                            <button onClick={prev} className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                                <ChevronLeft size={20} />
                            </button>
                            <button onClick={next} className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="w-full md:w-1/2">
                        <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 h-[300px] flex items-center justify-center">
                            <div className="text-center space-y-4">
                                <Monitor size={64} className="mx-auto text-white/40" />
                                <p className="text-sm text-white/60 font-bold">Live Preview Available</p>
                                <p className="text-xs text-white/40">Navigate to the actual dashboard to experience it</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PlatformScreenshots;
