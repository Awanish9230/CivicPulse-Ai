import Message, { MessageChannel } from "./message.model.js";
import ApiError from "../../utils/ApiError.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import type { AuthenticatedUser } from "../../types/express.js";

const VALID_CHANNELS: MessageChannel[] = ['general', 'ask-authority', 'announcements'];

export const getChannelMessages = async (
    channel: string,
    queryParams: { lat?: string; lng?: string; radius?: string },
    actor: AuthenticatedUser
) => {
    const { lat, lng, radius } = queryParams;

    if (!VALID_CHANNELS.includes(channel as MessageChannel)) {
        throw new ApiError(400, "Invalid channel");
    }

    if ((!lat || !lng) && actor.role !== 'Authority' && actor.role !== 'Admin') {
        throw new ApiError(403, "Location permission is required to access the community chat.");
    }

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const query: Record<string, unknown> = {
        channel,
        createdAt: { $gte: ninetyDaysAgo }
    };

    if (radius && radius !== 'All' && lat && lng) {
        const radiusInMeters = parseInt(radius, 10) * 1000;
        const radiusInRadians = radiusInMeters / 6378100;

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

    const messages = await Message.find(query).sort({ createdAt: 1 }).limit(500);

    return messages.map((msg) => ({
        id: msg._id,
        _id: msg._id,
        senderId: msg.sender,
        sender: msg.senderName,
        text: msg.content,
        timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: msg.createdAt,
        channel: msg.channel,
        type: msg.type,
        isEdited: msg.isEdited || false,
        role:
            msg.senderRole ||
            ((msg.senderName === 'Anonymous Citizen' || msg.senderName?.startsWith('CP-'))
                ? 'Citizen'
                : 'Authority')
    }));
};

export const editMessage = async (
    messageId: string,
    text: string | undefined,
    actor: AuthenticatedUser
) => {
    if (!text || !text.trim()) {
        throw new ApiError(400, "Message text is required");
    }

    const message = await Message.findById(messageId);
    if (!message) {
        throw new ApiError(404, "Message not found");
    }

    if (message.sender.toString() !== actor._id.toString()) {
        throw new ApiError(403, "You can only edit your own messages");
    }

    message.content = text.trim();
    message.isEdited = true;
    await message.save();

    return {
        _id: message._id,
        text: message.content,
        channel: message.channel,
        isEdited: true
    };
};

export const deleteMessage = async (messageId: string, actor: AuthenticatedUser) => {
    const message = await Message.findById(messageId);
    if (!message) {
        throw new ApiError(404, "Message not found");
    }

    const isSender = message.sender.toString() === actor._id.toString();
    const isAdmin = actor.role === 'Admin';

    if (!isSender && !isAdmin) {
        throw new ApiError(403, "You can only delete your own messages");
    }

    const channel = message.channel;
    await Message.findByIdAndDelete(messageId);

    return { _id: messageId, channel };
};

export const uploadChatImage = async (file?: Express.Multer.File): Promise<string> => {
    if (!file) {
        throw new ApiError(400, "Image file is required");
    }

    const uploadResult = await uploadOnCloudinary(file.buffer);
    if (!uploadResult) {
        throw new ApiError(500, "Failed to upload image to Cloudinary");
    }

    return uploadResult.secure_url;
};
