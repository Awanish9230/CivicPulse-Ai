import React, { useState } from 'react';
import { ShieldAlert, Send } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Banned = ({ feature }) => {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmitAppeal = async (e) => {
        e.preventDefault();
        if (!reason.trim()) return toast.error("Please provide a reason for your appeal.");

        setIsSubmitting(true);
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/v1/appeal/submit`,
                { reason },
                { withCredentials: true }
            );
            toast.success("Appeal submitted successfully.");
            setSubmitted(true);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to submit appeal. You may already have one pending.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldAlert size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Restricted</h2>
                <p className="text-slate-600 mb-6">
                    You have been restricted from accessing the <strong>{feature}</strong> feature due to repeated violations of our community guidelines.
                </p>
                
                {submitted ? (
                    <div className="bg-white p-4 rounded-xl border border-green-100">
                        <p className="text-green-600 font-medium">Your appeal has been received and is pending review by an admin.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmitAppeal} className="text-left">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Submit an Appeal</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none text-sm mb-3"
                            rows="4"
                            placeholder="Explain why you believe this restriction should be lifted..."
                        ></textarea>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl font-medium transition-all disabled:opacity-70"
                        >
                            {isSubmitting ? (
                                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Submit Appeal
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Banned;
