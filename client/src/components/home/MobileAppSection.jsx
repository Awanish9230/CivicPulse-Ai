import React from 'react';
import { Smartphone, QrCode, Apple, Play } from 'lucide-react';

const MobileAppSection = () => {
    return (
        <section className="py-20">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[40px] p-8 md:p-16 overflow-hidden relative">
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
                
                <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                    <div className="w-full md:w-1/2 space-y-6 text-white">
                        <h2 className="text-3xl md:text-4xl font-black">Take CivicPulse AI<br />Everywhere You Go</h2>
                        <p className="text-lg text-slate-400 leading-relaxed">
                            Report issues on the go with our mobile-optimized progressive web app. Snap a photo, tag the location, and submit—all in under 30 seconds.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button className="flex items-center gap-3 px-6 py-4 bg-white text-slate-900 font-bold rounded-2xl hover:-translate-y-1 transition-transform shadow-lg">
                                <Apple size={24} />
                                <div className="text-left">
                                    <div className="text-[10px] uppercase tracking-wide text-slate-500">Download on</div>
                                    <div className="font-black">App Store</div>
                                </div>
                            </button>
                            <button className="flex items-center gap-3 px-6 py-4 bg-white text-slate-900 font-bold rounded-2xl hover:-translate-y-1 transition-transform shadow-lg">
                                <Play size={24} />
                                <div className="text-left">
                                    <div className="text-[10px] uppercase tracking-wide text-slate-500">Get it on</div>
                                    <div className="font-black">Google Play</div>
                                </div>
                            </button>
                        </div>

                        <p className="text-xs text-slate-500 pt-2">* Mobile apps coming soon. Currently available as a Progressive Web App.</p>
                    </div>

                    <div className="w-full md:w-1/2 flex justify-center">
                        <div className="relative">
                            {/* Phone Mockup */}
                            <div className="w-[280px] h-[560px] bg-slate-700 rounded-[48px] border-4 border-slate-600 p-4 shadow-2xl">
                                <div className="w-full h-full bg-white rounded-[36px] overflow-hidden flex flex-col items-center justify-center">
                                    <Smartphone size={48} className="text-indigo-500 mb-4" />
                                    <h3 className="text-lg font-black text-slate-800">CivicPulse AI</h3>
                                    <p className="text-xs text-slate-500 mt-1">Your City, Your Voice</p>
                                    <div className="mt-6 px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl">
                                        Open PWA
                                    </div>
                                </div>
                            </div>

                            {/* QR Code */}
                            <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-200">
                                <QrCode size={80} className="text-slate-800" />
                                <p className="text-[10px] text-center text-slate-500 mt-1 font-bold">Scan to Open</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MobileAppSection;
