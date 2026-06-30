import React from 'react';
import { Camera, BrainCircuit, UserCheck, CheckCircle2 } from 'lucide-react';

const steps = [
    { icon: Camera, title: "Report Issue", desc: "Snap a photo of the problem and submit it completely anonymously.", color: "text-indigo-500", bg: "bg-indigo-50" },
    { icon: BrainCircuit, title: "AI Verifies", desc: "Our Gemini AI classifies the issue, detects spam, and extracts location data.", color: "text-purple-500", bg: "bg-purple-50" },
    { icon: UserCheck, title: "Authority Assigned", desc: "The platform automatically routes it to the correct municipal department.", color: "text-orange-500", bg: "bg-orange-50" },
    { icon: CheckCircle2, title: "Track Resolution", desc: "Get real-time updates and notifications as the issue gets fixed.", color: "text-emerald-500", bg: "bg-emerald-50" },
];

const HowItWorks = () => {
    return (
        <section className="py-20">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-black text-slate-800">How It Works</h2>
                <p className="text-slate-500 mt-3 text-lg">A seamless, 4-step process to improve your city.</p>
            </div>

            <div className="relative">
                {/* Connecting Line (Hidden on mobile) */}
                <div className="hidden lg:block absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                    {steps.map((step, idx) => (
                        <div key={idx} className="relative group">
                            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm text-center transition-all hover:shadow-xl hover:-translate-y-2 h-full">
                                {/* Step Number */}
                                <div className="absolute -top-4 -right-4 w-10 h-10 bg-slate-800 text-white font-black rounded-full flex items-center justify-center border-4 border-white shadow-sm z-20">
                                    {idx + 1}
                                </div>

                                <div className={`w-20 h-20 mx-auto rounded-3xl ${step.bg} flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                                    <step.icon className={step.color} size={36} strokeWidth={1.5} />
                                </div>
                                
                                <h3 className="text-xl font-bold text-slate-800 mb-3">{step.title}</h3>
                                <p className="text-slate-500 leading-relaxed">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
