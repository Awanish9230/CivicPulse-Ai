import React from 'react';

const partners = [
    "Google Cloud", "MongoDB", "Vercel", "Socket.IO", "React", "Node.js", "Express.js", "Leaflet"
];

const PartnersSection = () => {
    return (
        <section className="py-16">
            <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-slate-800">Built With World-Class Technology</h2>
                <p className="text-slate-500 mt-2">Powered by industry-leading platforms and frameworks.</p>
            </div>

            <div className="flex flex-wrap justify-center gap-6">
                {partners.map((partner, idx) => (
                    <div key={idx} className="px-8 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-600 font-bold text-sm hover:shadow-md hover:text-indigo-600 hover:border-indigo-100 transition-all cursor-default">
                        {partner}
                    </div>
                ))}
            </div>
        </section>
    );
};

export default PartnersSection;
