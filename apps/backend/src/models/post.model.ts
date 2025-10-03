import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ==================== TYPES ====================

export type PostDocument = Document & {
    userId: Types.ObjectId;

    // Content
    content: string;
    emoji?: string;

    // Media (AWS S3 URLs)
    images: string[];
    videos: string[];

    // Engagement Metrics
    likes: number;
    comments: number;
    shares: number;
    views: number;
    saves: number;

    // Reactions (emoji -> count)
    reactions: Map<string, number>;

    // Moderation
    reports: number;
    isModerated: boolean;
    isHidden: boolean;
    moderationFlags: string[];
    moderatedAt?: Date;
    moderatedBy?: Types.ObjectId;
    moderationReason?: string;

    // Status
    isEdited: boolean;
    isDeleted: boolean;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    editedAt?: Date;

    // Methods
    incrementMetric(metric: 'likes' | 'comments' | 'shares' | 'views' | 'saves', amount?: number): Promise<PostDocument>;
    addReaction(emoji: string): Promise<PostDocument>;
    removeReaction(emoji: string): Promise<PostDocument>;
    hide(reason: string, moderatorId: Types.ObjectId): Promise<PostDocument>;
};

// ==================== SCHEMA ====================

const PostSchema = new Schema<PostDocument>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Content
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000
    },
    emoji: {
        type: String,
        trim: true
    },

    // Media
    images: {
        type: [String],
        default: [],
        validate: {
            validator: function (images: string[]) {
                return images.length <= 10;
            },
            message: 'Maximum 10 images allowed per post'
        }
    },
    videos: {
        type: [String],
        default: [],
        validate: {
            validator: function (videos: string[]) {
                return videos.length <= 3;
            },
            message: 'Maximum 3 videos allowed per post'
        }
    },

    // Engagement Metrics
    likes: {
        type: Number,
        default: 0,
        min: 0,
        index: true
    },
    comments: {
        type: Number,
        default: 0,
        min: 0
    },
    shares: {
        type: Number,
        default: 0,
        min: 0
    },
    views: {
        type: Number,
        default: 0,
        min: 0
    },
    saves: {
        type: Number,
        default: 0,
        min: 0
    },

    // Reactions
    reactions: {
        type: Map,
        of: Number,
        default: new Map()
    },

    // Moderation
    reports: {
        type: Number,
        default: 0,
        min: 0
    },
    isModerated: {
        type: Boolean,
        default: false,
        index: true
    },
    isHidden: {
        type: Boolean,
        default: false,
        index: true
    },
    moderationFlags: {
        type: [String],
        default: []
    },
    moderatedAt: Date,
    moderatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    moderationReason: {
        type: String,
        trim: true
    },

    // Status
    isEdited: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },

    editedAt: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ==================== INDEXES ====================

// Compound indexes for common queries
PostSchema.index({ userId: 1, createdAt: -1 }); // User's posts
PostSchema.index({ createdAt: -1 }); // Feed (newest first)
PostSchema.index({ likes: -1, createdAt: -1 }); // Popular posts
PostSchema.index({ isHidden: 1, isDeleted: 1, createdAt: -1 }); // Visible posts
PostSchema.index({ reports: -1 }); // Posts needing moderation

// ==================== VIRTUAL FIELDS ====================

// User details (populate)
PostSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

// Engagement rate calculation
PostSchema.virtual('engagementRate').get(function () {
    if (this.views === 0) return 0;
    const totalEngagement = this.likes + this.comments + this.shares + this.saves;
    return ((totalEngagement / this.views) * 100).toFixed(2);
});

// Total reactions count
PostSchema.virtual('totalReactions').get(function () {
    let total = 0;
    if (this.reactions) {
        this.reactions.forEach((count: number) => {
            total += count;
        });
    }
    return total;
});

// ==================== INSTANCE METHODS ====================

/**
 * Increment a metric counter
 */
PostSchema.methods.incrementMetric = async function (
    metric: 'likes' | 'comments' | 'shares' | 'views' | 'saves',
    amount: number = 1
) {
    this[metric] += amount;
    await this.save();
    return this;
};

/**
 * Add a reaction to the post
 */
PostSchema.methods.addReaction = async function (emoji: string) {
    const currentCount = this.reactions.get(emoji) || 0;
    this.reactions.set(emoji, currentCount + 1);
    await this.save();
    return this;
};

/**
 * Remove a reaction from the post
 */
PostSchema.methods.removeReaction = async function (emoji: string) {
    const currentCount = this.reactions.get(emoji) || 0;
    if (currentCount > 0) {
        this.reactions.set(emoji, currentCount - 1);

        // Remove emoji if count reaches 0
        if (currentCount - 1 === 0) {
            this.reactions.delete(emoji);
        }

        await this.save();
    }
    return this;
};

/**
 * Hide post (moderation)
 */
PostSchema.methods.hide = async function (
    reason: string,
    moderatorId: Types.ObjectId
) {
    this.isHidden = true;
    this.isModerated = true;
    this.moderationReason = reason;
    this.moderatedBy = moderatorId;
    this.moderatedAt = new Date();
    await this.save();
    return this;
};

// ==================== STATIC METHODS ====================

/**
 * Get feed for a user (posts from people they follow)
 */
PostSchema.statics.getFeed = function (
    userIds: Types.ObjectId[],
    page: number = 1,
    limit: number = 20
): Promise<PostDocument[]> {
    return this.find({
        userId: { $in: userIds },
        isHidden: false,
        isDeleted: false
    })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'name college profilePhotoUrl isVerified verifiedBadge')
        .exec();
};

/**
 * Get trending posts
 */
PostSchema.statics.getTrending = function (hours: number = 24, limit: number = 20): Promise<PostDocument[]> {
    const timeAgo = new Date();
    timeAgo.setHours(timeAgo.getHours() - hours);

    return this.find({
        createdAt: { $gte: timeAgo },
        isHidden: false,
        isDeleted: false
    })
        .sort({ likes: -1, views: -1 })
        .limit(limit)
        .populate('userId', 'name college profilePhotoUrl isVerified verifiedBadge')
        .exec();
};

/**
 * Get user's posts
 */
PostSchema.statics.getUserPosts = function (
    userId: Types.ObjectId,
    page: number = 1,
    limit: number = 20
): Promise<PostDocument[]> {
    return this.find({
        userId,
        isDeleted: false
    })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
};

// ==================== MIDDLEWARE (HOOKS) ====================

/**
 * Pre-save middleware
 */
PostSchema.pre('save', function (next) {
    // Set editedAt if content was modified
    if (this.isModified('content') && !this.isNew) {
        this.isEdited = true;
        this.editedAt = new Date();
    }

    next();
});

/**
 * Post-save middleware
 */
PostSchema.post('save', async function (doc) {
    // Update user's post count
    if (doc.isNew && !doc.isDeleted) {
        await mongoose.model('User').findByIdAndUpdate(
            doc.userId,
            { $inc: { 'stats.postsCount': 1 } }
        );
    }
});

/**
 * Post-delete middleware
 */
PostSchema.post('deleteOne', { document: true, query: false }, async function () {
    // Decrement user's post count
    await mongoose.model('User').findByIdAndUpdate(
        this.userId,
        { $inc: { 'stats.postsCount': -1 } }
    );
});

// ==================== MODEL ====================

export type PostModel = Model<PostDocument> & {
    getFeed(userIds: Types.ObjectId[], page?: number, limit?: number): Promise<PostDocument[]>;
    getTrending(hours?: number, limit?: number): Promise<PostDocument[]>;
    getUserPosts(userId: Types.ObjectId, page?: number, limit?: number): Promise<PostDocument[]>;
};

const Post = mongoose.model<PostDocument, PostModel>('Post', PostSchema);

export default Post;
