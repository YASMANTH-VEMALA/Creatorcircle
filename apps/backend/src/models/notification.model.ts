import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ==================== TYPES ====================

export type NotificationType =
    | 'like'
    | 'comment'
    | 'comment_reply'
    | 'comment_like'
    | 'follow'
    | 'collab_request'
    | 'request_accepted'
    | 'request_rejected'
    | 'message'
    | 'report_warning'
    | 'mention'
    | 'badge_earned'
    | 'level_up';

export type NotificationDocument = Document & {
    type: NotificationType;

    toUserId: Types.ObjectId;
    fromUserId?: Types.ObjectId;

    // Cached sender data for performance
    senderName?: string;
    senderProfilePic?: string;
    senderVerified?: boolean;

    // Related entities
    relatedPostId?: Types.ObjectId;
    relatedCommentId?: Types.ObjectId;
    relatedChatId?: Types.ObjectId;

    // Content
    message: string;
    commentText?: string;

    // Status
    isRead: boolean;

    // Timestamps
    createdAt: Date;
    readAt?: Date;

    // Methods
    markAsRead(): Promise<NotificationDocument>;
};

// ==================== SCHEMA ====================

const NotificationSchema = new Schema<NotificationDocument>({
    type: {
        type: String,
        enum: [
            'like',
            'comment',
            'comment_reply',
            'comment_like',
            'follow',
            'collab_request',
            'request_accepted',
            'request_rejected',
            'message',
            'report_warning',
            'mention',
            'badge_earned',
            'level_up'
        ],
        required: true,
        index: true
    },

    toUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    fromUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },

    // Cached sender data
    senderName: {
        type: String,
        trim: true
    },
    senderProfilePic: String,
    senderVerified: {
        type: Boolean,
        default: false
    },

    // Related entities
    relatedPostId: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        index: true
    },
    relatedCommentId: {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
        index: true
    },
    relatedChatId: {
        type: Schema.Types.ObjectId,
        ref: 'Chat'
    },

    // Content
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    commentText: {
        type: String,
        trim: true,
        maxlength: 200
    },

    // Status
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    readAt: Date
}, {
    timestamps: false // We use custom createdAt
});

// ==================== INDEXES ====================

// Compound indexes for common queries
NotificationSchema.index({ toUserId: 1, isRead: 1, createdAt: -1 }); // Unread notifications
NotificationSchema.index({ toUserId: 1, createdAt: -1 }); // All user notifications
NotificationSchema.index({ toUserId: 1, type: 1, createdAt: -1 }); // Notifications by type

// ==================== VIRTUAL FIELDS ====================

// To user details (populate)
NotificationSchema.virtual('toUser', {
    ref: 'User',
    localField: 'toUserId',
    foreignField: '_id',
    justOne: true
});

// From user details (populate)
NotificationSchema.virtual('fromUser', {
    ref: 'User',
    localField: 'fromUserId',
    foreignField: '_id',
    justOne: true
});

// ==================== INSTANCE METHODS ====================

/**
 * Mark notification as read
 */
NotificationSchema.methods.markAsRead = async function () {
    if (!this.isRead) {
        this.isRead = true;
        this.readAt = new Date();
        await this.save();
    }
    return this;
};

// ==================== STATIC METHODS ====================

/**
 * Create a notification
 */
NotificationSchema.statics.createNotification = async function (
    type: NotificationType,
    toUserId: Types.ObjectId,
    message: string,
    options: {
        fromUserId?: Types.ObjectId;
        senderName?: string;
        senderProfilePic?: string;
        senderVerified?: boolean;
        relatedPostId?: Types.ObjectId;
        relatedCommentId?: Types.ObjectId;
        relatedChatId?: Types.ObjectId;
        commentText?: string;
    } = {}
) {
    const notification = await this.create({
        type,
        toUserId,
        message,
        fromUserId: options.fromUserId,
        senderName: options.senderName,
        senderProfilePic: options.senderProfilePic,
        senderVerified: options.senderVerified,
        relatedPostId: options.relatedPostId,
        relatedCommentId: options.relatedCommentId,
        relatedChatId: options.relatedChatId,
        commentText: options.commentText
    });

    return notification;
};

/**
 * Get user's notifications
 */
NotificationSchema.statics.getUserNotifications = function (
    userId: Types.ObjectId,
    unreadOnly: boolean = false,
    page: number = 1,
    limit: number = 20
): Promise<NotificationDocument[]> {
    const query: Record<string, unknown> = { toUserId: userId };

    if (unreadOnly) {
        query.isRead = false;
    }

    return this.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('fromUserId', 'name profilePhotoUrl isVerified verifiedBadge')
        .exec();
};

/**
 * Get unread notification count
 */
NotificationSchema.statics.getUnreadCount = async function (
    userId: Types.ObjectId
): Promise<number> {
    return this.countDocuments({
        toUserId: userId,
        isRead: false
    });
};

/**
 * Mark all notifications as read for a user
 */
NotificationSchema.statics.markAllAsRead = async function (
    userId: Types.ObjectId
): Promise<number> {
    const result = await this.updateMany(
        {
            toUserId: userId,
            isRead: false
        },
        {
            $set: {
                isRead: true,
                readAt: new Date()
            }
        }
    );

    return result.modifiedCount;
};

/**
 * Mark notifications of a specific type as read
 */
NotificationSchema.statics.markTypeAsRead = async function (
    userId: Types.ObjectId,
    type: NotificationType
): Promise<number> {
    const result = await this.updateMany(
        {
            toUserId: userId,
            type,
            isRead: false
        },
        {
            $set: {
                isRead: true,
                readAt: new Date()
            }
        }
    );

    return result.modifiedCount;
};

/**
 * Delete old read notifications (cleanup)
 */
NotificationSchema.statics.deleteOldNotifications = async function (
    daysOld: number = 30
): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.deleteMany({
        isRead: true,
        readAt: { $lt: cutoffDate }
    });

    return result.deletedCount;
};

/**
 * Get notifications by type
 */
NotificationSchema.statics.getByType = function (
    userId: Types.ObjectId,
    type: NotificationType,
    page: number = 1,
    limit: number = 20
): Promise<NotificationDocument[]> {
    return this.find({
        toUserId: userId,
        type
    })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('fromUserId', 'name profilePhotoUrl isVerified verifiedBadge')
        .exec();
};

// ==================== MIDDLEWARE (HOOKS) ====================

/**
 * Post-save middleware
 */
NotificationSchema.post('save', async function (doc) {
    // Send push notification (will be implemented in notification service)
    if (doc.isNew) {
        // Hook point for push notification service
        // console.log('New notification created:', doc.type);
    }
});

// ==================== MODEL ====================

export type NotificationModel = Model<NotificationDocument> & {
    createNotification(
        type: NotificationType,
        toUserId: Types.ObjectId,
        message: string,
        options?: {
            fromUserId?: Types.ObjectId;
            senderName?: string;
            senderProfilePic?: string;
            senderVerified?: boolean;
            relatedPostId?: Types.ObjectId;
            relatedCommentId?: Types.ObjectId;
            relatedChatId?: Types.ObjectId;
            commentText?: string;
        }
    ): Promise<NotificationDocument>;

    getUserNotifications(
        userId: Types.ObjectId,
        unreadOnly?: boolean,
        page?: number,
        limit?: number
    ): Promise<NotificationDocument[]>;

    getUnreadCount(userId: Types.ObjectId): Promise<number>;
    markAllAsRead(userId: Types.ObjectId): Promise<number>;
    markTypeAsRead(userId: Types.ObjectId, type: NotificationType): Promise<number>;
    deleteOldNotifications(daysOld?: number): Promise<number>;
    getByType(
        userId: Types.ObjectId,
        type: NotificationType,
        page?: number,
        limit?: number
    ): Promise<NotificationDocument[]>;
};

const Notification = mongoose.model<NotificationDocument, NotificationModel>('Notification', NotificationSchema);

export default Notification;
