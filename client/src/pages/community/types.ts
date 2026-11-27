import type { LucideIcon } from 'lucide-react';

export interface GeoLocation {
    lat: number;
    lng: number;
}

export interface ChatReplyPreview {
    sender: string;
    text: string;
}

export interface ChatMessage {
    _id?: string;
    id?: string;
    senderId?: string;
    sender: string;
    role?: string;
    text: string;
    type?: string;
    timestamp?: string;
    channel: string;
    lat?: number;
    lng?: number;
    location?: {
        coordinates: [number, number];
    };
    replyTo?: ChatReplyPreview | null;
    isEdited?: boolean;
    isPending?: boolean;
}

export interface EditingMessageState {
    _id: string;
    text: string;
}

export interface ChannelConfig {
    id: string;
    name: string;
    icon: LucideIcon;
    desc: string;
}
