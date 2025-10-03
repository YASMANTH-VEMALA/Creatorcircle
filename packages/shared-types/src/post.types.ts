// Post-related types for CreatorCircle

export interface PostMedia {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
    size?: number;
    duration?: number; // For videos
    dimensions?: {
        width: number;
        height: number;
    };
}

export interface PostReaction {
    emoji: string;
    name: string;
    count: number;
    userReacted: boolean;
    color?: string;
}

export interface PostMetrics {
    views: number;
    shares: number;
    saves: number;
    clicks: number;
    engagementRate: number;
}

export interface PostModeration {
    isModerated: boolean;
    moderationFlags: string[];
    isHidden: boolean;
    moderatedAt?: Date;
    moderatedBy?: string;
    moderationReason?: string;
}

export interface PostAnalytics {
    impressions: number;
    reach: number;
    engagement: number;
    topCountries: string[];
    topAgeGroups: string[];
    peakHours: number[];
}

// Notification types
export interface NotificationData {
    type: 'like' | 'comment' | 'follow' | 'collab_request' | 'message' | 'report_warning';
    toUserId: string;
    fromUserId: string;
    fromUserName?: string;
    fromUserAvatar?: string;
    relatedPostId?: string;
    relatedCommentId?: string;
    relatedChatId?: string;
    message?: string;
    isRead: boolean;
    createdAt: Date;
}

// Chat types
export interface ChatMessage {
    id: string;
    chatId: string;
    senderId: string;
    receiverId: string;
    text: string;
    messageType: 'text' | 'image' | 'video' | 'file';
    mediaUrl?: string;
    fileName?: string;
    fileSize?: number;
    isEdited: boolean;
    isDeleted: boolean;
    isSeen: boolean;
    timestamp: Date;
    editedAt?: Date;
}

export interface Chat {
    id: string;
    participants: string[];
    lastMessage?: {
        content: string;
        senderId: string;
        timestamp: Date;
        messageType: 'text' | 'image' | 'video' | 'file';
    };
    isGroupChat: boolean;
    groupName?: string;
    groupImage?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Collaboration types
export interface CollaborationRequest {
    id: string;
    senderId: string;
    receiverId: string;
    senderName: string;
    senderAvatar?: string;
    senderCollege?: string;
    message: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Date;
    respondedAt?: Date;
}
