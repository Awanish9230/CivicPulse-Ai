import asynchandler from '../utils/asynchandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';

// 1. Get Platform Stats (TrustedStats.jsx)
export const getPlatformStats = asynchandler(async (req, res) => {
    // Total Complaints
    const totalComplaints = await Complaint.countDocuments();
    
    // Resolved Issues
    const resolvedIssues = await Complaint.countDocuments({ status: 'Resolved' });
    
    // Resolution Rate (percentage)
    const resolutionRate = totalComplaints > 0 ? Math.round((resolvedIssues / totalComplaints) * 100) : 0;
    
    // Active Authorities
    const activeAuthorities = await User.countDocuments({ role: { $in: ['Authority', 'Admin'] }, isBlocked: false });
    
    // Cities Covered (unique cities in complaints location)
    // Using simple regex or distinctive addresses as proxy if precise city not mapped
    const citiesCovered = 1; // Since we don't have a strict city model, default to 1 or mock slightly

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

// 2. Get Category Stats (ComplaintCategories.jsx)
export const getCategoryStats = asynchandler(async (req, res) => {
    const categoryCounts = await Complaint.aggregate([
        {
            $group: {
                _id: "$category",
                count: { $sum: 1 }
            }
        }
    ]);

    // Format for frontend mapping
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

// 3. Get Map Data (LiveComplaintMap.jsx)
export const getPublicMapData = asynchandler(async (req, res) => {
    // Only return recent or open complaints for map to prevent huge payloads
    const complaints = await Complaint.find({ location: { $exists: true } })
        .select('category description status location')
        .limit(100);
        
    return res.status(200).json(
        new ApiResponse(200, complaints, "Map data fetched successfully")
    );
});

// 4. Get Recent Reports (RecentReports.jsx)
export const getRecentReports = asynchandler(async (req, res) => {
    const recent = await Complaint.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .select('category description address status createdAt imageUrl imageUrls supportCount');
        
    return res.status(200).json(
        new ApiResponse(200, recent, "Recent reports fetched successfully")
    );
});

// 5. Get Authority Leaderboard (AuthorityPerformance.jsx)
export const getLeaderboard = asynchandler(async (req, res) => {
    // This requires aggregating resolved complaints by assigned department
    // Since we don't have a strict department schema assigned to complaints,
    // we will group by category for now, representing "departments".
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
