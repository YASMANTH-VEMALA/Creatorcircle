import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { authRoutes } from './routes/auth';
import user_routes from './routes/users';
import post_routes from './routes/posts';
import { health_routes } from './routes/health';
import spotlight_routes from './routes/spotlight';
import notification_routes from './routes/notifications';
import chat_routes from './routes/chats';
import message_routes from './routes/messages';
import comment_routes from './routes/comments';
import collaboration_routes from './routes/collaboration';
import room_routes from './routes/rooms';
import room_message_routes from './routes/room-messages';
import location_routes from './routes/locations';
import report_routes from './routes/reports';
import upload_routes from './routes/upload';
import search_routes from './routes/search';


// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', {
    stream: {
        write: (message: string) => {
            logger.info(message.trim());
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'CreatorCircle Backend API',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', user_routes);
app.use('/api/v1/posts', post_routes);
app.use('/api/v1/health', health_routes);
app.use('/api/v1/spotlight', spotlight_routes);
app.use('/api/v1/notifications', notification_routes);
app.use('/api/v1/chats', chat_routes);
app.use('/api/v1/messages', message_routes);
app.use('/api/v1/comments', comment_routes);
app.use('/api/v1/collaborations', collaboration_routes);
app.use('/api/v1/rooms', room_routes);
app.use('/api/v1/room-messages', room_message_routes);
app.use('/api/v1/locations', location_routes);
app.use('/api/v1/reports', report_routes);
app.use('/api/v1/upload', upload_routes);
app.use('/api/v1/search', search_routes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'CreatorCircle Backend API',
        version: '1.0.0',
        documentation: '/api/docs',
        health: '/health'
    });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer() {
    try {
        // Connect to database
        await connectDB();

        // Start HTTP server
        app.listen(PORT, () => {
            logger.info(`🚀 CreatorCircle Backend API Server started`);
            logger.info(`📍 Server running on port ${PORT}`);
            logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
            logger.info(`📡 API base URL: http://localhost:${PORT}/api`);
        });
    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Start the server
startServer();

export default app;
