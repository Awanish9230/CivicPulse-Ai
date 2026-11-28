import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    KeyRound,
    Plus,
    Save,
    Trash2,
    Eye,
    EyeOff,
    RefreshCw,
    Search,
    Copy,
    Check,
    AlertCircle,
    FileCode2
} from 'lucide-react';

export interface EnvVariableItem {
    key: string;
    value: string;
    maskedValue: string;
    isSecret: boolean;
    restartRecommended: boolean;
}

interface EnvListResponse {
    envPath: string;
    variables: EnvVariableItem[];
}

const EnvManagerPanel: React.FC = () => {
    const [variables, setVariables] = useState<EnvVariableItem[]>([]);
    const [envPath, setEnvPath] = useState<string>('');
    const [draftValues, setDraftValues] = useState<Record<string, string>>({});
    const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [search, setSearch] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [deletingKey, setDeletingKey] = useState<string | null>(null);

    const [newKey, setNewKey] = useState<string>('');
    const [newValue, setNewValue] = useState<string>('');
    const [adding, setAdding] = useState<boolean>(false);

    const syncFromResponse = (payload: EnvListResponse) => {
        setEnvPath(payload.envPath || '.env');
        setVariables(payload.variables || []);
        const drafts: Record<string, string> = {};
        for (const item of payload.variables || []) {
            drafts[item.key] = item.value;
        }
        setDraftValues(drafts);
    };

    const fetchVariables = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get<{ data: EnvListResponse }>(
                `${import.meta.env.VITE_API_URL}/api/v1/admin/env`,
                { withCredentials: true }
            );
            syncFromResponse(data.data);
        } catch (err: unknown) {
            const msg = axios.isAxiosError<{ message?: string }>(err)
                ? err.response?.data?.message || 'Failed to load .env variables'
                : 'Failed to load .env variables';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVariables();
    }, [fetchVariables]);

    const handleAddVariable = async (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedKey = newKey.trim().toUpperCase();
        if (!/^[A-Z_][A-Z0-9_]*$/.test(normalizedKey)) {
            toast.error('Key must start with A-Z or _ and use only A-Z, 0-9, _');
            return;
        }
        setAdding(true);
        try {
            const { data } = await axios.put<{ data: EnvListResponse }>(
                `${import.meta.env.VITE_API_URL}/api/v1/admin/env`,
                { key: normalizedKey, value: newValue },
                { withCredentials: true }
            );
            syncFromResponse(data.data);
            setNewKey('');
            setNewValue('');
            toast.success(`Saved ${normalizedKey} to .env and live runtime`);
        } catch (err: unknown) {
            const msg = axios.isAxiosError<{ message?: string }>(err)
                ? err.response?.data?.message || 'Failed to add environment variable'
                : 'Failed to add environment variable';
            toast.error(msg);
        } finally {
            setAdding(false);
        }
    };

    const handleUpdateVariable = async (key: string) => {
        setSavingKey(key);
        try {
            const { data } = await axios.put<{
                data: EnvListResponse & { updated?: EnvVariableItem };
            }>(
                `${import.meta.env.VITE_API_URL}/api/v1/admin/env`,
                { key, value: draftValues[key] ?? '' },
                { withCredentials: true }
            );
            syncFromResponse(data.data);
            const restartHint = data.data.updated?.restartRecommended
                ? ' (Restart server to apply boot-time setting)'
                : '';
            toast.success(`Updated ${key}${restartHint}`);
        } catch (err: unknown) {
            const msg = axios.isAxiosError<{ message?: string }>(err)
                ? err.response?.data?.message || `Failed to update ${key}`
                : `Failed to update ${key}`;
            toast.error(msg);
        } finally {
            setSavingKey(null);
        }
    };

    const handleDeleteVariable = async (key: string) => {
        if (!window.confirm(`Delete environment variable "${key}" from .env and runtime?`)) {
            return;
        }
        setDeletingKey(key);
        try {
            const { data } = await axios.delete<{ data: EnvListResponse }>(
                `${import.meta.env.VITE_API_URL}/api/v1/admin/env/${encodeURIComponent(key)}`,
                { withCredentials: true }
            );
            syncFromResponse(data.data);
            toast.success(`Deleted ${key}`);
        } catch (err: unknown) {
            const msg = axios.isAxiosError<{ message?: string }>(err)
                ? err.response?.data?.message || `Failed to delete ${key}`
                : `Failed to delete ${key}`;
            toast.error(msg);
        } finally {
            setDeletingKey(null);
        }
    };

    const handleCopyValue = async (key: string, value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 1500);
        } catch {
            toast.error('Unable to copy to clipboard');
        }
    };

    const filteredVariables = variables.filter((v) =>
        v.key.toLowerCase().includes(search.trim().toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <FileCode2 size={20} className="text-orange-600" />
                            Add New Environment Variable
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Persists directly to <span className="font-mono text-slate-700">{envPath || 'server/.env'}</span> and updates <span className="font-mono text-slate-700">process.env</span> live.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={fetchVariables}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Reload .env
                    </button>
                </div>

                <form onSubmit={handleAddVariable} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-4 space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Variable Key</label>
                        <input
                            type="text"
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value.toUpperCase())}
                            placeholder="e.g. MAX_UPLOAD_MB"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 font-mono text-xs font-bold text-slate-900 focus:outline-none"
                            required
                        />
                    </div>
                    <div className="md:col-span-6 space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Value</label>
                        <input
                            type="text"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            placeholder="Enter variable value..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 font-mono text-xs text-slate-900 focus:outline-none"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            disabled={adding}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <Plus size={15} />
                            {adding ? 'Adding...' : 'Add Variable'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <KeyRound size={18} className="text-indigo-600" />
                        <h3 className="text-base font-black text-slate-900">
                            Configured .env Variables ({variables.length})
                        </h3>
                    </div>
                    <div className="relative w-full sm:w-72">
                        <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search variable key..."
                            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:border-orange-500 focus:outline-none"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-16 rounded-2xl skeleton-box" />
                        ))}
                    </div>
                ) : filteredVariables.length === 0 ? (
                    <div className="text-center py-10 text-sm text-slate-500">
                        No environment variables match your filter.
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {filteredVariables.map((item) => {
                            const isRevealed = Boolean(revealedKeys[item.key]);
                            const draft = draftValues[item.key] ?? '';
                            const isDirty = draft !== item.value;

                            return (
                                <div
                                    key={item.key}
                                    className="p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white transition-colors flex flex-col lg:flex-row lg:items-center gap-3"
                                >
                                    <div className="lg:w-72 shrink-0 space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono text-xs font-black text-slate-900 break-all">
                                                {item.key}
                                            </span>
                                            {item.isSecret && (
                                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                                                    SECRET
                                                </span>
                                            )}
                                            {item.restartRecommended && (
                                                <span
                                                    title="Changes to boot-time variables take full effect after restarting the backend server."
                                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold"
                                                >
                                                    <AlertCircle size={10} />
                                                    Boot Var
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 flex items-center gap-2">
                                        <input
                                            type={item.isSecret && !isRevealed ? 'password' : 'text'}
                                            value={draft}
                                            onChange={(e) =>
                                                setDraftValues((prev) => ({
                                                    ...prev,
                                                    [item.key]: e.target.value
                                                }))
                                            }
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs text-slate-800 focus:outline-none focus:border-orange-500"
                                        />
                                        {item.isSecret && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setRevealedKeys((prev) => ({
                                                        ...prev,
                                                        [item.key]: !prev[item.key]
                                                    }))
                                                }
                                                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 cursor-pointer shrink-0"
                                                title={isRevealed ? 'Hide value' : 'Reveal value'}
                                            >
                                                {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleCopyValue(item.key, draft)}
                                            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 cursor-pointer shrink-0"
                                            title="Copy value"
                                        >
                                            {copiedKey === item.key ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 justify-end">
                                        <button
                                            type="button"
                                            onClick={() => handleUpdateVariable(item.key)}
                                            disabled={!isDirty || savingKey === item.key}
                                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 ${
                                                isDirty
                                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                    : 'bg-slate-100 text-slate-600'
                                            }`}
                                        >
                                            <Save size={13} />
                                            {savingKey === item.key ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteVariable(item.key)}
                                            disabled={deletingKey === item.key}
                                            className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer disabled:opacity-50"
                                            title={`Delete ${item.key}`}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EnvManagerPanel;
