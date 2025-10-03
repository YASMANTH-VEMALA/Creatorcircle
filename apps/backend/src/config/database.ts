import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import { logger } from '../utils/logger';

const MONGODB_URI = process.env.MONGODB_URI || "";
console.log("MONGODB_URI", MONGODB_URI);

export const connectDB = async (): Promise<void> => {
    try {
        logger.info('🔌 Connecting to MongoDB...');

        const conn = await mongoose.connect(MONGODB_URI, {
            // Remove deprecated options, use defaults for Mongoose 7+
        });

        logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
        logger.info(`🗄️ Database: ${conn.connection.name}`);

        // Handle connection events
        mongoose.connection.on('error', (error) => {
            logger.error('❌ MongoDB connection error:', error);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('⚠️ MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('🔄 MongoDB reconnected');
        });

    } catch (error) {
        logger.error('❌ MongoDB connection failed:', error);
        throw error;
    }
};

export const disconnectDB = async (): Promise<void> => {
    try {
        await mongoose.connection.close();
        logger.info('🔌 MongoDB connection closed');
    } catch (error) {
        logger.error('❌ Error closing MongoDB connection:', error);
        throw error;
    }
};
