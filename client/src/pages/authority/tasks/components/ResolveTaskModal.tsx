import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Camera, X } from 'lucide-react';

interface ResolveTaskModalProps {
    isOpen: boolean;
    resolutionImages: (string | File)[];
    setResolutionImages: React.Dispatch<React.SetStateAction<(string | File)[]>>;
    testModeBypass: boolean;
    setTestModeBypass: (val: boolean) => void;
    resolving: boolean;
    onOpenCamera: () => void;
    onClose: () => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const ResolveTaskModal: React.FC<ResolveTaskModalProps> = ({
    isOpen,
    resolutionImages,
    setResolutionImages,
    testModeBypass,
    setTestModeBypass,
    resolving,
    onOpenCamera,
    onClose,
    onSubmit
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="text-lg font-black text-slate-800">Resolve Task</h3>
                                <p className="text-xs font-medium text-slate-500 mt-1">Upload proof of resolution</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={onSubmit} className="p-4 md:p-6 flex flex-col gap-4">
                            <div className="bg-orange-50 border border-orange-200 text-orange-800 text-sm font-medium p-4 rounded-xl flex items-start gap-3">
                                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                <p>You must upload <strong>at least 2 images</strong> showing the resolved issue. The citizen will be asked to verify this resolution.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Resolution Images (Min 2)</label>

                                <div className="flex gap-4">
                                    {resolutionImages.length < 5 && (
                                        <button
                                            type="button"
                                            onClick={onOpenCamera}
                                            className="w-24 h-24 shrink-0 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 text-emerald-600 flex flex-col items-center justify-center gap-2 hover:bg-emerald-100 hover:border-emerald-400 transition-colors"
                                        >
                                            <Camera size={24} />
                                            <span className="text-xs font-bold">Live Capture</span>
                                        </button>
                                    )}
                                    <div className="flex-1 flex gap-2 overflow-x-auto pb-2">
                                        {resolutionImages.map((img, i) => (
                                            <div key={i} className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden relative border border-slate-200">
                                                <img
                                                    src={typeof img === 'string' ? img : URL.createObjectURL(img)}
                                                    alt="Resolution"
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setResolutionImages(resolutionImages.filter((_, idx) => idx !== i))}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-md p-1 opacity-80 hover:opacity-100"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    For authenticity, resolutions must be captured live at the physical location.
                                </p>
                            </div>

                            <div className="flex items-center gap-2 mt-2 bg-slate-100 p-3 rounded-xl border border-slate-200">
                                <input
                                    type="checkbox"
                                    id="testModeBypass"
                                    checked={testModeBypass}
                                    onChange={(e) => setTestModeBypass(e.target.checked)}
                                    className="w-4 h-4 text-emerald-600 bg-white border-slate-300 rounded focus:ring-emerald-500"
                                />
                                <label htmlFor="testModeBypass" className="text-sm font-bold text-slate-700">
                                    [DEV ONLY] Bypass GPS Radius & AI Verification
                                </label>
                            </div>

                            {resolutionImages.length > 0 && (
                                <div className="text-sm font-medium text-slate-600">
                                    {resolutionImages.length} image(s) selected
                                </div>
                            )}

                            <div className="mt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={resolving || resolutionImages.length < 2}
                                    className="flex-1 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/20"
                                >
                                    {resolving ? 'Uploading...' : 'Submit Resolution'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ResolveTaskModal;
