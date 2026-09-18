import React from 'react';
import { MessageCircle } from 'lucide-react';

const AdminFeedback = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3">
                        <MessageCircle className="text-orange-600" size={32} />
                        Citizen Feedback
                    </h1>
                    <p className="text-slate-500 mt-1">Review feedback and satisfaction scores.</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm text-center">
                <div className="w-24 h-24 mx-auto bg-orange-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner shadow-orange-100 border border-orange-100">
                    <MessageCircle className="text-orange-500" size={48} strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-3">Module Under Construction</h2>
                <p className="text-slate-500 max-w-md mx-auto text-lg leading-relaxed">
                    The <strong>Citizen Feedback</strong> module is currently being built and will be available in the upcoming release.
                </p>
                <div className="mt-8 flex justify-center">
                    <span className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-sm font-bold tracking-widest uppercase">Coming Soon</span>
                </div>
            </div>
        </div>
    );
};

export default AdminFeedback;
