import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
    { q: "Is my identity truly anonymous?", a: "Yes. CivicPulse AI uses rotating anonymous IDs. Your personal information is never attached to any complaint. Even our admins cannot trace a complaint back to you." },
    { q: "How does the AI verify complaints?", a: "Our Gemini 2.5 Flash AI analyzes your complaint text and images to classify the category, detect spam or duplicates, and assess priority level—all within seconds." },
    { q: "Can authorities see who filed the complaint?", a: "No. Authorities only see the complaint details, location, and images. The reporter's identity is completely hidden from all users, including Super Admins." },
    { q: "How fast are issues typically resolved?", a: "Resolution times vary by category and severity. On average, high-priority issues are resolved within 48-72 hours. Our escalation system ensures nothing is forgotten." },
    { q: "Is CivicPulse AI free to use?", a: "Yes, CivicPulse AI is completely free for all citizens. There are no hidden charges, premium tiers, or paywalls." },
    { q: "Can I track my complaint?", a: "Absolutely. You receive real-time notifications via Socket.IO whenever your complaint status changes. You can also check your dashboard anytime." },
    { q: "What happens if an authority ignores my complaint?", a: "Our automated escalation system kicks in. If a complaint remains unresolved past its SLA deadline, it's automatically escalated to a higher authority level." },
];

const FAQSection = () => {
    const [open, setOpen] = useState(null);
    const toggle = (idx) => setOpen(open === idx ? null : idx);

    return (
        <section className="py-20">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-black text-slate-800">Frequently Asked Questions</h2>
                <p className="text-slate-500 mt-3 text-lg">Everything you need to know about CivicPulse AI.</p>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
                {faqs.map((faq, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <button onClick={() => toggle(idx)} className="w-full flex items-center justify-between p-6 text-left">
                            <span className="font-bold text-slate-800 pr-4">{faq.q}</span>
                            <ChevronDown size={20} className={`text-slate-400 transition-transform flex-shrink-0 ${open === idx ? 'rotate-180' : ''}`} />
                        </button>
                        {open === idx && (
                            <div className="px-6 pb-6 text-slate-500 leading-relaxed border-t border-slate-100 pt-4">
                                {faq.a}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
};

export default FAQSection;
