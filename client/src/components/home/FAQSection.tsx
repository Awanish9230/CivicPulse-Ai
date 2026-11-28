import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQItem {
    q: string;
    a: string;
}

const faqs: FAQItem[] = [
    {
        q: 'How is citizen anonymity protected when filing a report?',
        a: 'Every complaint is stored under an encrypted rotating anonymous identifier (CP-*) rather than exposing your email or account details to authorities or the public.'
    },
    {
        q: 'How does Gemini AI handle incoming reports and duplicates?',
        a: 'AI analyzes uploaded descriptions and imagery to classify the civic category, flag spam, estimate urgency, and merge nearby duplicate reports onto a single active issue with amplified support.'
    },
    {
        q: 'How do department routing and escalations work?',
        a: 'Each category maps to its responsible municipal department. If an open complaint stalls beyond SLA thresholds, automated escalation moves it from Junior to Senior and HOD oversight.'
    },
    {
        q: 'Is all data on the home page live?',
        a: 'Yes. Every KPI counter, map pin, category breakdown, recent report card, petition counter, and activity stream entry comes directly from the database and real-time Socket.IO events.'
    }
];

const FAQSection: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
                <div className="lg:col-span-4 space-y-2">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600">
                        <HelpCircle size={14} /> Common Questions
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Key details on anonymity, AI triage, real-time tracking, and municipal escalations.
                    </p>
                </div>

                <div className="lg:col-span-8 space-y-2.5">
                    {faqs.map((faq, idx) => {
                        const isOpen = openIndex === idx;
                        return (
                            <div
                                key={faq.q}
                                className="rounded-2xl border border-slate-200/80 hover:border-indigo-200 bg-slate-50/50 overflow-hidden transition-colors"
                            >
                                <button
                                    type="button"
                                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer hover:bg-white transition-colors"
                                >
                                    <span className="text-sm font-bold text-slate-900">{faq.q}</span>
                                    <ChevronDown
                                        size={18}
                                        className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                                            isOpen ? 'rotate-180 text-indigo-600' : ''
                                        }`}
                                    />
                                </button>
                                {isOpen && (
                                    <div className="px-5 pb-4 pt-3 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200/60 bg-white">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
