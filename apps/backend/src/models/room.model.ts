import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ==================== TYPES ====================

export type RoomDocument = Document & {
    name: string;
    description?: string;

    // Privacy
    isPrivate: boolean;
    password?: string; // Hashed password

    // Media
    logoUrl?: string;

    // Members
    creatorId: Types.ObjectId;
    admins: Types.ObjectId[];
    members: Types.ObjectId[];
    membersCount: number;

    // Temporary Rooms
    isTemporary: boolean;
    endsAt?: Date;

    // Status
    isActive: boolean;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;

    // Methods
    addMember(userId: Types.ObjectId): Promise<RoomDocument>;
    removeMember(userId: Types.ObjectId): Promise<RoomDocument>;
    addAdmin(userId: Types.ObjectId): Promise<RoomDocument>;
    removeAdmin(userId: Types.ObjectId): Promise<RoomDocument>;
    isAdmin(userId: Types.ObjectId): boolean;
    isMember(userId: Types.ObjectId): boolean;
    checkExpiry(): Promise<boolean>;
};

// ==================== SCHEMA ====================

const RoomSchema = new Schema<RoomDocument>({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
        index: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },

    // Privacy
    isPrivate: {
        type: Boolean,
        default: false,
        index: true
    },
    password: {
        type: String,
        select: false // Don't include in queries by default
    },

    // Media
    logoUrl: String,

    // Members
    creatorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    admins: {
        type: [Schema.Types.ObjectId],
        ref: 'User',
        default: []
    },
    members: {
        type: [Schema.Types.ObjectId],
        ref: 'User',
        default: [],
        index: true
    },
    membersCount: {
        type: Number,
        default: 0,
        min: 0
    },

    // Temporary Rooms
    isTemporary: {
        type: Boolean,
        default: false,
        index: true
    },
    endsAt: {
        type: Date,
        index: true
    },

    // Status
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ==================== INDEXES ====================

// Compound indexes for common queries
RoomSchema.index({ isPrivate: 1, isActive: 1, createdAt: -1 }); // Public active rooms
RoomSchema.index({ isTemporary: 1, endsAt: 1 }); // Temporary rooms cleanup
RoomSchema.index({ members: 1, isActive: 1 }); // User's rooms

// ==================== VIRTUAL FIELDS ====================

// Creator details (populate)
RoomSchema.virtual('creator', {
    ref: 'User',
    localField: 'creatorId',
    foreignField: '_id',
    justOne: true
});

// Check if room is expired
RoomSchema.virtual('isExpired').get(function () {
    if (!this.isTemporary || !this.endsAt) return false;
    return new Date() > this.endsAt;
});

// ==================== INSTANCE METHODS ====================

/**
 * Add a member to the room
 */
RoomSchema.methods.addMember = async function (userId: Types.ObjectId) {
    if (!this.members.some((id: Types.ObjectId) => id.equals(userId))) {
        this.members.push(userId);
        this.membersCount += 1;
        await this.save();
    }
    return this;
};

/**
 * Remove a member from the room
 */
RoomSchema.methods.removeMember = async function (userId: Types.ObjectId) {
    const index = this.members.findIndex((id: Types.ObjectId) => id.equals(userId));
    if (index !== -1) {
        this.members.splice(index, 1);
        this.membersCount -= 1;

        // Also remove from admins if they were one
        const adminIndex = this.admins.findIndex((id: Types.ObjectId) => id.equals(userId));
        if (adminIndex !== -1) {
            this.admins.splice(adminIndex, 1);
        }

        await this.save();
    }
    return this;
};

/**
 * Add an admin to the room
 */
RoomSchema.methods.addAdmin = async function (userId: Types.ObjectId) {
    // Must be a member first
    if (!this.members.some((id: Types.ObjectId) => id.equals(userId))) {
        await this.addMember(userId);
    }

    if (!this.admins.some((id: Types.ObjectId) => id.equals(userId))) {
        this.admins.push(userId);
        await this.save();
    }
    return this;
};

/**
 * Remove an admin from the room
 */
RoomSchema.methods.removeAdmin = async function (userId: Types.ObjectId) {
    // Cannot remove the creator
    if (userId.equals(this.creatorId)) {
        throw new Error('Cannot remove creator as admin');
    }

    const index = this.admins.findIndex((id: Types.ObjectId) => id.equals(userId));
    if (index !== -1) {
        this.admins.splice(index, 1);
        await this.save();
    }
    return this;
};

/**
 * Check if user is an admin
 */
RoomSchema.methods.isAdmin = function (userId: Types.ObjectId): boolean {
    return this.admins.some((id: Types.ObjectId) => id.equals(userId)) ||
        userId.equals(this.creatorId);
};

/**
 * Check if user is a member
 */
RoomSchema.methods.isMember = function (userId: Types.ObjectId): boolean {
    return this.members.some((id: Types.ObjectId) => id.equals(userId));
};

/**
 * Check if room is expired and deactivate if needed
 */
RoomSchema.methods.checkExpiry = async function (): Promise<boolean> {
    if (this.isTemporary && this.endsAt && new Date() > this.endsAt) {
        this.isActive = false;
        await this.save();
        return true;
    }
    return false;
};

// ==================== STATIC METHODS ====================

/**
 * Get public active rooms
 */
RoomSchema.statics.getPublicRooms = function (
    page: number = 1,
    limit: number = 20
): Promise<RoomDocument[]> {
    return this.find({
        isPrivate: false,
        isActive: true
    })
        .sort({ membersCount: -1, createdAt: -1 }) // Popular first
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('creatorId', 'name college profilePhotoUrl isVerified verifiedBadge')
        .exec();
};

/**
 * Get user's rooms
 */
RoomSchema.statics.getUserRooms = function (
    userId: Types.ObjectId,
    page: number = 1,
    limit: number = 20
): Promise<RoomDocument[]> {
    return this.find({
        members: userId,
        isActive: true
    })
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('creatorId', 'name college profilePhotoUrl')
        .exec();
};

/**
 * Get rooms created by user
 */
RoomSchema.statics.getCreatedRooms = function (
    userId: Types.ObjectId,
    page: number = 1,
    limit: number = 20
): Promise<RoomDocument[]> {
    return this.find({
        creatorId: userId
    })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
};

/**
 * Create a room
 */
RoomSchema.statics.createRoom = async function (
    creatorId: Types.ObjectId,
    name: string,
    options: {
        description?: string;
        isPrivate?: boolean;
        password?: string;
        logoUrl?: string;
        isTemporary?: boolean;
        endsAt?: Date;
    } = {}
) {
    const room = await this.create({
        name,
        description: options.description,
        isPrivate: options.isPrivate || false,
        password: options.password, // Should be hashed before passing
        logoUrl: options.logoUrl,
        isTemporary: options.isTemporary || false,
        endsAt: options.endsAt,
        creatorId,
        admins: [creatorId],
        members: [creatorId],
        membersCount: 1,
        isActive: true
    });

    return room;
};

/**
 * Search rooms by name
 */
RoomSchema.statics.searchRooms = function (
    searchQuery: string,
    page: number = 1,
    limit: number = 20
): Promise<RoomDocument[]> {
    return this.find({
        name: { $regex: searchQuery, $options: 'i' },
        isPrivate: false,
        isActive: true
    })
        .sort({ membersCount: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('creatorId', 'name college profilePhotoUrl')
        .exec();
};

/**
 * Cleanup expired temporary rooms
 */
RoomSchema.statics.cleanupExpired = async function (): Promise<number> {
    const now = new Date();
    const result = await this.updateMany(
        {
            isTemporary: true,
            endsAt: { $lt: now },
            isActive: true
        },
        {
            $set: { isActive: false }
        }
    );

    return result.modifiedCount;
};

// ==================== MIDDLEWARE (HOOKS) ====================

/**
 * Pre-save middleware
 */
RoomSchema.pre('save', function (next) {
    // Ensure creator is always in members and admins
    if (!this.members.some((id: Types.ObjectId) => id.equals(this.creatorId))) {
        this.members.push(this.creatorId);
    }
    if (!this.admins.some((id: Types.ObjectId) => id.equals(this.creatorId))) {
        this.admins.push(this.creatorId);
    }

    // Update members count
    this.membersCount = this.members.length;

    next();
});

/**
 * Post-delete middleware
 */
RoomSchema.post('deleteOne', { document: true, query: false }, async function () {
    // Delete all messages in this room
    await mongoose.model('RoomMessage').deleteMany({ roomId: this._id });
});

// ==================== MODEL ====================

export type RoomModel = Model<RoomDocument> & {
    getPublicRooms(page?: number, limit?: number): Promise<RoomDocument[]>;
    getUserRooms(userId: Types.ObjectId, page?: number, limit?: number): Promise<RoomDocument[]>;
    getCreatedRooms(userId: Types.ObjectId, page?: number, limit?: number): Promise<RoomDocument[]>;
    createRoom(
        creatorId: Types.ObjectId,
        name: string,
        options?: {
            description?: string;
            isPrivate?: boolean;
            password?: string;
            logoUrl?: string;
            isTemporary?: boolean;
            endsAt?: Date;
        }
    ): Promise<RoomDocument>;
    searchRooms(searchQuery: string, page?: number, limit?: number): Promise<RoomDocument[]>;
    cleanupExpired(): Promise<number>;
};

const Room = mongoose.model<RoomDocument, RoomModel>('Room', RoomSchema);

export default Room;
