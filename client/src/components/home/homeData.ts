import {
    Truck,
    Zap,
    Trash2,
    Droplets,
    Waves,
    Car,
    Ban,
    Lightbulb,
    HardHat,
    PawPrint,
    HelpCircle,
    LucideIcon
} from 'lucide-react';

export interface PublicPlatformStats {
    totalComplaints: number;
    resolvedIssues: number;
    inProgressIssues: number;
    openIssues: number;
    resolutionRate: number;
    activeAuthorities: number;
    areasCovered: number;
    avgResolutionHours: number | null;
    activePetitions: number;
}

export interface PublicMapReport {
    _id: string;
    category: string;
    description: string;
    status: string;
    priority?: string;
    location: {
        type?: string;
        coordinates: [number, number];
    };
    address?: {
        ward?: string;
        district?: string;
        pinCode?: string;
        fullAddress?: string;
    };
    supportCount?: number;
    reportCount?: number;
    createdAt: string;
}

export interface PublicOfficialReply {
    authorityName: string;
    content: string;
    createdAt?: string;
}

export interface PublicMergedEvidence {
    description: string;
    imageUrls: string[];
    distanceMeters?: number;
    mergedAt?: string;
}

export interface PublicRecentReport {
    _id: string;
    category: string;
    description: string;
    status: string;
    priority?: string;
    location?: {
        type?: string;
        coordinates: [number, number];
    };
    address?: {
        ward?: string;
        district?: string;
        pinCode?: string;
        fullAddress?: string;
    };
    imageUrl?: string;
    imageUrls?: string[];
    supportCount?: number;
    reportCount?: number;
    replyCount?: number;
    officialReplies?: PublicOfficialReply[];
    mergedReports?: PublicMergedEvidence[];
    createdAt: string;
}

export interface DepartmentPerformanceEntry {
    _id: string;
    total: number;
    resolved: number;
    inProgress: number;
    resolutionRate: number;
}

export interface PublicActivityEntry {
    _id: string;
    category: string;
    description: string;
    status: string;
    priority?: string;
    area: string;
    timestamp: string;
    eventType?: 'new' | 'status' | 'deleted';
}

export interface PublicPetitionItem {
    _id: string;
    title: string;
    description: string;
    category: string;
    status: 'Active' | 'Rejected' | 'Escalated';
    targetSignatures: number;
    upvoteCount: number;
    createdAt: string;
}

export interface CategoryMeta {
    name: string;
    icon: LucideIcon;
    accentHex: string;
    badgeClass: string;
    iconBgClass: string;
}

export const COMPLAINT_CATEGORIES: CategoryMeta[] = [
    { name: 'Road', icon: Truck, accentHex: '#E11D48', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200', iconBgClass: 'bg-rose-50 text-rose-600' },
    { name: 'Electricity', icon: Zap, accentHex: '#D97706', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', iconBgClass: 'bg-amber-50 text-amber-600' },
    { name: 'Garbage', icon: Trash2, accentHex: '#16A34A', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', iconBgClass: 'bg-emerald-50 text-emerald-600' },
    { name: 'Water', icon: Droplets, accentHex: '#2563EB', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200', iconBgClass: 'bg-blue-50 text-blue-600' },
    { name: 'Drainage', icon: Waves, accentHex: '#0891B2', badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200', iconBgClass: 'bg-cyan-50 text-cyan-600' },
    { name: 'Traffic', icon: Car, accentHex: '#EA580C', badgeClass: 'bg-orange-50 text-orange-700 border-orange-200', iconBgClass: 'bg-orange-50 text-orange-600' },
    { name: 'Illegal Dumping', icon: Ban, accentHex: '#DC2626', badgeClass: 'bg-red-50 text-red-700 border-red-200', iconBgClass: 'bg-red-50 text-red-600' },
    { name: 'Street Light', icon: Lightbulb, accentHex: '#CA8A04', badgeClass: 'bg-yellow-50 text-yellow-700 border-yellow-200', iconBgClass: 'bg-yellow-50 text-yellow-600' },
    { name: 'Construction', icon: HardHat, accentHex: '#4F46E5', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200', iconBgClass: 'bg-indigo-50 text-indigo-600' },
    { name: 'Animal', icon: PawPrint, accentHex: '#9333EA', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200', iconBgClass: 'bg-purple-50 text-purple-600' },
    { name: 'Others', icon: HelpCircle, accentHex: '#475569', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200', iconBgClass: 'bg-slate-100 text-slate-600' },
];

export const getCategoryMeta = (category?: string): CategoryMeta => {
    return COMPLAINT_CATEGORIES.find((c) => c.name === category) || COMPLAINT_CATEGORIES[COMPLAINT_CATEGORIES.length - 1];
};

export const getStatusBadgeClass = (status?: string): string => {
    switch (status) {
        case 'Resolved':
        case 'Closed':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'In Progress':
            return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'Assigned':
        case 'Verified':
            return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'Rejected':
            return 'bg-rose-50 text-rose-700 border-rose-200';
        default:
            return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
};

export const getStatusDotHex = (status?: string): string => {
    switch (status) {
        case 'Resolved':
        case 'Closed':
            return '#10B981';
        case 'In Progress':
            return '#F59E0B';
        case 'Assigned':
        case 'Verified':
            return '#2563EB';
        case 'Rejected':
            return '#EF4444';
        default:
            return '#4F46E5';
    }
};

export const formatAddressShort = (address?: {
    ward?: string;
    district?: string;
    fullAddress?: string;
}): string => {
    if (!address) return 'Location Verified';
    return address.ward || address.district || address.fullAddress || 'Location Verified';
};
