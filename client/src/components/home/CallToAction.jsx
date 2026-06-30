import React from 'react';
import { ArrowRight, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const CallToAction = () => {
    return (
        <section className="py-20">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[40px] p-8 md:p-16 text-white text-center relative overflow-hidden">
                <div className="absolute top-[-50%] left-[-20%] w-[60%] h-[200%] bg-white/5 rotate-12 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-400/20 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white font-bold text-sm backdrop-blur-sm">
                        <Shield size={16} /> 100% Anonymous & Free
                    </div>

                    <h2 className="text-3xl md:text-5xl font-black leading-tight">
                        Ready to Make Your<br />City Better?
                    </h2>

                    <p className="text-lg text-blue-100 leading-relaxed max-w-xl mx-auto">
                        Join thousands of citizens who are already making a difference. Report an issue today and watch your city transform.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/auth?mode=register" className="px-8 py-4 bg-white text-indigo-700 font-bold rounded-2xl flex items-center gap-2 hover:-translate-y-1 transition-transform shadow-lg">
                            Get Started Free <ArrowRight size={20} />
                        </Link>
                        <Link to="/community" className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-bold rounded-2xl flex items-center gap-2 hover:bg-white/30 transition-colors border border-white/20">
                            Explore Community
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CallToAction;
