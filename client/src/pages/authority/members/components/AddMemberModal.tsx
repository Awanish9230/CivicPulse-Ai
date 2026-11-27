import React from 'react';
import { motion } from 'framer-motion';
import CustomSelect from '../../../../components/common/CustomSelect';
import type { AuthorityLevel } from '../../../../types';

export interface MemberFormData {
    name: string;
    email: string;
    password: string;
    authorityLevel: AuthorityLevel;
    department: string;
}

interface AddMemberModalProps {
    isOpen: boolean;
    formData: MemberFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: string } }) => void;
    onClose: () => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({
    isOpen,
    formData,
    onChange,
    onClose,
    onSubmit
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
                <h2 className="text-2xl font-black mb-6 text-slate-900">Add New Authority</h2>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={onChange}
                            required
                            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Official Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={onChange}
                            required
                            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                            placeholder="officer@domain.gov"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={onChange}
                            required
                            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                            placeholder="Secure password"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Level</label>
                            <CustomSelect
                                value={formData.authorityLevel}
                                onChange={(e) => onChange({ target: { name: 'authorityLevel', value: e.target.value } })}
                                options={[
                                    { value: 'Junior', label: 'Junior' },
                                    { value: 'Senior', label: 'Senior' },
                                    { value: 'HOD', label: 'Head of Dept (HOD)' }
                                ]}
                                className="w-full focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Department</label>
                            <CustomSelect
                                value={formData.department}
                                onChange={(e) => onChange({ target: { name: 'department', value: e.target.value } })}
                                options={[
                                    { value: 'Public Works', label: 'Public Works' },
                                    { value: 'Water & Sanitation', label: 'Water & Sanitation' },
                                    { value: 'Power', label: 'Power' },
                                    { value: 'Traffic & Safety', label: 'Traffic & Safety' },
                                    { value: 'Animal Control', label: 'Animal Control' },
                                    { value: 'General Administration', label: 'General Administration' }
                                ]}
                                className="w-full focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md"
                        >
                            Create Member
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default AddMemberModal;
