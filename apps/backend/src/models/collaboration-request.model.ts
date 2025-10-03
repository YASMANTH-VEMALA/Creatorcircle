import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ==================== TYPES ====================

export type CollaborationStatus = 'pending' | 'accepted' | 'rejected';

export type CollaborationRequestDocument = Document & {
    senderId: Types.ObjectId;
    receiverId: Types.ObjectId;

    // Cached sender data for performance
    senderName: string;
    senderAvatar?: string;
    senderCollege?: string;

    // Request Details
    message: string;

    // Status
    status: CollaborationStatus;

    // Timestamps
    createdAt: Date;
    respondedAt?: Date;

    // Methods
    accept(): Promise<CollaborationRequestDocument>;
    reject(): Promise<CollaborationRequestDocument>;
};

// ==================== SCHEMA ====================

const CollaborationRequestSchema = new Schema<CollaborationRequestDocument>({
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    receiverId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Cached sender data
    senderName: {
        type: String,
        required: true,
        trim: true
    },
    senderAvatar: String,
    senderCollege: String,

    // Request Details
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },

    // Status
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
        index: true
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    respondedAt: Date
}, {
    timestamps: false // We use custom createdAt and respondedAt
});

// ==================== INDEXES ====================

// Compound indexes for common queries
CollaborationRequestSchema.index({ senderId: 1, receiverId: 1 }); // Check for existing request
CollaborationRequestSchema.index({ receiverId: 1, status: 1, createdAt: -1 }); // Received requests
CollaborationRequestSchema.index({ senderId: 1, status: 1, createdAt: -1 }); // Sent requests

// ==================== VIRTUAL FIELDS ====================

// Sender details (populate)
CollaborationRequestSchema.virtual('sender', {
    ref: 'User',
    localField: 'senderId',
    foreignField: '_id',
    justOne: true
});

// Receiver details (populate)
CollaborationRequestSchema.virtual('receiver', {
    ref: 'User',
    localField: 'receiverId',
    foreignField: '_id',
    justOne: true
});

// Check if request is pending
CollaborationRequestSchema.virtual('isPending').get(function () {
    return this.status === 'pending';
});

// ==================== INSTANCE METHODS ====================

/**
 * Accept the collaboration request
 */
CollaborationRequestSchema.methods.accept = async function () {
    if (this.status !== 'pending') {
        throw new Error('Request has already been responded to');
    }

    this.status = 'accepted';
    this.respondedAt = new Date();
    await this.save();

    // Update connection counts
    await Promise.all([
        mongoose.model('User').findByIdAndUpdate(
            this.senderId,
            { $inc: { 'stats.connectionsCount': 1, 'xp.xp': 15 } }
        ),
        mongoose.model('User').findByIdAndUpdate(
            this.receiverId,
            { $inc: { 'stats.connectionsCount': 1, 'xp.xp': 15 } }
        )
    ]);

    return this;
};

/**
 * Reject the collaboration request
 */
CollaborationRequestSchema.methods.reject = async function () {
    if (this.status !== 'pending') {
        throw new Error('Request has already been responded to');
    }

    this.status = 'rejected';
    this.respondedAt = new Date();
    await this.save();

    return this;
};

// ==================== STATIC METHODS ====================

/**
 * Send a collaboration request
 */
CollaborationRequestSchema.statics.sendRequest = async function (
    senderId: Types.ObjectId,
    receiverId: Types.ObjectId,
    message: string
) {
    // Cannot send request to yourself
    if (senderId.equals(receiverId)) {
        throw new Error('Cannot send collaboration request to yourself');
    }

    // Check if request already exists
    const existingRequest = await this.findOne({
        senderId,
        receiverId,
        status: 'pending'
    });

    if (existingRequest) {
        throw new Error('Pending collaboration request already exists');
    }

    // Get sender details
    const sender = await mongoose.model('User').findById(senderId);
    if (!sender) {
        throw new Error('Sender not found');
    }

    // Get receiver to verify they exist
    const receiver = await mongoose.model('User').findById(receiverId);
    if (!receiver) {
        throw new Error('Receiver not found');
    }

    // Create request
    const request = await this.create({
        senderId,
        receiverId,
        senderName: sender.name,
        senderAvatar: sender.profilePhotoUrl,
        senderCollege: sender.college,
        message,
        status: 'pending'
    });

    // Create notification for receiver
    // Will be implemented when notification service is ready
    // TODO: Implement notification creation

    return request;
};

/**
 * Get received pending requests
 */
CollaborationRequestSchema.statics.getReceivedRequests = function (
    userId: Types.ObjectId,
    status?: CollaborationStatus,
    page: number = 1,
    limit: number = 20
): Promise<CollaborationRequestDocument[]> {
    const query: Record<string, unknown> = { receiverId: userId };

    if (status) {
        query.status = status;
    }

    return this.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('senderId', 'name college profilePhotoUrl isVerified verifiedBadge')
        .exec();
};

/**
 * Get sent requests
 */
CollaborationRequestSchema.statics.getSentRequests = function (
    userId: Types.ObjectId,
    status?: CollaborationStatus,
    page: number = 1,
    limit: number = 20
): Promise<CollaborationRequestDocument[]> {
    const query: Record<string, unknown> = { senderId: userId };

    if (status) {
        query.status = status;
    }

    return this.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('receiverId', 'name college profilePhotoUrl isVerified verifiedBadge')
        .exec();
};

/**
 * Get pending request count for user
 */
CollaborationRequestSchema.statics.getPendingCount = async function (
    userId: Types.ObjectId
): Promise<number> {
    return this.countDocuments({
        receiverId: userId,
        status: 'pending'
    });
};

/**
 * Check if request exists between two users
 */
CollaborationRequestSchema.statics.requestExists = async function (
    senderId: Types.ObjectId,
    receiverId: Types.ObjectId
): Promise<boolean> {
    const request = await this.findOne({
        $or: [
            { senderId, receiverId },
            { senderId: receiverId, receiverId: senderId }
        ],
        status: 'pending'
    });

    return !!request;
};

/**
 * Get all connections for a user (accepted requests)
 */
CollaborationRequestSchema.statics.getUserConnections = async function (
    userId: Types.ObjectId,
    page: number = 1,
    limit: number = 20
): Promise<Types.ObjectId[]> {
    const requests = await this.find({
        $or: [
            { senderId: userId, status: 'accepted' },
            { receiverId: userId, status: 'accepted' }
        ]
    })
        .sort({ respondedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    // Extract the other user's ID from each request
    const connectionIds = requests.map((req: CollaborationRequestDocument) => {
        return req.senderId.equals(userId) ? req.receiverId : req.senderId;
    });

    return connectionIds;
};

/**
 * Delete old rejected requests
 */
CollaborationRequestSchema.statics.cleanupOldRequests = async function (
    daysOld: number = 30
): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.deleteMany({
        status: 'rejected',
        respondedAt: { $lt: cutoffDate }
    });

    return result.deletedCount;
};

// ==================== MIDDLEWARE (HOOKS) ====================

/**
 * Post-save middleware
 */
CollaborationRequestSchema.post('save', async function (doc) {
    // Send notifications when request status changes
    // TODO: Implement notification creation when notification service is ready
    // if (doc.status === 'accepted' && !doc.isNew) { ... }
    // if (doc.status === 'rejected' && !doc.isNew) { ... }
});

// ==================== MODEL ====================

export type CollaborationRequestModel = Model<CollaborationRequestDocument> & {
    sendRequest(
        senderId: Types.ObjectId,
        receiverId: Types.ObjectId,
        message: string
    ): Promise<CollaborationRequestDocument>;

    getReceivedRequests(
        userId: Types.ObjectId,
        status?: CollaborationStatus,
        page?: number,
        limit?: number
    ): Promise<CollaborationRequestDocument[]>;

    getSentRequests(
        userId: Types.ObjectId,
        status?: CollaborationStatus,
        page?: number,
        limit?: number
    ): Promise<CollaborationRequestDocument[]>;

    getPendingCount(userId: Types.ObjectId): Promise<number>;
    requestExists(senderId: Types.ObjectId, receiverId: Types.ObjectId): Promise<boolean>;
    getUserConnections(userId: Types.ObjectId, page?: number, limit?: number): Promise<Types.ObjectId[]>;
    cleanupOldRequests(daysOld?: number): Promise<number>;
};

const CollaborationRequest = mongoose.model<CollaborationRequestDocument, CollaborationRequestModel>(
    'CollaborationRequest',
    CollaborationRequestSchema
);

export default CollaborationRequest;
