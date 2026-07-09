import Message from "./message.model.js";
import asyncHandler from "../../utils/asynchandler.js";
import ApiError from "../../utils/ApiError.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";

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
        type: msg.type,
        isEdited: msg.isEdited || false,
        role: msg.senderRole || ((msg.senderName === 'Anonymous Citizen' || msg.senderName?.startsWith('CP-')) ? 'Citizen' : 'Authority')
    }));

    res.status(200).json({
        success: true,
        data: formattedMessages,
    });
});

export const editMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
        throw new ApiError(400, "Message text is required");
    }

    const message = await Message.findById(messageId);
    if (!message) {
        throw new ApiError(404, "Message not found");
    }

    // Only the sender can edit their own message
    if (message.sender.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only edit your own messages");
    }

    message.content = text.trim();
    message.isEdited = true;
    await message.save();

    res.status(200).json({
        success: true,
        data: {
            _id: message._id,
            text: message.content,
            channel: message.channel,
            isEdited: true
        },
        message: "Message updated successfully"
    });
});

export const deleteMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
        throw new ApiError(404, "Message not found");
    }

    // Sender can delete their own, Admin can delete any
    const isSender = message.sender.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isSender && !isAdmin) {
        throw new ApiError(403, "You can only delete your own messages");
    }

    const channel = message.channel;
    await Message.findByIdAndDelete(messageId);

    res.status(200).json({
        success: true,
        data: { _id: messageId, channel },
        message: "Message deleted successfully"
    });
});

export const uploadImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "Image file is required");
    }

    const uploadResult = await uploadOnCloudinary(req.file.path);
    if (!uploadResult) {
        throw new ApiError(500, "Failed to upload image to Cloudinary");
    }

    res.status(200).json({
        success: true,
        data: {
            imageUrl: uploadResult.secure_url
        },
        message: "Image uploaded successfully"
    });
});
