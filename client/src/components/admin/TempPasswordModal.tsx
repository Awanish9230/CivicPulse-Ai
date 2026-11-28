import React from 'react';
import { Copy, KeyRound, X } from 'lucide-react';
import toast from 'react-hot-toast';

export interface ResetPasswordResult {
    name: string;
    email: string;
    anonymousId: string;
    temporaryPassword: string;
}

interface TempPasswordModalProps {
    data: ResetPasswordResult | null;
    onClose: () => void;
}

const TempPasswordModal: React.FC<TempPasswordModalProps> = ({ data, onClose }) => {
    if (!data) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(data.temporaryPassword);
            toast.success('Temporary password copied');
        } catch {
            toast.error('Unable to copy automatically');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                            <KeyRound size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Password Reset Complete</h3>
                            <p className="text-xs text-slate-500">All prior active sessions have been revoked.</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                    <div>
                        <span className="text-slate-500">Account:</span>{' '}
                        <span className="font-bold text-slate-900">{data.name}</span>
                    </div>
                    <div>
                        <span className="text-slate-500">Email:</span>{' '}
                        <span className="font-semibold text-slate-700">{data.email}</span>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Temporary Password</div>
                        <div className="font-mono text-lg font-black text-indigo-950 select-all mt-0.5">
                            {data.temporaryPassword}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shrink-0"
                    >
                        <Copy size={14} /> Copy
                    </button>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold cursor-pointer"
                >
                    Done
                </button>
            </div>
        </div>
    );
};

export default TempPasswordModal;
