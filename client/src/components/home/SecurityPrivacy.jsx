import React from 'react';
import { Shield, Lock, Eye, EyeOff, Server, KeyRound, UserX, FileCheck } from 'lucide-react';

const securityFeatures = [
    { icon: EyeOff, title: "100% Anonymous", desc: "Your identity is never stored or linked to complaints." },
    { icon: Lock, title: "JWT Authentication", desc: "Industry-standard token-based secure sessions." },
    { icon: KeyRound, title: "Role-Based Access", desc: "Separate permissions for Citizens, Authorities, and Admins." },
    { icon: Server, title: "Encrypted Storage", desc: "All data is encrypted at rest and in transit." },
    { icon: UserX, title: "No Tracking", desc: "We never track your location or browsing history." },
    { icon: FileCheck, title: "GDPR Compliant", desc: "Full compliance with international data protection laws." },
];

const SecurityPrivacy = () => {
    return (
        <section className="py-20">
            <div className="bg-slate-900 rounded-[40px] p-8 md:p-16 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

                <div className="relative z-10">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-sm mb-4 border border-emerald-500/20">
                            <Shield size={16} /> Enterprise-Grade Security
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-white">Security & Privacy First</h2>
                        <p className="text-slate-400 mt-3 text-lg">Your safety and anonymity are our top priority.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {securityFeatures.map((feat, idx) => (
                            <div key={idx} className="bg-slate-800/50 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 hover:border-emerald-500/30 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                                    <feat.icon className="text-emerald-400" size={24} />
                                </div>
                                <h3 className="font-bold text-white mb-2">{feat.title}</h3>
                                <p className="text-sm text-slate-400">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SecurityPrivacy;
