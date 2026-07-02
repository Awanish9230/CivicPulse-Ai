import React from 'react';
import { ArrowRight, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const CallToAction = () => {
    return (
        <section className="py-24">
            <div className="bg-slate-900 rounded-[40px] p-8 md:p-16 text-white text-center relative overflow-hidden border border-slate-800 shadow-2xl">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

                <div className="relative z-10 max-w-3xl mx-auto space-y-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-300 font-semibold text-sm backdrop-blur-sm">
                        <Shield size={16} /> 100% Anonymous & Free
                    </div>

                    <h2 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
                        Ready to Make Your<br />City Better?
                    </h2>

                    <p className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed max-w-xl mx-auto">
                        Join thousands of citizens who are already making a difference. Report an issue today and watch your city transform.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link to="/auth?mode=register" className="px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl flex items-center gap-2 hover:bg-slate-100 transition-colors shadow-lg">
                            Get Started Free <ArrowRight size={20} />
                        </Link>
                        <Link to="/community" className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl flex items-center gap-2 hover:bg-white/10 transition-colors backdrop-blur-sm">
                            Explore Community
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CallToAction;
