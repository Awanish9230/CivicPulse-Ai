import React from 'react';
import { Shield, Brain, Activity, Bell, Map, Users, AlertCircle, ShieldAlert, Heart, Lock } from 'lucide-react';

const features = [
    { title: "Anonymous Reporting", desc: "Your identity rotates every 10 minutes. Fully secure.", icon: Shield, color: "text-indigo-500", bg: "bg-indigo-50" },
    { title: "AI Classification", desc: "Gemini AI categorizes issues instantly and accurately.", icon: Brain, color: "text-purple-500", bg: "bg-purple-50" },
    { title: "Real-time Tracking", desc: "Watch the status of your complaint change live.", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-50" },
    { title: "Live Notifications", desc: "Get socket-powered instant alerts on updates.", icon: Bell, color: "text-orange-500", bg: "bg-orange-50" },
    { title: "Geo Location", desc: "Precise GPS tagging ensures exact dispatching.", icon: Map, color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Department Auto-Assign", desc: "Issues are automatically sent to the correct authority.", icon: Users, color: "text-rose-500", bg: "bg-rose-50" },
    { title: "AI Duplicate Detection", desc: "Prevents spam by clustering identical complaints.", icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50" },
    { title: "Escalation System", desc: "Unresolved issues automatically escalate up the chain.", icon: ShieldAlert, color: "text-red-500", bg: "bg-red-50" },
    { title: "Community Support", desc: "Upvote and comment on local neighborhood issues.", icon: Heart, color: "text-pink-500", bg: "bg-pink-50" },
    { title: "Secure Authentication", desc: "Robust JWT and Role-Based Access Control.", icon: Lock, color: "text-slate-600", bg: "bg-slate-100" },
];

const KeyFeatures = () => {
    return (
        <section className="py-20 bg-slate-50 -mx-6 px-6 lg:-mx-20 lg:px-20 mt-10 rounded-[40px] border border-slate-100">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-black text-slate-800">Platform Features</h2>
                <p className="text-slate-500 mt-3 text-lg">Everything you need to build a better community.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {features.map((feat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className={`w-12 h-12 rounded-xl ${feat.bg} flex items-center justify-center mb-4`}>
                            <feat.icon className={feat.color} size={24} strokeWidth={2} />
                        </div>
                        <h3 className="font-bold text-slate-800 mb-2">{feat.title}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">{feat.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default KeyFeatures;
