import React, { useState } from 'react';
import { Mail, Send } from 'lucide-react';

const Newsletter = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (email) {
            setSubmitted(true);
            setEmail('');
            setTimeout(() => setSubmitted(false), 3000);
        }
    };

    return (
        <section className="py-16">
            <div className="bg-slate-50 rounded-[32px] p-8 md:p-12 border border-slate-100 text-center">
                <div className="max-w-xl mx-auto space-y-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500">
                        <Mail size={28} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">Stay Updated</h2>
                    <p className="text-slate-500">Get notified about new features, city reports, and platform updates.</p>

                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="flex-1 px-5 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        />
                        <button type="submit" className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm">
                            <Send size={18} /> Subscribe
                        </button>
                    </form>

                    {submitted && (
                        <p className="text-emerald-600 font-bold text-sm">Thank you for subscribing!</p>
                    )}
                </div>
            </div>
        </section>
    );
};

export default Newsletter;
