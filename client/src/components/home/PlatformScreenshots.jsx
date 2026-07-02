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
        <section className="py-24">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Platform Showcase</h2>
                <p className="text-slate-500 mt-4 text-lg font-medium">Explore CivicPulse AI's powerful dashboards.</p>
            </div>

            <div className={`relative bg-slate-900 rounded-[40px] p-8 md:p-16 text-white overflow-hidden border border-slate-800 shadow-2xl`}>
                <div className={`absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br ${s.bg} opacity-10 blur-[120px] rounded-full pointer-events-none transition-colors duration-700`} />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-12 md:gap-24">
                    <div className="w-full md:w-1/2 space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-300 font-bold text-sm backdrop-blur-sm">
                            <Monitor size={16} /> {current + 1} / {screenshots.length}
                        </div>
                        <div>
                            <h3 className={`text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r ${s.bg} mb-4 tracking-tight`}>
                                {s.title}
                            </h3>
                            <p className="text-lg text-slate-400 leading-relaxed font-medium">{s.desc}</p>
                        </div>
                        
                        <div className="flex gap-4 pt-4">
                            <button onClick={prev} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/10 hover:text-white transition-all text-slate-400">
                                <ChevronLeft size={20} />
                            </button>
                            <button onClick={next} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/10 hover:text-white transition-all text-slate-400">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="w-full md:w-1/2">
                        <div className="bg-slate-800/50 backdrop-blur-xl rounded-[32px] border border-white/5 p-8 h-[360px] flex items-center justify-center shadow-inner relative overflow-hidden group">
                            <div className={`absolute inset-0 bg-gradient-to-br ${s.bg} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />
                            <div className="text-center space-y-5 relative z-10">
                                <div className="w-20 h-20 mx-auto rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mb-2">
                                    <Monitor size={32} className="text-slate-400" />
                                </div>
                                <p className="text-base text-slate-300 font-bold tracking-wide">Live Preview Available</p>
                                <p className="text-sm text-slate-500 font-medium">Navigate to the actual dashboard to experience it</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PlatformScreenshots;
