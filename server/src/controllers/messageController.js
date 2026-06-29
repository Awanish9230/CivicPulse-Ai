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

    res.status(200).json({
        success: true,
        data: messages,
    });
});
