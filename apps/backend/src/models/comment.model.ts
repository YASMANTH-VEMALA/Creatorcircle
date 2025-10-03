import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ==================== TYPES ====================

export type CommentDocument = Document & {
    postId: Types.ObjectId;
    userId: Types.ObjectId;

    // Content
    content: string;

    // Reply Threading
    replyToCommentId?: Types.ObjectId;
    replyToUserId?: Types.ObjectId;

    // Engagement
    likes: number;
    repliesCount: number;

    // Status
    isEdited: boolean;
    isDeleted: boolean;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    editedAt?: Date;

    // Methods
    incrementLikes(amount?: number): Promise<CommentDocument>;
    incrementReplies(amount?: number): Promise<CommentDocument>;
};

// ==================== SCHEMA ====================

const CommentSchema = new Schema<CommentDocument>({
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
        index: true
    },
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
        maxlength: 1000
    },

    // Reply Threading
    replyToCommentId: {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
        index: true
    },
    replyToUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },

    // Engagement
    likes: {
        type: Number,
        default: 0,
        min: 0
    },
    repliesCount: {
        type: Number,
        default: 0,
        min: 0
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
CommentSchema.index({ postId: 1, createdAt: -1 }); // Post comments (newest first)
CommentSchema.index({ postId: 1, likes: -1 }); // Top comments
CommentSchema.index({ userId: 1, createdAt: -1 }); // User's comments
CommentSchema.index({ replyToCommentId: 1, createdAt: 1 }); // Replies to a comment

// ==================== VIRTUAL FIELDS ====================

// User details (populate)
CommentSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

// Post details (populate)
CommentSchema.virtual('post', {
    ref: 'Post',
    localField: 'postId',
    foreignField: '_id',
    justOne: true
});

// Reply to user details (populate)
CommentSchema.virtual('replyToUser', {
    ref: 'User',
    localField: 'replyToUserId',
    foreignField: '_id',
    justOne: true
});

// Check if this is a top-level comment
CommentSchema.virtual('isTopLevel').get(function () {
    return !this.replyToCommentId;
});

// ==================== INSTANCE METHODS ====================

/**
 * Increment likes counter
 */
CommentSchema.methods.incrementLikes = async function (amount: number = 1) {
    this.likes += amount;
    await this.save();
    return this;
};

/**
 * Increment replies counter
 */
CommentSchema.methods.incrementReplies = async function (amount: number = 1) {
    this.repliesCount += amount;
    await this.save();
    return this;
};

// ==================== STATIC METHODS ====================

/**
 * Get comments for a post
 */
CommentSchema.statics.getPostComments = function (
    postId: Types.ObjectId,
    page: number = 1,
    limit: number = 20
): Promise<CommentDocument[]> {
    return this.find({
        postId,
        replyToCommentId: { $exists: false }, // Top-level comments only
        isDeleted: false
    })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'name college profilePhotoUrl isVerified verifiedBadge')
        .exec();
};

/**
 * Get replies to a comment
 */
CommentSchema.statics.getCommentReplies = function (
    commentId: Types.ObjectId,
    page: number = 1,
    limit: number = 10
): Promise<CommentDocument[]> {
    return this.find({
        replyToCommentId: commentId,
        isDeleted: false
    })
        .sort({ createdAt: 1 }) // Oldest first for replies
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'name college profilePhotoUrl isVerified verifiedBadge')
        .exec();
};

/**
 * Get user's comments
 */
CommentSchema.statics.getUserComments = function (
    userId: Types.ObjectId,
    page: number = 1,
    limit: number = 20
): Promise<CommentDocument[]> {
    return this.find({
        userId,
        isDeleted: false
    })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('postId', 'content')
        .exec();
};

// ==================== MIDDLEWARE (HOOKS) ====================

/**
 * Pre-save middleware
 */
CommentSchema.pre('save', function (next) {
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
CommentSchema.post('save', async function (doc) {
    if (doc.isNew && !doc.isDeleted) {
        // Increment post comment count
        await mongoose.model('Post').findByIdAndUpdate(
            doc.postId,
            { $inc: { comments: 1 } }
        );

        // Increment user's comments received count
        const post = await mongoose.model('Post').findById(doc.postId);
        if (post) {
            await mongoose.model('User').findByIdAndUpdate(
                post.userId,
                { $inc: { 'stats.commentsReceived': 1 } }
            );
        }

        // If this is a reply, increment parent comment's reply count
        if (doc.replyToCommentId) {
            await mongoose.model('Comment').findByIdAndUpdate(
                doc.replyToCommentId,
                { $inc: { repliesCount: 1 } }
            );
        }
    }
});

/**
 * Post-delete middleware
 */
CommentSchema.post('deleteOne', { document: true, query: false }, async function () {
    // Decrement post comment count
    await mongoose.model('Post').findByIdAndUpdate(
        this.postId,
        { $inc: { comments: -1 } }
    );

    // Decrement parent comment reply count if this is a reply
    if (this.replyToCommentId) {
        await mongoose.model('Comment').findByIdAndUpdate(
            this.replyToCommentId,
            { $inc: { repliesCount: -1 } }
        );
    }
});

// ==================== MODEL ====================

export type CommentModel = Model<CommentDocument> & {
    getPostComments(postId: Types.ObjectId, page?: number, limit?: number): Promise<CommentDocument[]>;
    getCommentReplies(commentId: Types.ObjectId, page?: number, limit?: number): Promise<CommentDocument[]>;
    getUserComments(userId: Types.ObjectId, page?: number, limit?: number): Promise<CommentDocument[]>;
};

const Comment = mongoose.model<CommentDocument, CommentModel>('Comment', CommentSchema);

export default Comment;
