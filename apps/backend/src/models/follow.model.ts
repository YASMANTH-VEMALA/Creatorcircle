import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ==================== TYPES ====================

export type FollowDocument = Document & {
    followerId: Types.ObjectId;
    followingId: Types.ObjectId;

    // Cached data for performance
    followerName: string;
    followerCollege?: string;
    followerProfilePic?: string;
    followingName: string;
    followingCollege?: string;
    followingProfilePic?: string;

    followedAt: Date;
};

// ==================== SCHEMA ====================

const FollowSchema = new Schema<FollowDocument>({
    followerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    followingId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Cached follower data
    followerName: {
        type: String,
        required: true
    },
    followerCollege: String,
    followerProfilePic: String,

    // Cached following data
    followingName: {
        type: String,
        required: true
    },
    followingCollege: String,
    followingProfilePic: String,

    followedAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: false // We only need followedAt
});

// ==================== INDEXES ====================

// Compound indexes for common queries
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true }); // Prevent duplicate follows
FollowSchema.index({ followingId: 1, followedAt: -1 }); // Get followers
FollowSchema.index({ followerId: 1, followedAt: -1 }); // Get following

// ==================== VIRTUAL FIELDS ====================

// Follower user details (populate)
FollowSchema.virtual('follower', {
    ref: 'User',
    localField: 'followerId',
    foreignField: '_id',
    justOne: true
});

// Following user details (populate)
FollowSchema.virtual('following', {
    ref: 'User',
    localField: 'followingId',
    foreignField: '_id',
    justOne: true
});

// ==================== STATIC METHODS ====================

/**
 * Follow a user (idempotent)
 */
FollowSchema.statics.followUser = async function (
    followerId: Types.ObjectId,
    followingId: Types.ObjectId
): Promise<{ created: boolean; follow: FollowDocument }> {
    // Prevent self-follow
    if (followerId.equals(followingId)) {
        throw new Error('Cannot follow yourself');
    }

    // Get both user profiles
    const [follower, following] = await Promise.all([
        mongoose.model('User').findById(followerId),
        mongoose.model('User').findById(followingId)
    ]);

    if (!follower) throw new Error('Follower user not found');
    if (!following) throw new Error('Following user not found');

    try {
        const follow = await this.create({
            followerId,
            followingId,
            followerName: follower.name,
            followerCollege: follower.college,
            followerProfilePic: follower.profilePhotoUrl,
            followingName: following.name,
            followingCollege: following.college,
            followingProfilePic: following.profilePhotoUrl
        });

        // Update follower/following counts
        await Promise.all([
            mongoose.model('User').findByIdAndUpdate(
                followerId,
                { $inc: { 'stats.followingCount': 1 } }
            ),
            mongoose.model('User').findByIdAndUpdate(
                followingId,
                {
                    $inc: {
                        'stats.followersCount': 1,
                        'xp.xp': 10 // Award XP for getting followed
                    }
                }
            )
        ]);

        return { created: true, follow };
    } catch (error) {
        const err = error as { code?: number };
        // If duplicate key error (11000), follow already exists
        if (err.code === 11000) {
            const existingFollow = await this.findOne({ followerId, followingId });
            return { created: false, follow: existingFollow };
        }
        throw error;
    }
};

/**
 * Unfollow a user
 */
FollowSchema.statics.unfollowUser = async function (
    followerId: Types.ObjectId,
    followingId: Types.ObjectId
): Promise<boolean> {
    const result = await this.deleteOne({
        followerId,
        followingId
    });

    if (result.deletedCount > 0) {
        // Update follower/following counts
        await Promise.all([
            mongoose.model('User').findByIdAndUpdate(
                followerId,
                { $inc: { 'stats.followingCount': -1 } }
            ),
            mongoose.model('User').findByIdAndUpdate(
                followingId,
                { $inc: { 'stats.followersCount': -1 } }
            )
        ]);

        return true;
    }

    return false;
};

/**
 * Check if user is following another user
 */
FollowSchema.statics.isFollowing = async function (
    followerId: Types.ObjectId,
    followingId: Types.ObjectId
): Promise<boolean> {
    const follow = await this.findOne({ followerId, followingId });
    return !!follow;
};

/**
 * Get user's followers
 */
FollowSchema.statics.getFollowers = function (
    userId: Types.ObjectId,
    page: number = 1,
    limit: number = 20
): Promise<FollowDocument[]> {
    return this.find({ followingId: userId })
        .sort({ followedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('followerId', 'name college profilePhotoUrl isVerified verifiedBadge')
        .exec();
};

/**
 * Get users that a user is following
 */
FollowSchema.statics.getFollowing = function (
    userId: Types.ObjectId,
    page: number = 1,
    limit: number = 20
): Promise<FollowDocument[]> {
    return this.find({ followerId: userId })
        .sort({ followedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('followingId', 'name college profilePhotoUrl isVerified verifiedBadge')
        .exec();
};

/**
 * Get follower IDs (for feed generation)
 */
FollowSchema.statics.getFollowingIds = async function (
    userId: Types.ObjectId
): Promise<Types.ObjectId[]> {
    const follows = await this.find({ followerId: userId }).select('followingId');
    return follows.map((f: FollowDocument) => f.followingId);
};

/**
 * Get mutual followers between two users
 */
FollowSchema.statics.getMutualFollowers = async function (
    userId1: Types.ObjectId,
    userId2: Types.ObjectId
): Promise<FollowDocument[]> {
    // Users that both userId1 and userId2 follow
    const following1 = await this.find({ followerId: userId1 }).select('followingId');
    const following2 = await this.find({ followerId: userId2 }).select('followingId');

    const ids1 = new Set(following1.map((f: FollowDocument) => f.followingId.toString()));
    const ids2 = following2.filter((f: FollowDocument) => ids1.has(f.followingId.toString()));

    if (ids2.length === 0) return [];

    const mutualIds = ids2.map((f: FollowDocument) => f.followingId);
    return this.find({ followingId: { $in: mutualIds } })
        .populate('followingId', 'name college profilePhotoUrl isVerified verifiedBadge')
        .exec();
};

// ==================== MODEL ====================

export type FollowModel = Model<FollowDocument> & {
    followUser(
        followerId: Types.ObjectId,
        followingId: Types.ObjectId
    ): Promise<{ created: boolean; follow: FollowDocument }>;

    unfollowUser(
        followerId: Types.ObjectId,
        followingId: Types.ObjectId
    ): Promise<boolean>;

    isFollowing(
        followerId: Types.ObjectId,
        followingId: Types.ObjectId
    ): Promise<boolean>;

    getFollowers(
        userId: Types.ObjectId,
        page?: number,
        limit?: number
    ): Promise<FollowDocument[]>;

    getFollowing(
        userId: Types.ObjectId,
        page?: number,
        limit?: number
    ): Promise<FollowDocument[]>;

    getFollowingIds(userId: Types.ObjectId): Promise<Types.ObjectId[]>;

    getMutualFollowers(
        userId1: Types.ObjectId,
        userId2: Types.ObjectId
    ): Promise<FollowDocument[]>;
};

const Follow = mongoose.model<FollowDocument, FollowModel>('Follow', FollowSchema);

export default Follow;
