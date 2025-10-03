import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ==================== TYPES ====================

export type UserLocationDocument = Document & {
    userId: Types.ObjectId;

    // Location (GeoJSON for geospatial queries)
    location: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
    };

    // Cached user data for performance
    displayName: string;
    college?: string;
    skills: string[];
    interests: string[];
    verified: boolean;
    photoURL?: string;

    // Status
    isLocationShared: boolean;

    // Timestamp
    lastUpdated: Date;

    // Methods
    updateLocation(longitude: number, latitude: number): Promise<UserLocationDocument>;
    toggleSharing(): Promise<UserLocationDocument>;
};

// ==================== SCHEMA ====================

const UserLocationSchema = new Schema<UserLocationDocument>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },

    // Location - GeoJSON format for MongoDB geospatial queries
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
            validate: {
                validator: function (coords: number[]) {
                    return coords.length === 2 &&
                        coords[0] >= -180 && coords[0] <= 180 && // longitude
                        coords[1] >= -90 && coords[1] <= 90;     // latitude
                },
                message: 'Invalid coordinates. Must be [longitude, latitude]'
            }
        }
    },

    // Cached user data
    displayName: {
        type: String,
        required: true,
        trim: true
    },
    college: {
        type: String,
        trim: true
    },
    skills: {
        type: [String],
        default: []
    },
    interests: {
        type: [String],
        default: []
    },
    verified: {
        type: Boolean,
        default: false
    },
    photoURL: String,

    // Status
    isLocationShared: {
        type: Boolean,
        default: true,
        index: true
    },

    // Timestamp
    lastUpdated: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: false // We use custom lastUpdated field
});

// ==================== INDEXES ====================

// Geospatial index for nearby queries (CRITICAL for performance)
UserLocationSchema.index({ location: '2dsphere' });

// Compound indexes for common queries
UserLocationSchema.index({ isLocationShared: 1, lastUpdated: -1 }); // Active sharers
UserLocationSchema.index({ college: 1, isLocationShared: 1 }); // College-based location sharing

// ==================== VIRTUAL FIELDS ====================

// User details (populate)
UserLocationSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

// Latitude (convenience getter)
UserLocationSchema.virtual('latitude').get(function () {
    return this.location.coordinates[1];
});

// Longitude (convenience getter)
UserLocationSchema.virtual('longitude').get(function () {
    return this.location.coordinates[0];
});

// ==================== INSTANCE METHODS ====================

/**
 * Update user's location
 */
UserLocationSchema.methods.updateLocation = async function (
    longitude: number,
    latitude: number
) {
    this.location.coordinates = [longitude, latitude];
    this.lastUpdated = new Date();
    await this.save();
    return this;
};

/**
 * Toggle location sharing on/off
 */
UserLocationSchema.methods.toggleSharing = async function () {
    this.isLocationShared = !this.isLocationShared;
    this.lastUpdated = new Date();
    await this.save();
    return this;
};

// ==================== STATIC METHODS ====================

/**
 * Update or create user location
 */
UserLocationSchema.statics.updateUserLocation = async function (
    userId: Types.ObjectId,
    longitude: number,
    latitude: number,
    userData: {
        displayName: string;
        college?: string;
        skills?: string[];
        interests?: string[];
        verified?: boolean;
        photoURL?: string;
    }
) {
    const location = await this.findOneAndUpdate(
        { userId },
        {
            $set: {
                location: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                displayName: userData.displayName,
                college: userData.college,
                skills: userData.skills || [],
                interests: userData.interests || [],
                verified: userData.verified || false,
                photoURL: userData.photoURL,
                lastUpdated: new Date()
            }
        },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
        }
    );

    return location;
};

/**
 * Find nearby users
 * @param longitude - Current user longitude
 * @param latitude - Current user latitude
 * @param maxDistance - Maximum distance in meters (default 50000 = 50km)
 * @param limit - Maximum number of results
 */
UserLocationSchema.statics.findNearby = function (
    longitude: number,
    latitude: number,
    maxDistance: number = 50000, // 50km default
    limit: number = 50,
    excludeUserId?: Types.ObjectId
): Promise<UserLocationDocument[]> {
    const query: Record<string, unknown> = {
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                $maxDistance: maxDistance
            }
        },
        isLocationShared: true
    };

    // Exclude current user
    if (excludeUserId) {
        query.userId = { $ne: excludeUserId };
    }

    return this.find(query).limit(limit).exec();
};

/**
 * Find users within a radius
 * @param longitude - Center longitude
 * @param latitude - Center latitude
 * @param radiusInKm - Radius in kilometers
 */
UserLocationSchema.statics.findWithinRadius = function (
    longitude: number,
    latitude: number,
    radiusInKm: number = 50,
    limit: number = 50,
    excludeUserId?: Types.ObjectId
): Promise<UserLocationDocument[]> {
    const radiusInMeters = radiusInKm * 1000;

    const query: Record<string, unknown> = {
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                $maxDistance: radiusInMeters
            }
        },
        isLocationShared: true
    };

    if (excludeUserId) {
        query.userId = { $ne: excludeUserId };
    }

    return this.find(query).limit(limit).exec();
};

/**
 * Find nearby users with matching skills/interests
 */
UserLocationSchema.statics.findNearbyWithMatching = async function (
    longitude: number,
    latitude: number,
    userSkills: string[],
    userInterests: string[],
    maxDistance: number = 50000,
    limit: number = 50,
    excludeUserId?: Types.ObjectId
): Promise<UserLocationDocument[]> {
    // Get nearby users first
    const query: Record<string, unknown> = {
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                $maxDistance: maxDistance
            }
        },
        isLocationShared: true
    };

    if (excludeUserId) {
        query.userId = { $ne: excludeUserId };
    }

    const nearbyUsers = await this.find(query).limit(limit * 2).exec();

    // Score users based on skill/interest matches
    type ScoredUser = { user: UserLocationDocument; score: number };

    const scoredUsers: ScoredUser[] = nearbyUsers.map((user: UserLocationDocument) => {
        let score = 0;

        // Match skills (higher weight)
        const skillMatches = user.skills.filter((skill: string) => userSkills.includes(skill));
        score += skillMatches.length * 3;

        // Match interests
        const interestMatches = user.interests.filter((interest: string) => userInterests.includes(interest));
        score += interestMatches.length * 2;

        // Verified users get bonus
        if (user.verified) score += 1;

        return { user, score };
    });

    // Sort by score and return top matches
    return scoredUsers
        .sort((a: ScoredUser, b: ScoredUser) => b.score - a.score)
        .slice(0, limit)
        .map((item: ScoredUser) => item.user);
};

/**
 * Get user's current location
 */
UserLocationSchema.statics.getUserLocation = function (userId: Types.ObjectId): Promise<UserLocationDocument | null> {
    return this.findOne({ userId }).exec();
};

/**
 * Enable location sharing for user
 */
UserLocationSchema.statics.enableSharing = async function (
    userId: Types.ObjectId
): Promise<UserLocationDocument | null> {
    return this.findOneAndUpdate(
        { userId },
        { $set: { isLocationShared: true, lastUpdated: new Date() } },
        { new: true }
    );
};

/**
 * Disable location sharing for user
 */
UserLocationSchema.statics.disableSharing = async function (
    userId: Types.ObjectId
): Promise<UserLocationDocument | null> {
    return this.findOneAndUpdate(
        { userId },
        { $set: { isLocationShared: false, lastUpdated: new Date() } },
        { new: true }
    );
};

/**
 * Delete user's location data
 */
UserLocationSchema.statics.deleteUserLocation = async function (
    userId: Types.ObjectId
): Promise<boolean> {
    const result = await this.deleteOne({ userId });
    return result.deletedCount > 0;
};

/**
 * Cleanup stale locations (not updated in 24 hours)
 */
UserLocationSchema.statics.cleanupStale = async function (
    hoursOld: number = 24
): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursOld);

    const result = await this.deleteMany({
        lastUpdated: { $lt: cutoffDate }
    });

    return result.deletedCount;
};

// ==================== MIDDLEWARE (HOOKS) ====================

/**
 * Pre-save middleware
 */
UserLocationSchema.pre('save', function (next) {
    // Always update lastUpdated on save
    this.lastUpdated = new Date();
    next();
});

// ==================== MODEL ====================

export type UserLocationModel = Model<UserLocationDocument> & {
    updateUserLocation(
        userId: Types.ObjectId,
        longitude: number,
        latitude: number,
        userData: {
            displayName: string;
            college?: string;
            skills?: string[];
            interests?: string[];
            verified?: boolean;
            photoURL?: string;
        }
    ): Promise<UserLocationDocument>;

    findNearby(
        longitude: number,
        latitude: number,
        maxDistance?: number,
        limit?: number,
        excludeUserId?: Types.ObjectId
    ): Promise<UserLocationDocument[]>;

    findWithinRadius(
        longitude: number,
        latitude: number,
        radiusInKm?: number,
        limit?: number,
        excludeUserId?: Types.ObjectId
    ): Promise<UserLocationDocument[]>;

    findNearbyWithMatching(
        longitude: number,
        latitude: number,
        userSkills: string[],
        userInterests: string[],
        maxDistance?: number,
        limit?: number,
        excludeUserId?: Types.ObjectId
    ): Promise<UserLocationDocument[]>;

    getUserLocation(userId: Types.ObjectId): Promise<UserLocationDocument | null>;
    enableSharing(userId: Types.ObjectId): Promise<UserLocationDocument | null>;
    disableSharing(userId: Types.ObjectId): Promise<UserLocationDocument | null>;
    deleteUserLocation(userId: Types.ObjectId): Promise<boolean>;
    cleanupStale(hoursOld?: number): Promise<number>;
};

const UserLocation = mongoose.model<UserLocationDocument, UserLocationModel>('UserLocation', UserLocationSchema);

export default UserLocation;
