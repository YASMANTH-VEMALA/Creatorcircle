import mongoose, { Schema, Document, Model } from 'mongoose';

// ==================== SUBDOCUMENT TYPES ====================

export type UserPreferences = {
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
    locationSharing: boolean;
    language: string;
    timezone: string;
};

export type UserStats = {
    postsCount: number;
    followersCount: number;
    followingCount: number;
    connectionsCount: number;
    likesReceived: number;
    commentsReceived: number;
};

export type UserActivity = {
    lastLoginDate?: Date;
    loginStreak: number;
    lastActivityAt: Date;
    totalSessions: number;
    averageSessionDuration: number; // in seconds
};

export type UserXP = {
    xp: number;
    level: number;
    badges: string[];
    lastDecayAppliedAt?: Date;
};

export type UserStreaks = {
    streakCount: number;
    lastStreakWindowStart?: string; // ISO date string
    timezone: string;
    bestStreak: number;
};

export type UserProfileLocation = {
    city?: string;
    country?: string;
    address?: string;
};

export type SocialLink = {
    platform: 'youtube' | 'instagram' | 'linkedin' | 'twitter' | 'facebook' | 'github' | 'tiktok' | 'website';
    url: string;
};

export type Banner = {
    imageUrl: string;
    title?: string;
    description?: string;
    order: number;
    isActive: boolean;
};

// ==================== MAIN USER TYPE ====================

export type UserDocument = Document & {
    // Basic Info (Firebase Auth UID)
    uid: string;
    email: string;
    name: string;
    college: string;
    passion: string;
    aboutMe: string;

    // Media
    profilePhotoUrl: string;
    bannerPhotoUrl?: string;
    banners?: Banner[]; // Up to 5 for premium users

    // Skills & Interests
    skills: string[];
    interests: string[];

    // Social Links
    socialLinks: SocialLink[];

    // Verification & Premium
    isVerified: boolean;
    verifiedBadge: 'none' | 'silver' | 'gold';
    isPremium: boolean;
    premiumExpiry?: Date;

    // Embedded Subdocuments
    stats: UserStats;
    xp: UserXP;
    streaks: UserStreaks;
    activity: UserActivity;
    preferences: UserPreferences;

    // AI & Personality
    aiApiKey?: string; // Should be encrypted
    personality?: 'introvert' | 'extrovert' | 'ambivert';

    // Location (for profile, not real-time)
    location: UserProfileLocation;

    // Push Notifications
    pushToken?: string;

    // Timestamps
    joinedDate: Date;
    createdAt: Date;
    updatedAt: Date;

    // Methods
    addXP(amount: number, reason: string): Promise<UserDocument>;
    levelUp(): void;
    updateStreak(): void;
    incrementStat(statName: keyof UserStats, amount?: number): Promise<UserDocument>;
};

// ==================== SUBDOCUMENT SCHEMAS ====================

const UserPreferencesSchema = new Schema<UserPreferences>({
    theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'auto'
    },
    notifications: {
        type: Boolean,
        default: true
    },
    locationSharing: {
        type: Boolean,
        default: false
    },
    language: {
        type: String,
        default: 'en'
    },
    timezone: {
        type: String,
        default: 'Asia/Kolkata'
    }
}, { _id: false });

const UserStatsSchema = new Schema<UserStats>({
    postsCount: {
        type: Number,
        default: 0,
        min: 0
    },
    followersCount: {
        type: Number,
        default: 0,
        min: 0
    },
    followingCount: {
        type: Number,
        default: 0,
        min: 0
    },
    connectionsCount: {
        type: Number,
        default: 0,
        min: 0
    },
    likesReceived: {
        type: Number,
        default: 0,
        min: 0
    },
    commentsReceived: {
        type: Number,
        default: 0,
        min: 0
    }
}, { _id: false });

const UserActivitySchema = new Schema<UserActivity>({
    lastLoginDate: Date,
    loginStreak: {
        type: Number,
        default: 0,
        min: 0
    },
    lastActivityAt: {
        type: Date,
        default: Date.now
    },
    totalSessions: {
        type: Number,
        default: 0,
        min: 0
    },
    averageSessionDuration: {
        type: Number,
        default: 0,
        min: 0
    }
}, { _id: false });

const UserXPSchema = new Schema<UserXP>({
    xp: {
        type: Number,
        default: 0,
        min: 0
    },
    level: {
        type: Number,
        default: 1,
        min: 1
    },
    badges: {
        type: [String],
        default: []
    },
    lastDecayAppliedAt: Date
}, { _id: false });

const UserStreaksSchema = new Schema<UserStreaks>({
    streakCount: {
        type: Number,
        default: 0,
        min: 0
    },
    lastStreakWindowStart: String,
    timezone: {
        type: String,
        default: 'Asia/Kolkata'
    },
    bestStreak: {
        type: Number,
        default: 0,
        min: 0
    }
}, { _id: false });

const UserProfileLocationSchema = new Schema<UserProfileLocation>({
    city: String,
    country: String,
    address: String
}, { _id: false });

const SocialLinkSchema = new Schema<SocialLink>({
    platform: {
        type: String,
        enum: ['youtube', 'instagram', 'linkedin', 'twitter', 'facebook', 'github', 'tiktok', 'website'],
        required: true
    },
    url: {
        type: String,
        required: true,
        trim: true
    }
}, { _id: false });

const BannerSchema = new Schema<Banner>({
    imageUrl: {
        type: String,
        required: true
    },
    title: String,
    description: String,
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { _id: true, timestamps: true });

// ==================== MAIN USER SCHEMA ====================

const UserSchema = new Schema<UserDocument>({
    // Basic Info
    uid: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        index: 'text' // For text search
    },
    college: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    passion: {
        type: String,
        default: '',
        trim: true
    },
    aboutMe: {
        type: String,
        default: '',
        trim: true,
        maxlength: 500
    },

    // Media
    profilePhotoUrl: {
        type: String,
        default: ''
    },
    bannerPhotoUrl: String,
    banners: {
        type: [BannerSchema],
        default: [],
        validate: {
            validator: function (banners: Banner[]) {
                return banners.length <= 5;
            },
            message: 'Maximum 5 banners allowed'
        }
    },

    // Skills & Interests
    skills: {
        type: [String],
        default: [],
        index: true
    },
    interests: {
        type: [String],
        default: [],
        index: true
    },

    // Social Links
    socialLinks: {
        type: [SocialLinkSchema],
        default: [],
        validate: {
            validator: function (links: SocialLink[]) {
                return links.length <= 8;
            },
            message: 'Maximum 8 social links allowed'
        }
    },

    // Verification & Premium
    isVerified: {
        type: Boolean,
        default: false,
        index: true
    },
    verifiedBadge: {
        type: String,
        enum: ['none', 'silver', 'gold'],
        default: 'none'
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    premiumExpiry: Date,

    // Embedded Subdocuments
    stats: {
        type: UserStatsSchema,
        default: () => ({})
    },
    xp: {
        type: UserXPSchema,
        default: () => ({})
    },
    streaks: {
        type: UserStreaksSchema,
        default: () => ({})
    },
    activity: {
        type: UserActivitySchema,
        default: () => ({})
    },
    preferences: {
        type: UserPreferencesSchema,
        default: () => ({})
    },

    // AI & Personality
    aiApiKey: {
        type: String,
        select: false // Don't include in queries by default
    },
    personality: {
        type: String,
        enum: ['introvert', 'extrovert', 'ambivert']
    },

    // Location
    location: {
        type: UserProfileLocationSchema,
        default: () => ({})
    },

    // Push Notifications
    pushToken: String,

    // Timestamps
    joinedDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true, // Automatically add createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ==================== INDEXES ====================

// Compound indexes for common queries
UserSchema.index({ 'xp.level': -1 }); // Leaderboard
UserSchema.index({ 'stats.followersCount': -1 }); // Popular users
UserSchema.index({ college: 1, 'xp.level': -1 }); // College leaderboard
UserSchema.index({ isVerified: 1, 'stats.followersCount': -1 }); // Verified popular users

// ==================== VIRTUAL FIELDS ====================

// Profile completion percentage
UserSchema.virtual('profileCompletion').get(function () {
    let completion = 0;
    const fields = [
        this.name,
        this.college,
        this.passion,
        this.aboutMe,
        this.profilePhotoUrl,
        this.skills?.length > 0,
        this.interests?.length > 0
    ];

    fields.forEach(field => {
        if (field) completion += (100 / fields.length);
    });

    return Math.round(completion);
});

// Display name with verification badge
UserSchema.virtual('displayName').get(function () {
    let name = this.name;
    if (this.verifiedBadge === 'gold') name += ' 🏆';
    else if (this.verifiedBadge === 'silver') name += ' ✨';
    else if (this.isVerified) name += ' ✓';
    return name;
});

// ==================== INSTANCE METHODS ====================

/**
 * Add XP to user and handle level up
 */
UserSchema.methods.addXP = async function (amount: number, reason: string) {
    this.xp.xp += amount;

    // Check if user should level up (100 XP per level)
    const requiredXP = this.xp.level * 100;
    if (this.xp.xp >= requiredXP) {
        this.levelUp();
    }

    await this.save();
    return this;
};

/**
 * Level up user
 */
UserSchema.methods.levelUp = function (): void {
    this.xp.level += 1;

    // Award level-up badges
    if (this.xp.level === 5) {
        this.xp.badges.push('Rising Star');
    } else if (this.xp.level === 10) {
        this.xp.badges.push('Creator');
    } else if (this.xp.level === 25) {
        this.xp.badges.push('Influencer');
    } else if (this.xp.level === 50) {
        this.xp.badges.push('Legend');
    }
};

/**
 * Update user streak
 */
UserSchema.methods.updateStreak = function (): void {
    const now = new Date();
    const lastLogin = this.activity.lastLoginDate;

    if (lastLogin) {
        const hoursSinceLastLogin = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60);

        // Streak continues if login is within 24 hours
        if (hoursSinceLastLogin <= 24) {
            this.streaks.streakCount += 1;
            if (this.streaks.streakCount > this.streaks.bestStreak) {
                this.streaks.bestStreak = this.streaks.streakCount;
            }
        } else if (hoursSinceLastLogin > 48) {
            // Streak broken if more than 48 hours
            this.streaks.streakCount = 1;
        }
    } else {
        this.streaks.streakCount = 1;
    }

    this.activity.lastLoginDate = now;
    this.activity.lastActivityAt = now;
};

/**
 * Increment a stat counter
 */
UserSchema.methods.incrementStat = async function (
    statName: keyof UserStats,
    amount: number = 1
) {
    this.stats[statName] += amount;
    await this.save();
    return this;
};

// ==================== STATIC METHODS ====================

/**
 * Find users by skills
 */
UserSchema.statics.findBySkills = function (skills: string[], limit: number = 10): Promise<UserDocument[]> {
    return this.find({
        skills: { $in: skills }
    })
        .sort({ 'stats.followersCount': -1 })
        .limit(limit)
        .exec();
};

/**
 * Find users by college
 */
UserSchema.statics.findByCollege = function (college: string, limit: number = 10): Promise<UserDocument[]> {
    return this.find({ college })
        .sort({ 'xp.level': -1 })
        .limit(limit)
        .exec();
};

/**
 * Get leaderboard
 */
UserSchema.statics.getLeaderboard = function (limit: number = 100): Promise<UserDocument[]> {
    return this.find()
        .sort({ 'xp.xp': -1, 'xp.level': -1 })
        .select('name college profilePhotoUrl xp stats isVerified verifiedBadge')
        .limit(limit)
        .exec();
};

// ==================== MIDDLEWARE (HOOKS) ====================

/**
 * Pre-save middleware
 */
UserSchema.pre('save', function (next) {
    // Ensure stats exist with defaults
    if (!this.stats || Object.keys(this.stats).length === 0) {
        this.stats = {
            postsCount: 0,
            followersCount: 0,
            followingCount: 0,
            connectionsCount: 0,
            likesReceived: 0,
            commentsReceived: 0
        };
    }

    // Ensure XP exists with defaults
    if (!this.xp || Object.keys(this.xp).length === 0) {
        this.xp = {
            xp: 0,
            level: 1,
            badges: []
        };
    }

    // Ensure preferences exist with defaults
    if (!this.preferences || Object.keys(this.preferences).length === 0) {
        this.preferences = {
            theme: 'auto',
            notifications: true,
            locationSharing: false,
            language: 'en',
            timezone: 'Asia/Kolkata'
        };
    }

    next();
});

/**
 * Post-save middleware (for logging or notifications)
 */
UserSchema.post('save', function (doc) {
    // Could add logging here
    // console.log('User saved:', doc.uid);
});

// ==================== MODEL ====================

export type UserModel = Model<UserDocument> & {
    findBySkills(skills: string[], limit?: number): Promise<UserDocument[]>;
    findByCollege(college: string, limit?: number): Promise<UserDocument[]>;
    getLeaderboard(limit?: number): Promise<UserDocument[]>;
};

const User = mongoose.model<UserDocument, UserModel>('User', UserSchema);

export default User;

