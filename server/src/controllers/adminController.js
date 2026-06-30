import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import asynchandler from '../utils/asynchandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';

// Get Dashboard Statistics
export const getDashboardStats = asynchandler(async (req, res) => {
    const totalComplaints = await Complaint.countDocuments();
    const activeAuthorities = await User.countDocuments({ role: 'Authority' });
    const registeredCitizens = await User.countDocuments({ role: 'Citizen' });
    
    // Aggregate for trend (mock trend calculation for now)
    const stats = {
        totalComplaints,
        activeAuthorities,
        registeredCitizens,
        systemHealth: 99.9
    };
    
    return res.status(200).json(new ApiResponse(200, stats, "Dashboard stats fetched successfully"));
});

// User Management (Citizens)
export const getAllCitizens = asynchandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { role: 'Citizen' };
    if (req.query.search) {
        query.anonymousId = { $regex: req.query.search, $options: 'i' };
    }

    const citizens = await User.find(query).skip(skip).limit(limit).select('-password');
    const total = await User.countDocuments(query);

    // Get complaint counts for each citizen (Aggregation can be optimized later)
    const citizensWithStats = await Promise.all(citizens.map(async (citizen) => {
        const complaintsCount = await Complaint.countDocuments({ reportedBy: citizen._id });
        return {
            ...citizen.toObject(),
            complaintsCount
        };
    }));

    return res.status(200).json(
        new ApiResponse(200, {
            users: citizensWithStats,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        }, "Citizens fetched successfully")
    );
});

// Authority Management
export const getAllAuthorities = asynchandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { role: 'Authority' };
    if (req.query.search) {
        query.name = { $regex: req.query.search, $options: 'i' };
    }

    const authorities = await User.find(query).skip(skip).limit(limit).select('-password');
    const total = await User.countDocuments(query);

    const authoritiesWithStats = await Promise.all(authorities.map(async (auth) => {
        const tasksCount = await Complaint.countDocuments({ assignedTo: auth._id });
        return {
            ...auth.toObject(),
            tasksCount
        };
    }));

    return res.status(200).json(
        new ApiResponse(200, {
            authorities: authoritiesWithStats,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        }, "Authorities fetched successfully")
    );
});

// Complaint Management
export const getAllComplaints = asynchandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.search) {
        query.title = { $regex: req.query.search, $options: 'i' };
    }

    const complaints = await Complaint.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('reportedBy', 'anonymousId')
        .populate('assignedTo', 'name department');
        
    const total = await Complaint.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(200, {
            complaints,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        }, "Complaints fetched successfully")
    );
});

// AI Dashboard Insights (Gemini)
import { GoogleGenerativeAI } from '@google/generative-ai';

export const getAiInsights = asynchandler(async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(400).json(new ApiResponse(400, null, "Gemini API key is missing from environment variables"));
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Aggregate some platform data to feed to Gemini
        const recentComplaints = await Complaint.find().sort({ createdAt: -1 }).limit(10).select('title category status location');
        const totalPending = await Complaint.countDocuments({ status: { $in: ['Pending', 'In Progress'] } });
        
        const prompt = `
            You are CivicPulse AI, an advanced AI assistant for municipal administrators.
            Analyze the following recent platform data and provide:
            1. An overall health summary (1 short paragraph).
            2. Potential anomalies, fraud, or spam detection (if any).
            3. Recommended actions or hotspots to prioritize.

            Platform Data:
            Total Pending Complaints: ${totalPending}
            Recent 10 Complaints: ${JSON.stringify(recentComplaints)}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return res.status(200).json(new ApiResponse(200, { aiAnalysis: text }, "AI Insights generated successfully"));
    } catch (error) {
        console.error("Gemini API Error:", error);
        return res.status(500).json(new ApiResponse(500, null, "Failed to generate AI insights"));
    }
});
