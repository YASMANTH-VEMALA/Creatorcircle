import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ==================== TYPES ====================

export type SpotlightPostDocument = Document & {
    creatorId: Types.ObjectId;

    // Video
    videoUrl: string;
    thumbnailUrl?: string;
    caption?: string;

    // Metrics
    likesCount: number;
    commentsCount: number;
    viewsCount: number;
    sharesCount: number;

    // Status
    isFeatured: boolean;
    isPublic: boolean;
    isDeleted: boolean;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;

    // Methods
    incrementMetric(metric: 'likesCount' | 'commentsCount' | 'viewsCount' | 'sharesCount', amount?: number): Promise<SpotlightPostDocument>;
    feature(): Promise<SpotlightPostDocument>;
    unfeature(): Promise<SpotlightPostDocument>;
};

// ==================== SCHEMA ====================

const SpotlightPostSchema = new Schema<SpotlightPostDocument>({
    creatorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Video
    videoUrl: {
        type: String,
        required: true
    },
    thumbnailUrl: String,
    caption: {
        type: String,
        trim: true,
        maxlength: 500
    },

    // Metrics
    likesCount: {
        type: Number,
        default: 0,
        min: 0,
        index: true
    },
    commentsCount: {
        type: Number,
        default: 0,
        min: 0
    },
    viewsCount: {
        type: Number,
        default: 0,
        min: 0,
        index: true
    },
    sharesCount: {
        type: Number,
        default: 0,
        min: 0
    },

    // Status
    isFeatured: {
        type: Boolean,
        default: false,
        index: true
    },
    isPublic: {
        type: Boolean,
        default: true,
        index: true
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ==================== INDEXES ====================

// Compound indexes for common queries
SpotlightPostSchema.index({ creatorId: 1, createdAt: -1 }); // Creator's spotlights
SpotlightPostSchema.index({ isFeatured: 1, viewsCount: -1 }); // Featured trending
SpotlightPostSchema.index({ isPublic: 1, isDeleted: 1, createdAt: -1 }); // Public feed
SpotlightPostSchema.index({ viewsCount: -1, createdAt: -1 }); // Trending
SpotlightPostSchema.index({ likesCount: -1, createdAt: -1 }); // Most liked

// ==================== VIRTUAL FIELDS ====================

// Creator details (populate)
SpotlightPostSchema.virtual('creator', {
    ref: 'User',
    localField: 'creatorId',
    foreignField: '_id',
    justOne: true
});

// Engagement rate calculation
SpotlightPostSchema.virtual('engagementRate').get(function () {
    if (this.viewsCount === 0) return 0;
    const totalEngagement = this.likesCount + this.commentsCount + this.sharesCount;
    return ((totalEngagement / this.viewsCount) * 100).toFixed(2);
});

// ==================== INSTANCE METHODS ====================

/**
 * Increment a metric counter
 */
SpotlightPostSchema.methods.incrementMetric = async function (
    metric: 'likesCount' | 'commentsCount' | 'viewsCount' | 'sharesCount',
    amount: number = 1
) {
    this[metric] += amount;
    await this.save();
    return this;
};

/**
 * Feature this spotlight post
 */
SpotlightPostSchema.methods.feature = async function () {
    this.isFeatured = true;
    await this.save();
    return this;
};

/**
 * Unfeature this spotlight post
 */
SpotlightPostSchema.methods.unfeature = async function () {
    this.isFeatured = false;
    await this.save();
    return this;
};

// ==================== STATIC METHODS ====================

/**
 * Get spotlight feed
 */
SpotlightPostSchema.statics.getFeed = function (
    page: number = 1,
    limit: number = 20
): Promise<SpotlightPostDocument[]> {
    return this.find({
        isPublic: true,
        isDeleted: false
    })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('creatorId', 'name college profilePhotoUrl isVerified verifiedBadge')
        .exec();
};

/**
 * Get trending spotlights
 */
SpotlightPostSchema.statics.getTrending = function (
    hours: number = 24,
    limit: number = 20
): Promise<SpotlightPostDocument[]> {
    const timeAgo = new Date();
    timeAgo.setHours(timeAgo.getHours() - hours);

    return this.find({
        createdAt: { $gte: timeAgo },
        isPublic: true,
        isDeleted: false
    })
        .sort({ viewsCount: -1, likesCount: -1 })
        .limit(limit)
        .populate('creatorId', 'name college profilePhotoUrl isVerified verifiedBadge')
        .exec();
};

/**
 * Get featured spotlights
 */
SpotlightPostSchema.statics.getFeatured = function (
    page: number = 1,
    limit: number = 20
): Promise<SpotlightPostDocument[]> {
    return this.find({
        isFeatured: true,
        isPublic: true,
        isDeleted: false
    })
        .sort({ viewsCount: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('creatorId', 'name college profilePhotoUrl isVerified verifiedBadge')
        .exec();
};

/**
 * Get creator's spotlights
 */
SpotlightPostSchema.statics.getCreatorSpotlights = function (
    creatorId: Types.ObjectId,
    page: number = 1,
    limit: number = 20
): Promise<SpotlightPostDocument[]> {
    return this.find({
        creatorId,
        isDeleted: false
    })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
};

/**
 * Get most viewed spotlights
 */
SpotlightPostSchema.statics.getMostViewed = function (
    period: 'day' | 'week' | 'month' | 'all' = 'week',
    limit: number = 20
): Promise<SpotlightPostDocument[]> {
    let timeAgo: Date | undefined;

    if (period !== 'all') {
        timeAgo = new Date();
        switch (period) {
            case 'day':
                timeAgo.setDate(timeAgo.getDate() - 1);
                break;
            case 'week':
                timeAgo.setDate(timeAgo.getDate() - 7);
                break;
            case 'month':
                timeAgo.setMonth(timeAgo.getMonth() - 1);
                break;
        }
    }

    const query: Record<string, unknown> = {
        isPublic: true,
        isDeleted: false
    };

    if (timeAgo) {
        query.createdAt = { $gte: timeAgo };
    }

    return this.find(query)
        .sort({ viewsCount: -1 })
        .limit(limit)
        .populate('creatorId', 'name college profilePhotoUrl isVerified verifiedBadge')
        .exec();
};

/**
 * Search spotlights by caption
 */
SpotlightPostSchema.statics.searchSpotlights = function (
    searchQuery: string,
    page: number = 1,
    limit: number = 20
): Promise<SpotlightPostDocument[]> {
    return this.find({
        caption: { $regex: searchQuery, $options: 'i' },
        isPublic: true,
        isDeleted: false
    })
        .sort({ viewsCount: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('creatorId', 'name college profilePhotoUrl isVerified verifiedBadge')
        .exec();
};

// ==================== MIDDLEWARE (HOOKS) ====================

/**
 * Pre-save middleware
 */
SpotlightPostSchema.pre('save', function (next) {
    // Ensure metrics are non-negative
    if (this.likesCount < 0) this.likesCount = 0;
    if (this.commentsCount < 0) this.commentsCount = 0;
    if (this.viewsCount < 0) this.viewsCount = 0;
    if (this.sharesCount < 0) this.sharesCount = 0;

    next();
});

/**
 * Post-save middleware
 */
SpotlightPostSchema.post('save', async function (doc) {
    if (doc.isNew && !doc.isDeleted) {
        // Award XP to creator
        await mongoose.model('User').findByIdAndUpdate(
            doc.creatorId,
            { $inc: { 'xp.xp': 20 } } // Award 20 XP for creating a spotlight
        );
    }
});

// ==================== MODEL ====================

export type SpotlightPostModel = Model<SpotlightPostDocument> & {
    getFeed(page?: number, limit?: number): Promise<SpotlightPostDocument[]>;
    getTrending(hours?: number, limit?: number): Promise<SpotlightPostDocument[]>;
    getFeatured(page?: number, limit?: number): Promise<SpotlightPostDocument[]>;
    getCreatorSpotlights(creatorId: Types.ObjectId, page?: number, limit?: number): Promise<SpotlightPostDocument[]>;
    getMostViewed(period?: 'day' | 'week' | 'month' | 'all', limit?: number): Promise<SpotlightPostDocument[]>;
    searchSpotlights(searchQuery: string, page?: number, limit?: number): Promise<SpotlightPostDocument[]>;
};

const SpotlightPost = mongoose.model<SpotlightPostDocument, SpotlightPostModel>('SpotlightPost', SpotlightPostSchema);

export default SpotlightPost;
