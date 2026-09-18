import React from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';

const stories = [
    {
        title: "Pothole Fixed in 48 Hours",
        before: "A dangerous pothole on NH-9 caused multiple accidents. Citizens reported it anonymously.",
        after: "PWD dispatched a crew within 24 hours. Road was fully repaired in 48 hours.",
        category: "Road",
        resolution: "48 hours",
    },
    {
        title: "Street Light Restored",
        before: "An entire colony was in darkness for 2 weeks. Multiple complaints were filed.",
        after: "AI clustered 12 duplicate reports and escalated to the Electricity Board. Fixed in 3 days.",
        category: "Electricity",
        resolution: "3 days",
    },
    {
        title: "Illegal Dump Cleared",
        before: "A vacant lot was being used as an illegal garbage dump, causing health hazards.",
        after: "Municipal workers cleaned the site and installed a 'No Dumping' sign with CCTV.",
        category: "Garbage",
        resolution: "5 days",
    },
];

const SuccessStories = () => {
    return (
        <section className="py-20">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-black text-slate-800">Success Stories</h2>
                <p className="text-slate-500 mt-3 text-lg">Real problems solved by real communities.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {stories.map((story, idx) => (
                    <div key={idx} className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="p-6 border-b border-slate-100">
                            <span className="inline-block px-3 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-full mb-3">{story.category}</span>
                            <h3 className="text-xl font-bold text-slate-800">{story.title}</h3>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <div className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Before</div>
                                <p className="text-sm text-slate-500 leading-relaxed">{story.before}</p>
                            </div>
                            
                            <div className="flex justify-center">
                                <ArrowRight className="text-slate-300" size={20} />
                            </div>
                            
                            <div>
                                <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">After</div>
                                <p className="text-sm text-slate-500 leading-relaxed">{story.after}</p>
                            </div>
                        </div>

                        <div className="px-6 pb-6">
                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                                <CheckCircle size={16} /> Resolved in {story.resolution}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default SuccessStories;
