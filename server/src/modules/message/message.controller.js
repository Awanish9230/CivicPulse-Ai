import Message from "./message.model.js";
import asyncHandler from "../../utils/asynchandler.js";
import ApiError from "../../utils/ApiError.js";

export const getChannelMessages = asyncHandler(async (req, res) => {
    const { channel } = req.params;
    const { lat, lng, radius } = req.query;

    if (!['general', 'ask-authority', 'announcements'].includes(channel)) {
        throw new ApiError(400, "Invalid channel");
    }

    // Require location to access the community chat, unless Authority or Admin
    if ((!lat || !lng) && req.user.role !== 'Authority' && req.user.role !== 'Admin') {
        throw new ApiError(403, "Location permission is required to access the community chat.");
    }

    // Fetch messages from the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    let query = {
        channel: channel,
        createdAt: { $gte: ninetyDaysAgo }
    };

    if (radius && radius !== 'All' && lat && lng) {
        const radiusInMeters = parseInt(radius) * 1000;
        const radiusInRadians = radiusInMeters / 6378100;
        
        // Include messages that match the geo filter OR have no location at all
        // (e.g. authority messages sent from dashboard without GPS)
        query.$or = [
            {
                location: {
                    $geoWithin: {
                        $centerSphere: [[parseFloat(lng), parseFloat(lat)], radiusInRadians]
                    }
                }
            },
            { location: { $exists: false } },
            { 'location.coordinates': { $exists: false } }
        ];
    }

    const messages = await Message.find(query).sort({ createdAt: 1 }).limit(500); // Fetch up to 500 recent messages

    // Map database fields to frontend expected fields
    const formattedMessages = messages.map(msg => ({
        id: msg._id,
        _id: msg._id,
        senderId: msg.sender,
        sender: msg.senderName, // frontend expects name here
        text: msg.content,      // frontend expects content as text
        timestamp: new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        createdAt: msg.createdAt,
        channel: msg.channel,
        role: msg.senderRole || ((msg.senderName === 'Anonymous Citizen' || msg.senderName?.startsWith('CP-')) ? 'Citizen' : 'Authority')
    }));

    res.status(200).json({
        success: true,
        data: formattedMessages,
    });
});
