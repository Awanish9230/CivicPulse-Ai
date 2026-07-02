import React from 'react';

const AdminBroadcasts = () => {
    return (
        <div className="space-y-6 p-8 text-center">
            <h1 className="text-3xl font-black text-slate-800">Broadcast Center</h1>
            <p className="text-slate-500">Send global announcements and emergency alerts here.</p>
            <div className="max-w-xl mx-auto text-left mt-10 bg-white rounded-3xl border border-slate-200 p-8">
                <h3 className="font-bold text-lg mb-4">New Broadcast</h3>
                <input type="text" placeholder="Title" className="w-full p-3 rounded-xl border border-slate-200 mb-4" />
                <textarea placeholder="Message..." className="w-full p-3 rounded-xl border border-slate-200 h-32 mb-4"></textarea>
                <button className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl">Send Global Alert</button>
            </div>
        </div>
    );
};

export default AdminBroadcasts;
