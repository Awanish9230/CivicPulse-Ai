import Message from "../models/Message.js";
import asyncHandler from "../utils/asynchandler.js";
import ApiError from "../utils/ApiError.js";

export const getChannelMessages = asyncHandler(async (req, res) => {
    const { channel } = req.params;

    if (!['general', 'ask-authority'].includes(channel)) {
        throw new ApiError(400, "Invalid channel");
    }

    // Fetch messages from the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const messages = await Message.find({
        channel: channel,
        createdAt: { $gte: ninetyDaysAgo }
    }).sort({ createdAt: 1 }).limit(500); // Fetch up to 500 recent messages

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
        role: (msg.senderName === 'Anonymous Citizen' || msg.senderName.startsWith('CP-')) ? 'Citizen' : 'Authority'
    }));

    res.status(200).json({
        success: true,
        data: formattedMessages,
    });
});
