/**
 * MongoDB Models Registry
 * 
 * This file provides a centralized access point for all Mongoose models.
 * Access models using the mg.ModelName pattern throughout the application.
 * 
 * @example
 * import mg from '../config/models';
 * 
 * const user = await mg.User.findById(userId);
 * const posts = await mg.Post.find({ userId });
 * const followers = await mg.Follow.getFollowers(userId);
 */

import User from '../models/user.model';
import Post from '../models/post.model';
import Comment from '../models/comment.model';
import Like from '../models/like.model';
import Follow from '../models/follow.model';
import Chat from '../models/chat.model';
import Message from '../models/message.model';
import Notification from '../models/notification.model';
import Room from '../models/room.model';
import RoomMessage from '../models/room-message.model';
import SpotlightPost from '../models/spotlight-post.model';
import UserLocation from '../models/user-location.model';
import Report from '../models/report.model';
import CollaborationRequest from '../models/collaboration-request.model';

// Export all models as a single object
const mg = {
    // Core Models
    User,

    // Social Models
    Post,
    Comment,
    Like,
    Follow,

    // Communication Models
    Chat,
    Message,
    Notification,

    // Feature Models
    Room,
    RoomMessage,
    SpotlightPost,
    UserLocation,

    // Moderation Models
    Report,
    CollaborationRequest
};

// Export all models for type checking (types will be added as models are converted)
export { mg as models };

// ==================== HELPER FUNCTIONS ====================

/**
 * Initialize all models and create indexes
 */
export async function initializeModels(): Promise<void> {
    try {
        console.log('📊 Initializing models and creating indexes...');

        const models = Object.values(mg);
        const indexPromises = models.map(async (model) => {
            if (model.createIndexes) {
                await model.createIndexes();
                console.log(`✅ Indexes created for ${model.modelName}`);
            }
        });

        await Promise.all(indexPromises);
        console.log('✅ All model indexes created successfully');
    } catch (error) {
        console.error('❌ Error initializing models:', error);
        throw error;
    }
}

/**
 * Get model statistics
 */
export async function getModelStats(): Promise<Record<string, number>> {
    const stats: Record<string, number> = {};

    for (const [name, model] of Object.entries(mg)) {
        try {
            stats[name] = await model.countDocuments();
        } catch (error) {
            stats[name] = -1; // Error getting count
        }
    }

    return stats;
}

/**
 * Drop all collections (USE WITH CAUTION - for testing only)
 */
export async function dropAllCollections(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Cannot drop collections in production!');
    }

    try {
        console.warn('⚠️ Dropping all collections...');

        const models = Object.values(mg);
        const dropPromises = models.map(async (model) => {
            try {
                await model.collection.drop();
                console.log(`🗑️ Dropped ${model.modelName} collection`);
            } catch (error) {
                const err = error as { code?: number };
                // Ignore "ns not found" errors (collection doesn't exist)
                if (err.code !== 26) {
                    throw error;
                }
            }
        });

        await Promise.all(dropPromises);
        console.log('✅ All collections dropped');
    } catch (error) {
        console.error('❌ Error dropping collections:', error);
        throw error;
    }
}

// Default export - use mg.ModelName throughout the app
export default mg;

