import React from 'react';
import { Smartphone, QrCode, Apple, Play, Download } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

const MobileAppSection = () => {
    const { isInstallable, handleInstallClick } = usePWAInstall();

    return (
        <section className="py-24">
            <div className="bg-slate-50/50 rounded-[40px] p-8 md:p-16 border border-slate-100 overflow-hidden relative">
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-50 blur-[120px] rounded-full pointer-events-none" />
                
                <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24 relative z-10">
                    <div className="w-full md:w-1/2 space-y-8 text-slate-900">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">Take CivicPulse AI<br />Everywhere You Go</h2>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed">
                            Report issues on the go with our mobile-optimized progressive web app. Snap a photo, tag the location, and submit—all in under 30 seconds.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <button 
                                onClick={handleInstallClick}
                                className="flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-200"
                            >
                                <Download size={24} />
                                Install Web App
                            </button>
                            <button 
                                onClick={() => alert("iOS Users: Tap the Share icon at the bottom of Safari, then tap 'Add to Home Screen'.")}
                                className="flex items-center gap-3 w-full sm:w-auto px-6 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl hover:bg-slate-50 transition-all"
                            >
                                <Apple size={24} className="text-slate-700" />
                                <div className="text-left">
                                    <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">iOS Instructions</div>
                                    <div className="font-bold text-sm">Add to Home</div>
                                </div>
                            </button>
                        </div>

                        <p className="text-xs text-slate-400 pt-4 font-medium">
                            * Tap Install to add CivicPulse to your device. On iOS Safari, tap 'Share' then 'Add to Home Screen'.
                        </p>
                    </div>

                    <div className="hidden md:flex w-full md:w-1/2 justify-center relative">
                        <div className="relative">
                            {/* Phone Mockup */}
                            <div className="w-[280px] h-[560px] bg-white rounded-[48px] border-[8px] border-slate-100 p-2 shadow-xl">
                                <div className="w-full h-full bg-slate-50/50 rounded-[36px] border border-slate-100 overflow-hidden flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6">
                                        <Smartphone size={32} className="text-indigo-600" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">CivicPulse AI</h3>
                                    <p className="text-sm text-slate-500 mt-2 font-medium">Your City, Your Voice</p>
                                    <div className="mt-8 px-6 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl shadow-sm">
                                        Open PWA
                                    </div>
                                </div>
                            </div>

                            {/* QR Code */}
                            <div className="absolute -bottom-6 -right-6 bg-white p-5 rounded-2xl shadow-lg border border-slate-100 flex flex-col items-center">
                                <QrCode size={72} className="text-slate-800" strokeWidth={1.5} />
                                <p className="text-[10px] text-slate-500 mt-2 font-bold tracking-wide uppercase">Scan to Open</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MobileAppSection;
