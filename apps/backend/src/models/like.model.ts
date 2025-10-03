import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ==================== TYPES ====================

export type LikeDocument = Document & {
    userId: Types.ObjectId;
    targetType: 'post' | 'comment';
    targetId: Types.ObjectId;
    createdAt: Date;
};

// ==================== SCHEMA ====================

const LikeSchema = new Schema<LikeDocument>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    targetType: {
        type: String,
        enum: ['post', 'comment'],
        required: true,
        index: true
    },
    targetId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true,
        refPath: 'targetType' // Dynamic reference based on targetType
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: false // We only need createdAt
});

// ==================== INDEXES ====================

// Compound indexes for common queries
LikeSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true }); // Prevent duplicate likes
LikeSchema.index({ targetId: 1, targetType: 1 }); // Count likes for a target
LikeSchema.index({ userId: 1, createdAt: -1 }); // User's like history

// ==================== VIRTUAL FIELDS ====================

// User details (populate)
LikeSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

// ==================== STATIC METHODS ====================

/**
 * Like a post or comment (idempotent)
 */
LikeSchema.statics.likeTarget = async function (
    userId: Types.ObjectId,
    targetType: 'post' | 'comment',
    targetId: Types.ObjectId
): Promise<{ created: boolean; like: LikeDocument }> {
    try {
        const like = await this.create({
            userId,
            targetType,
            targetId
        });

        // Increment like counter on target
        if (targetType === 'post') {
            await mongoose.model('Post').findByIdAndUpdate(
                targetId,
                { $inc: { likes: 1 } }
            );

            // Increment likesReceived for post author
            const post = await mongoose.model('Post').findById(targetId);
            if (post) {
                await mongoose.model('User').findByIdAndUpdate(
                    post.userId,
                    { $inc: { 'stats.likesReceived': 1 } }
                );
            }
        } else if (targetType === 'comment') {
            await mongoose.model('Comment').findByIdAndUpdate(
                targetId,
                { $inc: { likes: 1 } }
            );
        }

        return { created: true, like };
    } catch (error) {
        const err = error as { code?: number };
        // If duplicate key error (11000), like already exists
        if (err.code === 11000) {
            const existingLike = await this.findOne({ userId, targetType, targetId });
            return { created: false, like: existingLike };
        }
        throw error;
    }
};

/**
 * Unlike a post or comment
 */
LikeSchema.statics.unlikeTarget = async function (
    userId: Types.ObjectId,
    targetType: 'post' | 'comment',
    targetId: Types.ObjectId
): Promise<boolean> {
    const result = await this.deleteOne({
        userId,
        targetType,
        targetId
    });

    if (result.deletedCount > 0) {
        // Decrement like counter on target
        if (targetType === 'post') {
            await mongoose.model('Post').findByIdAndUpdate(
                targetId,
                { $inc: { likes: -1 } }
            );

            // Decrement likesReceived for post author
            const post = await mongoose.model('Post').findById(targetId);
            if (post) {
                await mongoose.model('User').findByIdAndUpdate(
                    post.userId,
                    { $inc: { 'stats.likesReceived': -1 } }
                );
            }
        } else if (targetType === 'comment') {
            await mongoose.model('Comment').findByIdAndUpdate(
                targetId,
                { $inc: { likes: -1 } }
            );
        }

        return true;
    }

    return false;
};

/**
 * Check if user has liked a target
 */
LikeSchema.statics.hasLiked = async function (
    userId: Types.ObjectId,
    targetType: 'post' | 'comment',
    targetId: Types.ObjectId
): Promise<boolean> {
    const like = await this.findOne({ userId, targetType, targetId });
    return !!like;
};

/**
 * Get users who liked a target
 */
LikeSchema.statics.getLikers = function (
    targetType: 'post' | 'comment',
    targetId: Types.ObjectId,
    limit: number = 100
): Promise<LikeDocument[]> {
    return this.find({ targetType, targetId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'name college profilePhotoUrl isVerified verifiedBadge')
        .exec();
};

/**
 * Get user's liked posts
 */
LikeSchema.statics.getUserLikedPosts = function (
    userId: Types.ObjectId,
    page: number = 1,
    limit: number = 20
): Promise<LikeDocument[]> {
    return this.find({ userId, targetType: 'post' })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('targetId')
        .exec();
};

// ==================== MODEL ====================

export type LikeModel = Model<LikeDocument> & {
    likeTarget(
        userId: Types.ObjectId,
        targetType: 'post' | 'comment',
        targetId: Types.ObjectId
    ): Promise<{ created: boolean; like: LikeDocument }>;

    unlikeTarget(
        userId: Types.ObjectId,
        targetType: 'post' | 'comment',
        targetId: Types.ObjectId
    ): Promise<boolean>;

    hasLiked(
        userId: Types.ObjectId,
        targetType: 'post' | 'comment',
        targetId: Types.ObjectId
    ): Promise<boolean>;

    getLikers(
        targetType: 'post' | 'comment',
        targetId: Types.ObjectId,
        limit?: number
    ): Promise<LikeDocument[]>;

    getUserLikedPosts(
        userId: Types.ObjectId,
        page?: number,
        limit?: number
    ): Promise<LikeDocument[]>;
};

const Like = mongoose.model<LikeDocument, LikeModel>('Like', LikeSchema);

export default Like;
