import React from 'react';
import {
    Camera,
    BrainCircuit,
    Building2,
    BellRing,
    EyeOff,
    Layers,
    ShieldAlert,
    Lock,
    LucideIcon
} from 'lucide-react';

interface PipelineStep {
    step: string;
    title: string;
    desc: string;
    icon: LucideIcon;
    iconClass: string;
}

interface TrustPillar {
    title: string;
    desc: string;
    icon: LucideIcon;
    iconClass: string;
}

const pipelineSteps: PipelineStep[] = [
    {
        step: '01',
        title: 'Anonymous Report',
        desc: 'Capture photos, voice notes, and precise GPS location under encrypted rotating CP-* identities.',
        icon: Camera,
        iconClass: 'bg-indigo-50 text-indigo-600'
    },
    {
        step: '02',
        title: 'AI Triage & Clustering',
        desc: 'Gemini 2.5 Flash classifies categories, screens spam, predicts urgency, and merges nearby duplicates.',
        icon: BrainCircuit,
        iconClass: 'bg-violet-50 text-violet-600'
    },
    {
        step: '03',
        title: 'Department Dispatch',
        desc: 'Verified issues route automatically to the right municipal department and officer tier.',
        icon: Building2,
        iconClass: 'bg-amber-50 text-amber-600'
    },
    {
        step: '04',
        title: 'Live Verification',
        desc: 'Follow real-time Socket.IO status updates, official replies, and resolution photo proof.',
        icon: BellRing,
        iconClass: 'bg-emerald-50 text-emerald-600'
    }
];

const trustPillars: TrustPillar[] = [
    {
        title: 'Rotating Anonymous IDs',
        desc: 'Complaints store rotating CP-* identifiers rather than raw user profiles or personal contact details.',
        icon: EyeOff,
        iconClass: 'text-indigo-600 bg-indigo-50'
    },
    {
        title: 'Smart Duplicate Clustering',
        desc: 'Nearby reports on the same street fuse automatically into higher support weight instead of flooding teams.',
        icon: Layers,
        iconClass: 'text-blue-600 bg-blue-50'
    },
    {
        title: 'Automated SLA Escalation',
        desc: 'Stalled issues escalate up from Junior to Senior and HOD tiers so critical hazards are never ignored.',
        icon: ShieldAlert,
        iconClass: 'text-amber-600 bg-amber-50'
    },
    {
        title: 'Role-Based Access Control',
        desc: 'Strict JWT and cookie-backed boundaries isolate Citizen, Authority, and Admin operational permissions.',
        icon: Lock,
        iconClass: 'text-emerald-600 bg-emerald-50'
    }
];

const WorkflowAndTrust: React.FC = () => {
    return (
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-6 sm:p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
                        Platform Architecture
                    </p>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        How CivicPulse Processes Every Issue
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                        From anonymous submission to department completion, every stage is audited, deduplicated, and streamed live.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {pipelineSteps.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div
                            key={item.step}
                            className="group rounded-2xl bg-slate-50/75 hover:bg-white border border-slate-200/80 hover:border-indigo-300/80 hover:-translate-y-1 hover:shadow-md p-5 flex flex-col gap-3 transition-all duration-200"
                        >
                            <div className="flex items-center justify-between">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${item.iconClass}`}>
                                    <Icon size={20} />
                                </div>
                                <span className="text-xs font-black text-slate-400 group-hover:text-indigo-500 tabular-nums transition-colors">
                                    STEP {item.step}
                                </span>
                            </div>
                            <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                        </div>
                    );
                })}
            </div>

            <div className="pt-6 border-t border-slate-200/80">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {trustPillars.map((pillar) => {
                        const Icon = pillar.icon;
                        return (
                            <div
                                key={pillar.title}
                                className="group flex items-start gap-3 p-3.5 rounded-2xl border border-transparent hover:border-slate-200/80 hover:bg-slate-50/80 transition-all duration-200"
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-110 ${pillar.iconClass}`}>
                                    <Icon size={16} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900">{pillar.title}</h4>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                        {pillar.desc}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default WorkflowAndTrust;
