import Complaint from '../complaint/complaint.model.js';
import Petition from '../petition/petition.model.js';
import User from '../user/user.model.js';

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

export const getPlatformStats = async (): Promise<PublicPlatformStats> => {
    const [
        totalComplaints,
        resolvedIssues,
        inProgressIssues,
        openIssues,
        activeAuthorities,
        distinctDistricts,
        distinctWards,
        resolutionAvgAgg,
        activePetitions
    ] = await Promise.all([
        Complaint.countDocuments(),
        Complaint.countDocuments({ status: { $in: ['Resolved', 'Closed'] } }),
        Complaint.countDocuments({ status: { $in: ['Assigned', 'In Progress'] } }),
        Complaint.countDocuments({ status: { $in: ['Submitted', 'Verified'] } }),
        User.countDocuments({
            role: { $in: ['Authority', 'Admin'] },
            isBanned: false
        }),
        Complaint.distinct('address.district'),
        Complaint.distinct('address.ward'),
        Complaint.aggregate<{ avgMs: number }>([
            { $match: { status: { $in: ['Resolved', 'Closed'] } } },
            {
                $group: {
                    _id: null,
                    avgMs: { $avg: { $subtract: ['$updatedAt', '$createdAt'] } }
                }
            }
        ]),
        Petition.countDocuments({ status: { $in: ['Active', 'Escalated'] } })
    ]);

    const resolutionRate = totalComplaints > 0
        ? Math.round((resolvedIssues / totalComplaints) * 100)
        : 0;

    const cleanAreas = new Set(
        [...distinctDistricts, ...distinctWards]
            .filter((val): val is string => typeof val === 'string' && val.trim().length > 0)
            .map((val) => val.trim().toLowerCase())
    );

    const avgMs = resolutionAvgAgg[0]?.avgMs;
    const avgResolutionHours = typeof avgMs === 'number' && avgMs >= 0
        ? Math.round((avgMs / (1000 * 60 * 60)) * 10) / 10
        : null;

    return {
        totalComplaints,
        resolvedIssues,
        inProgressIssues,
        openIssues,
        resolutionRate,
        activeAuthorities,
        areasCovered: cleanAreas.size,
        avgResolutionHours,
        activePetitions
    };
};

export const getCategoryStats = async (): Promise<Record<string, number>> => {
    const categoryCounts = await Complaint.aggregate<{ _id: string | null; count: number }>([
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 }
            }
        }
    ]);

    return categoryCounts.reduce<Record<string, number>>((acc, curr) => {
        if (curr._id) {
            acc[curr._id] = curr.count;
        }
        return acc;
    }, {});
};

export const getPublicMapData = async () => {
    return Complaint.find({
        'location.coordinates.0': { $exists: true },
        'location.coordinates.1': { $exists: true }
    })
        .select('category description status priority location address supportCount createdAt')
        .sort({ createdAt: -1 })
        .limit(150)
        .lean();
};

export const getRecentReports = async () => {
    const reports = await Complaint.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .select('category description location address status priority createdAt imageUrl imageUrls supportCount officialReplies')
        .lean();

    return reports.map(({ officialReplies, ...rest }) => {
        const sanitizedReplies = Array.isArray(officialReplies)
            ? officialReplies.map((r) => ({
                authorityName: r.authorityName,
                content: r.content,
                createdAt: r.createdAt
            }))
            : [];
        return {
            ...rest,
            officialReplies: sanitizedReplies,
            replyCount: sanitizedReplies.length
        };
    });
};

export interface DepartmentPerformanceEntry {
    _id: string;
    total: number;
    resolved: number;
    inProgress: number;
    resolutionRate: number;
}

export const getLeaderboard = async (): Promise<DepartmentPerformanceEntry[]> => {
    const aggregated = await Complaint.aggregate<{
        _id: string | null;
        total: number;
        resolved: number;
        inProgress: number;
    }>([
        {
            $group: {
                _id: '$category',
                total: { $sum: 1 },
                resolved: {
                    $sum: {
                        $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0]
                    }
                },
                inProgress: {
                    $sum: {
                        $cond: [{ $in: ['$status', ['Assigned', 'In Progress']] }, 1, 0]
                    }
                }
            }
        },
        { $sort: { resolved: -1, total: -1 } },
        { $limit: 6 }
    ]);

    return aggregated
        .filter((item): item is { _id: string; total: number; resolved: number; inProgress: number } => Boolean(item._id))
        .map((item) => ({
            _id: item._id,
            total: item.total,
            resolved: item.resolved,
            inProgress: item.inProgress,
            resolutionRate: item.total > 0 ? Math.round((item.resolved / item.total) * 100) : 0
        }));
};

export interface PublicActivityItem {
    _id: string;
    category: string;
    description: string;
    status: string;
    priority: string;
    area: string;
    timestamp: Date;
}

export const getLiveActivity = async (): Promise<PublicActivityItem[]> => {
    const latest = await Complaint.find()
        .sort({ updatedAt: -1 })
        .limit(8)
        .select('category description status priority address updatedAt createdAt')
        .lean();

    return latest.map((item) => ({
        _id: item._id.toString(),
        category: item.category,
        description: item.description,
        status: item.status,
        priority: item.priority,
        area: item.address?.ward || item.address?.district || item.address?.fullAddress || 'Municipal Zone',
        timestamp: item.updatedAt || item.createdAt
    }));
};

export interface PublicPetitionSummary {
    _id: string;
    title: string;
    description: string;
    category: string;
    status: 'Active' | 'Rejected' | 'Escalated';
    targetSignatures: number;
    upvoteCount: number;
    createdAt: Date;
}

export const getPublicPetitions = async (): Promise<PublicPetitionSummary[]> => {
    const petitions = await Petition.find({ status: { $in: ['Active', 'Escalated'] } })
        .select('title description category status targetSignatures upvotes createdAt')
        .lean();

    return petitions
        .map(({ upvotes, _id, ...rest }) => ({
            ...rest,
            _id: _id.toString(),
            upvoteCount: Array.isArray(upvotes) ? upvotes.length : 0
        }))
        .sort((a, b) => b.upvoteCount - a.upvoteCount || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
};
