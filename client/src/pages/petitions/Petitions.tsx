import React, { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import axios from 'axios';
import { FileText, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import PageLoader from '../../components/common/PageLoader';
import EmptyState from '../../components/common/EmptyState';
import CreatePetitionForm from './components/CreatePetitionForm';
import PetitionCard from './components/PetitionCard';
import type { Petition } from '../../types';

const Petitions: React.FC = () => {
    const [petitions, setPetitions] = useState<Petition[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [showForm, setShowForm] = useState<boolean>(false);

    const [title, setTitle] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [category, setCategory] = useState<string>('Infrastructure');
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);

    useEffect(() => {
        fetchPetitions();
    }, []);

    const fetchPetitions = async () => {
        try {
            const { data } = await axios.get<{ data: Petition[] }>(
                `${import.meta.env.VITE_API_URL}/api/v1/petition`,
                { withCredentials: true }
            );
            setPetitions(data.data);
        } catch {
            toast.error("Failed to load petitions");
        } finally {
            setLoading(false);
        }
    };

    const handleUpvote = async (id: string) => {
        try {
            const { data } = await axios.post<{
                message: string;
                data: { upvoteCount: number; hasUpvoted: boolean; status: Petition['status'] };
            }>(`${import.meta.env.VITE_API_URL}/api/v1/petition/${id}/upvote`, {}, { withCredentials: true });
            toast.success(data.message);
            setPetitions((prev) =>
                prev
                    .map((p) =>
                        p._id === id
                            ? {
                                  ...p,
                                  upvoteCount: data.data.upvoteCount,
                                  hasUpvoted: data.data.hasUpvoted,
                                  status: data.data.status
                              }
                            : p
                    )
                    .sort((a, b) => b.upvoteCount - a.upvoteCount)
            );
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || "Failed to upvote");
        }
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image must be less than 5MB");
                return;
            }
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('category', category);
            if (image) formData.append('image', image);

            await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/petition`, formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success("Petition launched successfully!");
            setShowForm(false);

            setTitle('');
            setDescription('');
            setImage(null);
            setPreview(null);

            fetchPetitions();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || "Failed to launch petition");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <PageLoader />;

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <FileText className="text-primary" size={32} />
                        Community Petitions
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Campaign for major civic improvements. Reach 1,000 signatures in 30 days to escalate!
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
                >
                    {showForm ? <X size={20} /> : <Plus size={20} />}
                    {showForm ? "Cancel" : "Start Petition"}
                </button>
            </div>

            {showForm && (
                <CreatePetitionForm
                    title={title}
                    setTitle={setTitle}
                    description={description}
                    setDescription={setDescription}
                    category={category}
                    setCategory={setCategory}
                    preview={preview}
                    submitting={submitting}
                    onImageChange={handleImageChange}
                    onSubmit={handleSubmit}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {petitions.length === 0 && !loading && (
                    <EmptyState
                        icon={FileText}
                        title="No active petitions"
                        description="Be the first to launch a campaign in your community!"
                        iconWrapperClassName="w-16 h-16 bg-slate-50 rounded-2xl text-slate-300"
                        containerClassName="col-span-full py-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 border-dashed"
                    />
                )}

                {petitions.map((petition, idx) => (
                    <PetitionCard
                        key={petition._id}
                        petition={petition}
                        index={idx}
                        onUpvote={handleUpvote}
                    />
                ))}
            </div>
        </div>
    );
};

export default Petitions;
