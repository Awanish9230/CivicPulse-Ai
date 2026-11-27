import React, { type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import CustomSelect from '../../../components/common/CustomSelect';
import type { Complaint } from '../../../types';

interface EditComplaintModalProps {
    complaint: Complaint | null;
    onChange: (updated: Complaint) => void;
    onClose: () => void;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

const EditComplaintModal: React.FC<EditComplaintModalProps> = ({
    complaint,
    onChange,
    onClose,
    onSubmit
}) => {
    return (
        <AnimatePresence>
            {complaint && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-text/40 hover:bg-slate-100 p-2 rounded-xl transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-black text-slate-800 mb-6">Edit Complaint</h2>

                        <form onSubmit={onSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-text/50 uppercase tracking-wider mb-2">Category</label>
                                <CustomSelect
                                    value={complaint.category}
                                    onChange={(e) => onChange({ ...complaint, category: e.target.value })}
                                    options={[
                                        { value: 'Pothole', label: 'Pothole' },
                                        { value: 'Garbage', label: 'Garbage / Waste' },
                                        { value: 'Water Leak', label: 'Water Leak' },
                                        { value: 'Streetlight', label: 'Streetlight' },
                                        { value: 'Noise', label: 'Noise' },
                                        { value: 'Other', label: 'Other' }
                                    ]}
                                    className="w-full bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text/50 uppercase tracking-wider mb-2">Description</label>
                                <textarea
                                    value={complaint.description}
                                    onChange={(e) => onChange({ ...complaint, description: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium h-32 resize-none"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-text/80 rounded-xl font-bold text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm shadow-primary/20"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default EditComplaintModal;
