import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ==================== TYPES ====================

export type RoomMessageDocument = Document & {
    roomId: Types.ObjectId;
    senderId: Types.ObjectId;

    // Content
    text: string;
    messageType: 'text' | 'image' | 'video' | 'file' | 'system';

    // Media
    mediaUrl?: string;

    // Status
    isDeleted: boolean;

    // Timestamp
    timestamp: Date;

    // Methods
    softDelete(): Promise<RoomMessageDocument>;
};

// ==================== SCHEMA ====================

const RoomMessageSchema = new Schema<RoomMessageDocument>({
    roomId: {
        type: Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
        index: true
    },
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Content
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'video', 'file', 'system'],
        required: true,
        default: 'text'
    },

    // Media
    mediaUrl: String,

    // Status
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },

    // Timestamp
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: false // We use custom timestamp field
});

// ==================== INDEXES ====================

// Compound indexes for common queries
RoomMessageSchema.index({ roomId: 1, timestamp: -1 }); // Room chat history (newest first)
RoomMessageSchema.index({ roomId: 1, timestamp: 1 }); // Room chat history (oldest first)
RoomMessageSchema.index({ roomId: 1, isDeleted: 1, timestamp: -1 }); // Non-deleted messages
RoomMessageSchema.index({ senderId: 1, timestamp: -1 }); // User's room messages

// ==================== VIRTUAL FIELDS ====================

// Sender details (populate)
RoomMessageSchema.virtual('sender', {
    ref: 'User',
    localField: 'senderId',
    foreignField: '_id',
    justOne: true
});

// Room details (populate)
RoomMessageSchema.virtual('room', {
    ref: 'Room',
    localField: 'roomId',
    foreignField: '_id',
    justOne: true
});

// ==================== INSTANCE METHODS ====================

/**
 * Soft delete message
 */
RoomMessageSchema.methods.softDelete = async function () {
    this.isDeleted = true;
    this.text = 'This message was deleted';
    await this.save();
    return this;
};

// ==================== STATIC METHODS ====================

/**
 * Get messages for a room
 */
RoomMessageSchema.statics.getRoomMessages = function (
    roomId: Types.ObjectId,
    page: number = 1,
    limit: number = 100
): Promise<RoomMessageDocument[]> {
    return this.find({
        roomId,
        isDeleted: false
    })
        .sort({ timestamp: -1 }) // Newest first
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('senderId', 'name college profilePhotoUrl isVerified verifiedBadge')
        .exec();
};

/**
 * Send a message to a room
 */
RoomMessageSchema.statics.sendMessage = async function (
    roomId: Types.ObjectId,
    senderId: Types.ObjectId,
    text: string,
    messageType: 'text' | 'image' | 'video' | 'file' | 'system' = 'text',
    mediaUrl?: string
) {
    // Verify user is a member of the room
    const room = await mongoose.model('Room').findById(roomId);
    if (!room) {
        throw new Error('Room not found');
    }

    if (!room.isMember(senderId)) {
        throw new Error('User is not a member of this room');
    }

    const message = await this.create({
        roomId,
        senderId,
        text,
        messageType,
        mediaUrl,
        timestamp: new Date()
    });

    // Update room's updatedAt
    room.updatedAt = new Date();
    await room.save();

    return message;
};

/**
 * Send a system message
 */
RoomMessageSchema.statics.sendSystemMessage = async function (
    roomId: Types.ObjectId,
    text: string
) {
    // Use the room creator as sender for system messages
    const room = await mongoose.model('Room').findById(roomId);
    if (!room) {
        throw new Error('Room not found');
    }

    const message = await this.create({
        roomId,
        senderId: room.creatorId,
        text,
        messageType: 'system',
        timestamp: new Date()
    });

    return message;
};

/**
 * Get user's room messages
 */
RoomMessageSchema.statics.getUserRoomMessages = function (
    userId: Types.ObjectId,
    page: number = 1,
    limit: number = 50
): Promise<RoomMessageDocument[]> {
    return this.find({
        senderId: userId,
        isDeleted: false,
        messageType: { $ne: 'system' }
    })
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('roomId', 'name logoUrl')
        .exec();
};

/**
 * Delete all messages in a room
 */
RoomMessageSchema.statics.deleteRoomMessages = async function (
    roomId: Types.ObjectId
): Promise<number> {
    const result = await this.deleteMany({ roomId });
    return result.deletedCount;
};

/**
 * Get message count for a room
 */
RoomMessageSchema.statics.getRoomMessageCount = async function (
    roomId: Types.ObjectId
): Promise<number> {
    return this.countDocuments({
        roomId,
        isDeleted: false
    });
};

// ==================== MIDDLEWARE (HOOKS) ====================

/**
 * Post-save middleware
 */
RoomMessageSchema.post('save', async function (doc) {
    if (doc.isNew && !doc.isDeleted) {
        // Update room's lastActivity
        await mongoose.model('Room').findByIdAndUpdate(
            doc.roomId,
            { $set: { updatedAt: doc.timestamp } }
        );
    }
});

// ==================== MODEL ====================

export type RoomMessageModel = Model<RoomMessageDocument> & {
    getRoomMessages(roomId: Types.ObjectId, page?: number, limit?: number): Promise<RoomMessageDocument[]>;
    sendMessage(
        roomId: Types.ObjectId,
        senderId: Types.ObjectId,
        text: string,
        messageType?: 'text' | 'image' | 'video' | 'file' | 'system',
        mediaUrl?: string
    ): Promise<RoomMessageDocument>;
    sendSystemMessage(roomId: Types.ObjectId, text: string): Promise<RoomMessageDocument>;
    getUserRoomMessages(userId: Types.ObjectId, page?: number, limit?: number): Promise<RoomMessageDocument[]>;
    deleteRoomMessages(roomId: Types.ObjectId): Promise<number>;
    getRoomMessageCount(roomId: Types.ObjectId): Promise<number>;
};

const RoomMessage = mongoose.model<RoomMessageDocument, RoomMessageModel>('RoomMessage', RoomMessageSchema);

export default RoomMessage;
