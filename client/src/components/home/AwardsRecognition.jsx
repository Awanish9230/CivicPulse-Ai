import React from 'react';
import { Award, Medal, Trophy } from 'lucide-react';

const awards = [
    { icon: Trophy, title: "Best Civic Tech Platform", org: "Smart India Hackathon 2025", color: "text-amber-500", bg: "bg-amber-50" },
    { icon: Medal, title: "Innovation in Governance", org: "Digital India Awards", color: "text-blue-500", bg: "bg-blue-50" },
    { icon: Award, title: "Top Open Source Project", org: "GitHub Community", color: "text-purple-500", bg: "bg-purple-50" },
];

const AwardsRecognition = () => {
    return (
        <section className="py-16">
            <div className="text-center mb-12">
                <h2 className="text-2xl font-bold text-slate-800">Recognition</h2>
                <p className="text-slate-500 mt-2">Acknowledged by leading organizations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {awards.map((award, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center hover:shadow-md transition-shadow">
                        <div className={`w-16 h-16 mx-auto rounded-2xl ${award.bg} flex items-center justify-center mb-4`}>
                            <award.icon className={award.color} size={32} />
                        </div>
                        <h3 className="font-bold text-slate-800 mb-1">{award.title}</h3>
                        <p className="text-sm text-slate-500">{award.org}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default AwardsRecognition;
