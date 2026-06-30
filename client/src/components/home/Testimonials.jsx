import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';

const testimonials = [
    {
        name: "Anonymous Citizen",
        role: "Resident, Sector 14",
        text: "I reported a broken water pipe at midnight and by morning, the repair crew was already there. This platform literally changed my neighborhood.",
        rating: 5,
    },
    {
        name: "Municipal Officer",
        role: "Water Department",
        text: "CivicPulse AI's automatic routing saves us hours of manual complaint sorting. We can now focus entirely on resolution.",
        rating: 5,
    },
    {
        name: "Anonymous Citizen",
        role: "Resident, Downtown",
        text: "The anonymity feature gave me the confidence to report an illegal construction site. It was demolished within a week.",
        rating: 4,
    },
];

const Testimonials = () => {
    const [current, setCurrent] = useState(0);

    const next = () => setCurrent((prev) => (prev + 1) % testimonials.length);
    const prev = () => setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);

    const t = testimonials[current];

    return (
        <section className="py-20 bg-slate-50 -mx-6 px-6 lg:-mx-20 lg:px-20 rounded-[40px] border border-slate-100">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-black text-slate-800">What People Say</h2>
                <p className="text-slate-500 mt-3 text-lg">Hear from citizens and authorities using CivicPulse AI.</p>
            </div>

            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-[32px] p-10 border border-slate-200 shadow-sm text-center relative">
                    <Quote className="absolute top-6 left-6 text-indigo-100" size={48} />
                    
                    <p className="text-lg md:text-xl text-slate-600 leading-relaxed italic relative z-10 mb-8">
                        "{t.text}"
                    </p>

                    <div className="flex items-center justify-center gap-1 mb-4">
                        {Array.from({ length: t.rating }).map((_, i) => (
                            <Star key={i} size={18} className="text-amber-400 fill-amber-400" />
                        ))}
                    </div>

                    <div className="font-bold text-slate-800">{t.name}</div>
                    <div className="text-sm text-slate-500">{t.role}</div>
                </div>

                <div className="flex justify-center gap-4 mt-8">
                    <button onClick={prev} className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm">
                        <ChevronLeft size={20} className="text-slate-600" />
                    </button>
                    <div className="flex items-center gap-2">
                        {testimonials.map((_, idx) => (
                            <div key={idx} className={`w-2.5 h-2.5 rounded-full transition-colors ${idx === current ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                        ))}
                    </div>
                    <button onClick={next} className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm">
                        <ChevronRight size={20} className="text-slate-600" />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
