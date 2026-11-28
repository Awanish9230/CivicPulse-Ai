import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { Settings, Clock, Zap, Save, Play, KeyRound } from 'lucide-react';
import EnvManagerPanel from '../../../components/admin/EnvManagerPanel';

interface EscalationRules {
    juniorToSeniorDays: number;
    seniorToHodDays: number;
    autoAssignEnabled: boolean;
}

interface AdminSettingsProps {
    initialTab?: 'escalation' | 'env';
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ initialTab = 'escalation' }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const urlTab = searchParams.get('tab') === 'env' ? 'env' : searchParams.get('tab') === 'escalation' ? 'escalation' : null;
    const [activeTab, setActiveTab] = useState<'escalation' | 'env'>(urlTab || initialTab);

    useEffect(() => {
        if (urlTab) {
            setActiveTab(urlTab);
        } else {
            setActiveTab(initialTab);
        }
    }, [initialTab, urlTab]);

    const handleSwitchTab = (tab: 'escalation' | 'env') => {
        setActiveTab(tab);
        setSearchParams(tab === 'env' ? { tab: 'env' } : {});
    };

    const [rules, setRules] = useState<EscalationRules>({
        juniorToSeniorDays: 5,
        seniorToHodDays: 14,
        autoAssignEnabled: true
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [sweeping, setSweeping] = useState<boolean>(false);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const { data } = await axios.get<{ data: EscalationRules }>(
                    `${import.meta.env.VITE_API_URL}/api/v1/admin/settings/escalation`,
                    { withCredentials: true }
                );
                setRules(data.data);
            } catch {
                toast.error('Failed to load escalation settings');
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rules.seniorToHodDays <= rules.juniorToSeniorDays) {
            toast.error('Senior -> HOD days must be greater than Junior -> Senior days');
            return;
        }
        setSaving(true);
        try {
            const { data } = await axios.put<{ data: EscalationRules }>(
                `${import.meta.env.VITE_API_URL}/api/v1/admin/settings/escalation`,
                rules,
                { withCredentials: true }
            );
            setRules(data.data);
            toast.success('Escalation & auto-assignment rules saved');
        } catch (err: unknown) {
            const msg = axios.isAxiosError<{ message?: string }>(err)
                ? err.response?.data?.message || 'Failed to save rules'
                : 'Failed to save rules';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleRunSweep = async () => {
        setSweeping(true);
        try {
            const { data } = await axios.post<{
                data: { escalatedToSenior: number; escalatedToHod: number };
            }>(
                `${import.meta.env.VITE_API_URL}/api/v1/admin/settings/escalation/run-now`,
                {},
                { withCredentials: true }
            );
            toast.success(
                `Sweep complete: ${data.data.escalatedToSenior} moved to Senior, ${data.data.escalatedToHod} moved to HOD`
            );
        } catch {
            toast.error('Failed to run escalation sweep');
        } finally {
            setSweeping(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-3">
                        <Settings className="text-orange-600" size={28} />
                        {activeTab === 'env' ? 'Environment Configuration (.env)' : 'Escalation & Auto-Dispatch Settings'}
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        {activeTab === 'env'
                            ? 'Inspect, add, edit, or delete backend environment variables directly from the Admin Portal.'
                            : 'Configure SLA escalation thresholds and automated least-loaded Junior task routing.'}
                    </p>
                </div>

                {activeTab === 'escalation' && (
                    <button
                        type="button"
                        onClick={handleRunSweep}
                        disabled={sweeping}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <Play size={16} className="text-orange-600" />
                        {sweeping ? 'Running Sweep...' : 'Run Escalation Sweep Now'}
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
                <button
                    type="button"
                    onClick={() => handleSwitchTab('escalation')}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                        activeTab === 'escalation'
                            ? 'bg-orange-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <Clock size={15} />
                    Escalation & Dispatch
                </button>
                <button
                    type="button"
                    onClick={() => handleSwitchTab('env')}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                        activeTab === 'env'
                            ? 'bg-orange-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <KeyRound size={15} />
                    Environment (.env)
                </button>
            </div>

            {activeTab === 'env' ? (
                <EnvManagerPanel />
            ) : loading ? (
                <div className="h-64 rounded-3xl bg-white border border-slate-200 skeleton-box" />
            ) : (
                <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                            <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                                <Clock size={18} className="text-amber-600" />
                                Tier 1: Junior → Senior Escalation (Days)
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Escalates unresolved complaints with no official activity after this many days (default: 5 days).
                            </p>
                            <input
                                type="number"
                                min={1}
                                max={60}
                                value={rules.juniorToSeniorDays}
                                onChange={(e) => setRules({ ...rules, juniorToSeniorDays: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-black text-lg text-slate-900 focus:outline-none focus:border-orange-500"
                            />
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                            <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                                <Clock size={18} className="text-rose-600" />
                                Tier 2: Escalation → HOD (Days)
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Escalates complaints directly to Head of Department (HOD) if unresolved past this age (default: 14 days).
                            </p>
                            <input
                                type="number"
                                min={2}
                                max={120}
                                value={rules.seniorToHodDays}
                                onChange={(e) => setRules({ ...rules, seniorToHodDays: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-black text-lg text-slate-900 focus:outline-none focus:border-orange-500"
                            />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                                <Zap size={17} className="text-indigo-600" />
                                Auto-Assign New Complaints to Least-Loaded Junior Official
                            </div>
                            <p className="text-xs text-slate-600">
                                Automatically checks active On-Duty Junior officials in the matching department and dispatches to the one with 0 or fewest active tasks.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setRules({ ...rules, autoAssignEnabled: !rules.autoAssignEnabled })}
                            className={`w-14 h-7 rounded-full transition-colors p-1 shrink-0 cursor-pointer ${
                                rules.autoAssignEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                            }`}
                            aria-label="Toggle auto assign"
                        >
                            <div
                                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                                    rules.autoAssignEnabled ? 'translate-x-7' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
                        <span className="text-xs font-semibold text-slate-500">
                            Active Pipeline: Day 0 Auto-Dispatch → Day {rules.juniorToSeniorDays} Senior Escalation → Day {rules.seniorToHodDays} HOD Escalation
                        </span>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <Save size={16} />
                            {saving ? 'Saving...' : 'Save Escalation Rules'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default AdminSettings;
