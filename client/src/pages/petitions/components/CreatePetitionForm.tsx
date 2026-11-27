import React, { type ChangeEvent, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Check } from 'lucide-react';
import CustomSelect from '../../../components/common/CustomSelect';

const CATEGORY_OPTIONS = [
    { value: 'Infrastructure', label: 'Infrastructure' },
    { value: 'Environment', label: 'Environment' },
    { value: 'Public Safety', label: 'Public Safety' },
    { value: 'Transportation', label: 'Transportation' },
    { value: 'Health & Sanitation', label: 'Health & Sanitation' },
];

interface CreatePetitionFormProps {
    title: string;
    setTitle: (val: string) => void;
    description: string;
    setDescription: (val: string) => void;
    category: string;
    setCategory: (val: string) => void;
    preview: string | null;
    submitting: boolean;
    onImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

const CreatePetitionForm: React.FC<CreatePetitionFormProps> = ({
    title,
    setTitle,
    description,
    setDescription,
    category,
    setCategory,
    preview,
    submitting,
    onImageChange,
    onSubmit
}) => {
    return (
        <motion.form
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={onSubmit}
            className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6"
        >
            <h2 className="text-2xl font-black text-slate-800">Launch a Campaign</h2>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Campaign Title</label>
                <input
                    type="text"
                    required
                    placeholder="e.g., Build a new community park in Sector 4"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                    <CustomSelect
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        options={CATEGORY_OPTIONS}
                        className="w-full h-[52px]"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Supporting Image (Optional)</label>
                    <div className="relative w-full h-[52px] bg-slate-50 border border-slate-200 border-dashed rounded-xl flex items-center justify-center overflow-hidden hover:bg-slate-100 transition-colors cursor-pointer">
                        {preview ? (
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <Check className="text-green-500" size={16} /> Image Selected
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                <UploadCloud size={18} /> Upload Image
                            </div>
                        )}
                        <input type="file" accept="image/*" onChange={onImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Detailed Description</label>
                <textarea
                    required
                    rows={4}
                    placeholder="Explain why this petition is important to the community..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                />
            </div>

            <div className="flex justify-end pt-2">
                <button
                    type="submit"
                    disabled={submitting}
                    className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {submitting ? "Launching..." : "Launch Campaign"}
                </button>
            </div>
        </motion.form>
    );
};

export default CreatePetitionForm;
