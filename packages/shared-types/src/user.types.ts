// User-related types for CreatorCircle

export interface UserPreferences {
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
    locationSharing: boolean;
    language: string;
    timezone: string;
}

export interface UserStats {
    postsCount: number;
    followersCount: number;
    followingCount: number;
    connectionsCount: number;
    likesReceived: number;
    commentsReceived: number;
}

export interface UserLocation {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    country?: string;
    lastUpdated: Date;
}

export interface UserActivity {
    lastLoginDate?: Date;
    loginStreak: number;
    lastActivityAt: Date;
    totalSessions: number;
    averageSessionDuration: number;
}

export interface UserXP {
    xp: number;
    level: number;
    badges: string[];
    lastDecayAppliedAt?: Date;
    xpHistory: XPTransaction[];
}

export interface XPTransaction {
    id: string;
    userId: string;
    amount: number;
    reason: string;
    timestamp: Date;
    type: 'earned' | 'spent' | 'decay';
}

export interface UserStreaks {
    streakCount: number;
    lastStreakWindowStart?: string;
    timezone: string;
    bestStreak: number;
    currentWindowStart?: Date;
}

// Authentication types
export interface UserAuth {
    email: string;
    emailVerified: boolean;
    passwordLastChanged?: Date;
    twoFactorEnabled: boolean;
    lastLoginIP?: string;
    loginHistory: LoginRecord[];
}

export interface LoginRecord {
    timestamp: Date;
    ip: string;
    userAgent: string;
    success: boolean;
    location?: string;
}
