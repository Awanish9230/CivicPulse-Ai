import Complaint from '../complaint/complaint.model.js';
import User from '../user/user.model.js';

export const getPlatformStats = async () => {
    const totalComplaints = await Complaint.countDocuments();
    const resolvedIssues = await Complaint.countDocuments({ status: 'Resolved' });
    const resolutionRate = totalComplaints > 0 ? Math.round((resolvedIssues / totalComplaints) * 100) : 0;
    const activeAuthorities = await User.countDocuments({
        role: { $in: ['Authority', 'Admin'] },
        isBlocked: false
    });
    const citiesCovered = 1;

    return {
        totalComplaints,
        resolvedIssues,
        resolutionRate,
        activeAuthorities,
        citiesCovered
    };
};

export const getCategoryStats = async (): Promise<Record<string, number>> => {
    const categoryCounts = await Complaint.aggregate<{ _id: string | null; count: number }>([
        {
            $group: {
                _id: "$category",
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
    return Complaint.find({ location: { $exists: true } })
        .select('category description status location')
        .limit(100);
};

export const getRecentReports = async () => {
    return Complaint.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .select('category description address status createdAt imageUrl imageUrls supportCount');
};

export const getLeaderboard = async () => {
    return Complaint.aggregate<{ _id: string; resolved: number }>([
        { $match: { status: 'Resolved' } },
        { $group: { _id: "$category", resolved: { $sum: 1 } } },
        { $sort: { resolved: -1 } },
        { $limit: 5 }
    ]);
};
