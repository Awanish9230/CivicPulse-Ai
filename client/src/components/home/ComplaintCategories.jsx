import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import { Truck, Lightbulb, Trash2, Droplets, Zap, Waves, Car, ShieldAlert, Ban, Volume2, TreePine, Stethoscope, GraduationCap, Bus } from 'lucide-react';

const baseCategories = [
    { icon: Truck, name: "Road Damage" },
    { icon: Lightbulb, name: "Street Lights" },
    { icon: Trash2, name: "Garbage" },
    { icon: Droplets, name: "Water Supply" },
    { icon: Zap, name: "Electricity" },
    { icon: Waves, name: "Drainage" },
    { icon: Car, name: "Traffic" },
    { icon: ShieldAlert, name: "Public Safety" },
    { icon: Ban, name: "Illegal Parking" },
    { icon: Volume2, name: "Noise Pollution" },
    { icon: TreePine, name: "Environment" },
    { icon: Stethoscope, name: "Healthcare" },
    { icon: GraduationCap, name: "Education" },
    { icon: Bus, name: "Public Transport" },
];

const ComplaintCategories = () => {
    const [counts, setCounts] = useState({});

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await api.get('/public/categories');
                if (data.success) {
                    setCounts(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch category stats", error);
            }
        };
        fetchCategories();
    }, []);
    return (
        <section className="py-20">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-black text-slate-800">Explore by Category</h2>
                <p className="text-slate-500 mt-3 text-lg">Browse issues affecting your neighborhood.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {baseCategories.map((cat, idx) => {
                    const count = counts[cat.name] || 0;
                    return (
                        <div key={idx} className="group cursor-pointer bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all flex flex-col items-center justify-center text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 group-hover:bg-indigo-50 text-slate-500 group-hover:text-indigo-600 flex items-center justify-center mb-4 transition-colors">
                                <cat.icon size={28} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">{cat.name}</h3>
                            <p className="text-xs text-slate-400 mt-1 font-medium">{count} reports</p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default ComplaintCategories;
