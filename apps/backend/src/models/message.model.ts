import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ==================== TYPES ====================

export type MessageDocument = Document & {
    chatId: Types.ObjectId;
    senderId: Types.ObjectId;
    receiverId: Types.ObjectId;

    // Content
    text: string;
    messageType: 'text' | 'image' | 'video' | 'file';

    // Media (AWS S3 URLs)
    mediaUrl?: string;
    fileName?: string;
    fileSize?: number;

    // Status
    isSeen: boolean;
    isEdited: boolean;
    isDeleted: boolean;

    // Timestamps
    timestamp: Date;
    seenAt?: Date;
    editedAt?: Date;

    // Methods
    markAsSeen(): Promise<MessageDocument>;
    edit(newText: string): Promise<MessageDocument>;
    softDelete(): Promise<MessageDocument>;
    updateChatLastMessage(): Promise<void>;
};

// ==================== SCHEMA ====================

const MessageSchema = new Schema<MessageDocument>({
    chatId: {
        type: Schema.Types.ObjectId,
        ref: 'Chat',
        required: true,
        index: true
    },
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

    // Content
    text: {
        type: String,
        trim: true,
        maxlength: 5000
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'video', 'file'],
        required: true,
        default: 'text'
    },

    // Media
    mediaUrl: String,
    fileName: {
        type: String,
        trim: true
    },
    fileSize: {
        type: Number,
        min: 0
    },

    // Status
    isSeen: {
        type: Boolean,
        default: false,
        index: true
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },

    // Timestamps
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    seenAt: Date,
    editedAt: Date
}, {
    timestamps: false // We use custom timestamp field
});

// ==================== INDEXES ====================

// Compound indexes for common queries
MessageSchema.index({ chatId: 1, timestamp: -1 }); // Chat history (newest first)
MessageSchema.index({ chatId: 1, timestamp: 1 }); // Chat history (oldest first)
MessageSchema.index({ receiverId: 1, isSeen: 1 }); // Unread messages
MessageSchema.index({ senderId: 1, timestamp: -1 }); // Sender's messages
MessageSchema.index({ chatId: 1, isDeleted: 1, timestamp: -1 }); // Non-deleted messages

// ==================== VIRTUAL FIELDS ====================

// Sender details (populate)
MessageSchema.virtual('sender', {
    ref: 'User',
    localField: 'senderId',
    foreignField: '_id',
    justOne: true
});

// Receiver details (populate)
MessageSchema.virtual('receiver', {
    ref: 'User',
    localField: 'receiverId',
    foreignField: '_id',
    justOne: true
});

// Chat details (populate)
MessageSchema.virtual('chat', {
    ref: 'Chat',
    localField: 'chatId',
    foreignField: '_id',
    justOne: true
});

// ==================== INSTANCE METHODS ====================

/**
 * Mark message as seen
 */
MessageSchema.methods.markAsSeen = async function () {
    if (!this.isSeen) {
        this.isSeen = true;
        this.seenAt = new Date();
        await this.save();
    }
    return this;
};

/**
 * Edit message text
 */
MessageSchema.methods.edit = async function (newText: string) {
    if (this.messageType === 'text') {
        this.text = newText;
        this.isEdited = true;
        this.editedAt = new Date();
        await this.save();

        // Update chat's last message if this was the last message
        await this.updateChatLastMessage();
    }
    return this;
};

/**
 * Soft delete message
 */
MessageSchema.methods.softDelete = async function () {
    this.isDeleted = true;
    this.text = 'This message was deleted';
    await this.save();

    // Update chat's last message if this was the last message
    await this.updateChatLastMessage();
    return this;
};

/**
 * Update chat's last message (helper)
 */
MessageSchema.methods.updateChatLastMessage = async function (): Promise<void> {
    const chat = await mongoose.model('Chat').findById(this.chatId);
    if (!chat) return;

    // Check if this message is the last message in the chat
    const lastMessage = await mongoose.model('Message')
        .findOne({ chatId: this.chatId })
        .sort({ timestamp: -1 });

    if (lastMessage && lastMessage._id.equals(this._id)) {
        await chat.updateLastMessage({
            content: this.text,
            senderId: this.senderId,
            messageType: this.messageType,
            timestamp: this.timestamp
        });
    }
};

// ==================== STATIC METHODS ====================

/**
 * Get messages for a chat
 */
MessageSchema.statics.getChatMessages = function (
    chatId: Types.ObjectId,
    page: number = 1,
    limit: number = 50
): Promise<MessageDocument[]> {
    return this.find({
        chatId,
        isDeleted: false
    })
        .sort({ timestamp: -1 }) // Newest first
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('senderId', 'name profilePhotoUrl isVerified')
        .exec();
};

/**
 * Get unread messages for a user
 */
MessageSchema.statics.getUnreadMessages = function (
    userId: Types.ObjectId,
    chatId?: Types.ObjectId
): Promise<MessageDocument[]> {
    const query: Record<string, unknown> = {
        receiverId: userId,
        isSeen: false,
        isDeleted: false
    };

    if (chatId) {
        query.chatId = chatId;
    }

    return this.find(query)
        .sort({ timestamp: -1 })
        .populate('senderId', 'name profilePhotoUrl')
        .exec();
};

/**
 * Get unread message count for a user
 */
MessageSchema.statics.getUnreadCount = async function (
    userId: Types.ObjectId,
    chatId?: Types.ObjectId
): Promise<number> {
    const query: Record<string, unknown> = {
        receiverId: userId,
        isSeen: false,
        isDeleted: false
    };

    if (chatId) {
        query.chatId = chatId;
    }

    return this.countDocuments(query);
};

/**
 * Mark all messages in a chat as seen
 */
MessageSchema.statics.markChatAsSeen = async function (
    chatId: Types.ObjectId,
    userId: Types.ObjectId
): Promise<number> {
    const result = await this.updateMany(
        {
            chatId,
            receiverId: userId,
            isSeen: false
        },
        {
            $set: {
                isSeen: true,
                seenAt: new Date()
            }
        }
    );

    return result.modifiedCount;
};

/**
 * Send a message
 */
MessageSchema.statics.sendMessage = async function (
    chatId: Types.ObjectId,
    senderId: Types.ObjectId,
    receiverId: Types.ObjectId,
    text: string,
    messageType: 'text' | 'image' | 'video' | 'file' = 'text',
    mediaUrl?: string,
    fileName?: string,
    fileSize?: number
) {
    const message = await this.create({
        chatId,
        senderId,
        receiverId,
        text,
        messageType,
        mediaUrl,
        fileName,
        fileSize,
        timestamp: new Date()
    });

    // Update chat's last message
    const chat = await mongoose.model('Chat').findById(chatId);
    if (chat) {
        await chat.updateLastMessage({
            content: text,
            senderId,
            messageType,
            timestamp: message.timestamp
        });
    }

    return message;
};

/**
 * Delete all messages in a chat
 */
MessageSchema.statics.deleteChatMessages = async function (
    chatId: Types.ObjectId
): Promise<number> {
    const result = await this.deleteMany({ chatId });
    return result.deletedCount;
};

// ==================== MIDDLEWARE (HOOKS) ====================

/**
 * Post-save middleware
 */
MessageSchema.post('save', async function (doc) {
    // Create message notification for receiver
    if (doc.isNew && !doc.isDeleted) {
        // Notification creation will be handled by the notification service
        // This is just a hook point for future implementation
    }
});

// ==================== MODEL ====================

export type MessageModel = Model<MessageDocument> & {
    getChatMessages(chatId: Types.ObjectId, page?: number, limit?: number): Promise<MessageDocument[]>;
    getUnreadMessages(userId: Types.ObjectId, chatId?: Types.ObjectId): Promise<MessageDocument[]>;
    getUnreadCount(userId: Types.ObjectId, chatId?: Types.ObjectId): Promise<number>;
    markChatAsSeen(chatId: Types.ObjectId, userId: Types.ObjectId): Promise<number>;
    sendMessage(
        chatId: Types.ObjectId,
        senderId: Types.ObjectId,
        receiverId: Types.ObjectId,
        text: string,
        messageType?: 'text' | 'image' | 'video' | 'file',
        mediaUrl?: string,
        fileName?: string,
        fileSize?: number
    ): Promise<MessageDocument>;
    deleteChatMessages(chatId: Types.ObjectId): Promise<number>;
};

const Message = mongoose.model<MessageDocument, MessageModel>('Message', MessageSchema);

export default Message;
