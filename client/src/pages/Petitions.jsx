import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FileText, ThumbsUp, AlertCircle, Plus, UploadCloud, X, Calendar, MapPin, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import PageLoader from '../components/common/PageLoader';
import CustomSelect from '../components/common/CustomSelect';

const Petitions = () => {
    const [petitions, setPetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    
    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Infrastructure');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const categoryOptions = [
        { value: 'Infrastructure', label: 'Infrastructure' },
        { value: 'Environment', label: 'Environment' },
        { value: 'Public Safety', label: 'Public Safety' },
        { value: 'Transportation', label: 'Transportation' },
        { value: 'Health & Sanitation', label: 'Health & Sanitation' },
    ];

    useEffect(() => {
        fetchPetitions();
    }, []);

    const fetchPetitions = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/petition`, { withCredentials: true });
            setPetitions(data.data);
        } catch (error) {
            toast.error("Failed to load petitions");
        } finally {
            setLoading(false);
        }
    };

    const handleUpvote = async (id) => {
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/petition/${id}/upvote`, {}, { withCredentials: true });
            toast.success(data.message);
            // Update local state without full refetch
            setPetitions(prev => prev.map(p => {
                if (p._id === id) {
                    return { 
                        ...p, 
                        upvoteCount: data.data.upvoteCount, 
                        hasUpvoted: data.data.hasUpvoted,
                        status: data.data.status
                    };
                }
                return p;
            }).sort((a, b) => b.upvoteCount - a.upvoteCount)); // Re-sort by top upvotes
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to upvote");
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image must be less than 5MB");
                return;
            }
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
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
            
            // Reset form
            setTitle('');
            setDescription('');
            setImage(null);
            setPreview(null);
            
            fetchPetitions();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to launch petition");
        } finally {
            setSubmitting(false);
        }
    };

    const getDaysRemaining = (createdAt, targetDays) => {
        const ageInMs = Date.now() - new Date(createdAt).getTime();
        const daysElapsed = ageInMs / (1000 * 60 * 60 * 24);
        const remaining = Math.max(0, targetDays - daysElapsed);
        return Math.ceil(remaining);
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

            {/* Create Form */}
            {showForm && (
                <motion.form 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleSubmit}
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
                            onChange={e => setTitle(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                            <CustomSelect 
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                options={categoryOptions}
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
                                <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Detailed Description</label>
                        <textarea 
                            required
                            rows="4"
                            placeholder="Explain why this petition is important to the community..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
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
            )}

            {/* List Petitions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {petitions.length === 0 && !loading && (
                    <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 border-dashed">
                        <FileText size={48} className="mx-auto mb-4 text-slate-300" />
                        <h3 className="text-xl font-bold text-slate-700">No active petitions</h3>
                        <p className="mt-1">Be the first to launch a campaign in your community!</p>
                    </div>
                )}
                
                {petitions.map((petition, idx) => {
                    const progress = Math.min(100, (petition.upvoteCount / petition.targetSignatures) * 100);
                    // Determine survival status
                    let warningText = "";
                    let isWarning = false;
                    
                    if (petition.upvoteCount < 50) {
                        const daysLeft = getDaysRemaining(petition.createdAt, 7);
                        warningText = `Needs ${50 - petition.upvoteCount} more signatures in ${daysLeft} days to survive!`;
                        if (daysLeft <= 2) isWarning = true;
                    } else if (petition.status === 'Active') {
                        const daysLeft = getDaysRemaining(petition.createdAt, 30);
                        warningText = `${daysLeft} days left to reach 1,000 signatures`;
                    } else if (petition.status === 'Escalated') {
                        warningText = "Target reached! Escalated to Admin.";
                    }

                    return (
                        <motion.div 
                            key={petition._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                        >
                            {petition.imageUrl && (
                                <div className="w-full h-48 bg-slate-100 overflow-hidden">
                                    <img src={petition.imageUrl} alt={petition.title} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="p-6 flex flex-col flex-1">
                                <div className="flex justify-between items-start mb-3 gap-4">
                                    <h3 className="text-xl font-black text-slate-800 leading-tight">{petition.title}</h3>
                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-lg shrink-0">
                                        {petition.category}
                                    </span>
                                </div>
                                <p className="text-slate-600 text-sm mb-6 line-clamp-3">{petition.description}</p>
                                
                                <div className="mt-auto">
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span className="text-primary">{petition.upvoteCount} Signatures</span>
                                        <span className="text-slate-400">Target: {petition.targetSignatures}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${petition.status === 'Escalated' ? 'bg-green-500' : 'bg-primary'}`}
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                                        <div className={`flex items-center gap-1.5 text-xs font-bold ${isWarning ? 'text-red-500' : petition.status === 'Escalated' ? 'text-green-600' : 'text-slate-500'}`}>
                                            {isWarning ? <AlertCircle size={14} /> : <Calendar size={14} />}
                                            {warningText}
                                        </div>
                                        
                                        <button 
                                            onClick={() => handleUpvote(petition._id)}
                                            disabled={petition.status === 'Escalated' || petition.status === 'Rejected'}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                                petition.hasUpvoted 
                                                    ? 'bg-primary/10 text-primary border border-primary/20' 
                                                    : 'bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50'
                                            }`}
                                        >
                                            <ThumbsUp size={16} className={petition.hasUpvoted ? "fill-primary" : ""} />
                                            {petition.hasUpvoted ? 'Signed' : 'Sign Petition'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    );
};

export default Petitions;
