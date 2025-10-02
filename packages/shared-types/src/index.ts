// Shared types for CreatorCircle monorepo
// Extracted from mobile app for cross-platform compatibility

export interface User {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
}

export type SocialPlatform =
    | 'youtube'
    | 'instagram'
    | 'linkedin'
    | 'twitter'
    | 'facebook'
    | 'github'
    | 'tiktok'
    | 'website';

export interface SocialLink {
    platform: SocialPlatform;
    url: string;
}

export interface Banner {
    id: string;
    imageUrl: string;
    title: string | null;
    description: string | null;
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Profile {
    uid: string;
    email: string;
    name: string;
    college: string;
    passion: string;
    aboutMe: string;
    profilePhotoUrl: string;
    bannerPhotoUrl?: string;
    banners?: Banner[];
    skills?: string[];
    interests?: string[];
    followers?: number;
    following?: number;
    connections?: number;
    isVerified?: boolean;
    verifiedBadge?: 'none' | 'silver' | 'gold';
    location?: string;
    joinedDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    pushToken?: string;
    socialLinks?: SocialLink[];
    aiApiKey?: string;
    personality?: 'introvert' | 'extrovert' | 'ambivert';
    // XP system fields
    xp?: number;
    level?: number;
    badges?: string[];
    lastLoginDate?: Date;
    loginStreak?: number;
    lastActivityAt?: Date;
    lastDecayAppliedAt?: Date;
    // Streak system fields
    streakCount?: number;
    lastStreakWindowStart?: string;
    timezone?: string;
}

export interface Post {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    userCollege?: string;
    userVerifiedBadge?: 'none' | 'silver' | 'gold';
    content: string;
    emoji?: string;
    images?: string[];
    videos?: string[];
    likes: number;
    comments: number;
    reports: number;
    reactions?: { [emoji: string]: number };
    isEdited: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Comment {
    id: string;
    postId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    userVerifiedBadge?: 'none' | 'silver' | 'gold';
    content: string;
    likes: number;
    reports: number;
    parentCommentId?: string;
    isEdited: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T = any> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    };
}

// Auth types
export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    college?: string;
}

export interface AuthResponse {
    user: User;
    token: string;
    refreshToken?: string;
}
