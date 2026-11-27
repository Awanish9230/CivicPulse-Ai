import asynchandler from '../../utils/asynchandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import Complaint from '../complaint/complaint.model.js';
import User from '../user/user.model.js';

export const getPlatformStats = asynchandler(async (req, res) => {
    const totalComplaints = await Complaint.countDocuments();
    
    const resolvedIssues = await Complaint.countDocuments({ status: 'Resolved' });
    
    const resolutionRate = totalComplaints > 0 ? Math.round((resolvedIssues / totalComplaints) * 100) : 0;
    
    const activeAuthorities = await User.countDocuments({ role: { $in: ['Authority', 'Admin'] }, isBlocked: false });
    
    const citiesCovered = 1; 

    return res.status(200).json(
        new ApiResponse(200, {
            totalComplaints,
            resolvedIssues,
            resolutionRate,
            activeAuthorities,
            citiesCovered
        }, "Platform stats fetched successfully")
    );
});

export const getCategoryStats = asynchandler(async (req, res) => {
    const categoryCounts = await Complaint.aggregate([
        {
            $group: {
                _id: "$category",
                count: { $sum: 1 }
            }
        }
    ]);

    const formattedCategories = categoryCounts.reduce((acc, curr) => {
        if (curr._id) {
            acc[curr._id] = curr.count;
        }
        return acc;
    }, {});

    return res.status(200).json(
        new ApiResponse(200, formattedCategories, "Category stats fetched successfully")
    );
});

export const getPublicMapData = asynchandler(async (req, res) => {
    const complaints = await Complaint.find({ location: { $exists: true } })
        .select('category description status location')
        .limit(100);
        
    return res.status(200).json(
        new ApiResponse(200, complaints, "Map data fetched successfully")
    );
});

export const getRecentReports = asynchandler(async (req, res) => {
    const recent = await Complaint.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .select('category description address status createdAt imageUrl imageUrls supportCount');
        
    return res.status(200).json(
        new ApiResponse(200, recent, "Recent reports fetched successfully")
    );
});

export const getLeaderboard = asynchandler(async (req, res) => {
    const leaderboard = await Complaint.aggregate([
        { $match: { status: 'Resolved' } },
        { $group: { _id: "$category", resolved: { $sum: 1 } } },
        { $sort: { resolved: -1 } },
        { $limit: 5 }
    ]);

    return res.status(200).json(
        new ApiResponse(200, leaderboard, "Leaderboard fetched successfully")
    );
});
