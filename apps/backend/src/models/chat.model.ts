import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ==================== TYPES ====================

export type LastMessage = {
    content: string;
    senderId: Types.ObjectId;
    messageType: 'text' | 'image' | 'video' | 'file';
    timestamp: Date;
};

export type ChatDocument = Document & {
    participants: Types.ObjectId[];

    // Group Chat
    isGroupChat: boolean;
    groupName?: string;
    groupIcon?: string;
    admins: Types.ObjectId[];

    // Last Message (for chat list preview)
    lastMessage?: LastMessage;

    // Archive
    isArchived: boolean;
    archivedBy: Types.ObjectId[];

    // Mute
    mutedBy: Types.ObjectId[];

    // Timestamps
    createdAt: Date;
    updatedAt: Date;

    // Methods
    updateLastMessage(message: LastMessage): Promise<ChatDocument>;
    archive(userId: Types.ObjectId): Promise<ChatDocument>;
    unarchive(userId: Types.ObjectId): Promise<ChatDocument>;
    mute(userId: Types.ObjectId): Promise<ChatDocument>;
    unmute(userId: Types.ObjectId): Promise<ChatDocument>;
    addParticipant(userId: Types.ObjectId): Promise<ChatDocument>;
    removeParticipant(userId: Types.ObjectId): Promise<ChatDocument>;
    isParticipant(userId: Types.ObjectId): boolean;
};

// ==================== SCHEMA ====================

const LastMessageSchema = new Schema<LastMessage>({
    content: {
        type: String,
        required: true,
        trim: true
    },
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'video', 'file'],
        required: true
    },
    timestamp: {
        type: Date,
        required: true
    }
}, { _id: false });

const ChatSchema = new Schema<ChatDocument>({
    participants: {
        type: [Schema.Types.ObjectId],
        ref: 'User',
        required: true,
        validate: {
            validator: function (participants: Types.ObjectId[]) {
                return participants.length >= 2;
            },
            message: 'Chat must have at least 2 participants'
        },
        index: true
    },

    // Group Chat
    isGroupChat: {
        type: Boolean,
        default: false,
        index: true
    },
    groupName: {
        type: String,
        trim: true,
        maxlength: 100
    },
    groupIcon: String,
    admins: {
        type: [Schema.Types.ObjectId],
        ref: 'User',
        default: []
    },

    // Last Message
    lastMessage: {
        type: LastMessageSchema,
        default: undefined
    },

    // Archive
    isArchived: {
        type: Boolean,
        default: false,
        index: true
    },
    archivedBy: {
        type: [Schema.Types.ObjectId],
        ref: 'User',
        default: []
    },

    // Mute
    mutedBy: {
        type: [Schema.Types.ObjectId],
        ref: 'User',
        default: []
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ==================== INDEXES ====================

// Compound indexes for common queries
ChatSchema.index({ participants: 1, updatedAt: -1 }); // User's chats
ChatSchema.index({ participants: 1, isArchived: 1, updatedAt: -1 }); // Active chats

// ==================== VIRTUAL FIELDS ====================

// Check if chat is muted for a user (would need userId context)
ChatSchema.virtual('participantsCount').get(function () {
    return this.participants.length;
});

// ==================== INSTANCE METHODS ====================

/**
 * Update last message
 */
ChatSchema.methods.updateLastMessage = async function (message: LastMessage) {
    this.lastMessage = message;
    this.updatedAt = new Date();
    await this.save();
    return this;
};

/**
 * Archive chat for a user
 */
ChatSchema.methods.archive = async function (userId: Types.ObjectId) {
    if (!this.archivedBy.some((id: Types.ObjectId) => id.equals(userId))) {
        this.archivedBy.push(userId);
        await this.save();
    }
    return this;
};

/**
 * Unarchive chat for a user
 */
ChatSchema.methods.unarchive = async function (userId: Types.ObjectId) {
    const index = this.archivedBy.findIndex((id: Types.ObjectId) => id.equals(userId));
    if (index !== -1) {
        this.archivedBy.splice(index, 1);
        await this.save();
    }
    return this;
};

/**
 * Mute chat for a user
 */
ChatSchema.methods.mute = async function (userId: Types.ObjectId) {
    if (!this.mutedBy.some((id: Types.ObjectId) => id.equals(userId))) {
        this.mutedBy.push(userId);
        await this.save();
    }
    return this;
};

/**
 * Unmute chat for a user
 */
ChatSchema.methods.unmute = async function (userId: Types.ObjectId) {
    const index = this.mutedBy.findIndex((id: Types.ObjectId) => id.equals(userId));
    if (index !== -1) {
        this.mutedBy.splice(index, 1);
        await this.save();
    }
    return this;
};

/**
 * Add participant to chat
 */
ChatSchema.methods.addParticipant = async function (userId: Types.ObjectId) {
    if (!this.isGroupChat) {
        throw new Error('Can only add participants to group chats');
    }

    if (!this.participants.some((id: Types.ObjectId) => id.equals(userId))) {
        this.participants.push(userId);
        await this.save();
    }
    return this;
};

/**
 * Remove participant from chat
 */
ChatSchema.methods.removeParticipant = async function (userId: Types.ObjectId) {
    if (!this.isGroupChat) {
        throw new Error('Can only remove participants from group chats');
    }

    const index = this.participants.findIndex((id: Types.ObjectId) => id.equals(userId));
    if (index !== -1) {
        this.participants.splice(index, 1);
        await this.save();
    }
    return this;
};

/**
 * Check if user is a participant
 */
ChatSchema.methods.isParticipant = function (userId: Types.ObjectId): boolean {
    return this.participants.some((id: Types.ObjectId) => id.equals(userId));
};

// ==================== STATIC METHODS ====================

/**
 * Get user's chats
 */
ChatSchema.statics.getUserChats = function (
    userId: Types.ObjectId,
    includeArchived: boolean = false,
    page: number = 1,
    limit: number = 20
): Promise<ChatDocument[]> {
    const query: Record<string, unknown> = {
        participants: userId
    };

    if (!includeArchived) {
        query.archivedBy = { $ne: userId };
    }

    return this.find(query)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('participants', 'name college profilePhotoUrl isVerified')
        .exec();
};

/**
 * Find or create direct chat between two users
 */
ChatSchema.statics.findOrCreateDirectChat = async function (
    userId1: Types.ObjectId,
    userId2: Types.ObjectId
) {
    // Check if chat already exists
    const existingChat = await this.findOne({
        isGroupChat: false,
        participants: { $all: [userId1, userId2], $size: 2 }
    });

    if (existingChat) {
        return existingChat;
    }

    // Create new chat
    const newChat = await this.create({
        participants: [userId1, userId2],
        isGroupChat: false
    });

    return newChat;
};

/**
 * Create group chat
 */
ChatSchema.statics.createGroupChat = async function (
    creatorId: Types.ObjectId,
    participantIds: Types.ObjectId[],
    groupName: string,
    groupIcon?: string
) {
    // Ensure creator is in participants
    const allParticipants = [creatorId, ...participantIds.filter(
        (id: Types.ObjectId) => !id.equals(creatorId)
    )];

    const groupChat = await this.create({
        participants: allParticipants,
        isGroupChat: true,
        groupName,
        groupIcon,
        admins: [creatorId]
    });

    return groupChat;
};

/**
 * Get unread chats count
 */
ChatSchema.statics.getUnreadCount = async function (userId: Types.ObjectId): Promise<number> {
    // This would require checking Message model for unread messages
    const Message = mongoose.model('Message');
    const count = await Message.countDocuments({
        receiverId: userId,
        isSeen: false,
        isDeleted: false
    });

    return count;
};

// ==================== MIDDLEWARE (HOOKS) ====================

/**
 * Pre-save middleware
 */
ChatSchema.pre('save', function (next) {
    // Ensure group chats have a name
    if (this.isGroupChat && !this.groupName) {
        this.groupName = 'Unnamed Group';
    }

    next();
});

// ==================== MODEL ====================

export type ChatModel = Model<ChatDocument> & {
    getUserChats(
        userId: Types.ObjectId,
        includeArchived?: boolean,
        page?: number,
        limit?: number
    ): Promise<ChatDocument[]>;

    findOrCreateDirectChat(
        userId1: Types.ObjectId,
        userId2: Types.ObjectId
    ): Promise<ChatDocument>;

    createGroupChat(
        creatorId: Types.ObjectId,
        participantIds: Types.ObjectId[],
        groupName: string,
        groupIcon?: string
    ): Promise<ChatDocument>;

    getUnreadCount(userId: Types.ObjectId): Promise<number>;
};

const Chat = mongoose.model<ChatDocument, ChatModel>('Chat', ChatSchema);

export default Chat;
