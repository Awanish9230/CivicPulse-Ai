import React, { useContext } from 'react';
import { ArrowRight, Download, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';

const CallToAction: React.FC = () => {
    const auth = useContext(AuthContext);
    const user = auth?.user;
    const { isInstallable, isStandalone, handleInstallClick } = usePWAInstall();

    return (
        <section className="rounded-3xl bg-gradient-to-br from-indigo-50/90 via-white to-sky-50/80 border border-indigo-100 hover:border-indigo-200 p-6 sm:p-10 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-md transition-all duration-200">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-indigo-100 text-indigo-700 text-xs font-bold">
                        <ShieldCheck size={14} /> 100% Anonymous & Free for Citizens
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Ready to report an issue or join your neighborhood?
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        Submit verified civic complaints in seconds, support local petitions, and follow resolution progress directly with municipal teams.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <Link
                        to={user ? '/complaints' : '/auth?mode=register'}
                        className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] text-white text-sm font-bold shadow-sm transition-all"
                    >
                        {user ? 'File a Complaint' : 'Get Started Free'}
                        <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    <Link
                        to="/community"
                        className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white hover:bg-slate-50 hover:border-indigo-200 hover:-translate-y-0.5 text-slate-800 border border-slate-200 text-sm font-bold transition-all"
                    >
                        Explore Community
                    </Link>

                    {isInstallable && !isStandalone && (
                        <button
                            type="button"
                            onClick={handleInstallClick}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-white hover:bg-slate-50 hover:border-indigo-300 hover:-translate-y-0.5 text-indigo-700 border border-indigo-200 text-sm font-bold transition-all cursor-pointer"
                        >
                            <Download size={16} /> Install App
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
};

export default CallToAction;
