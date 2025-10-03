import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

// Detailed health check
router.get('/', async (req: Request, res: Response) => {
    try {
        // Check database connection
        const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

        // Check memory usage
        const memUsage = process.memoryUsage();

        // Check uptime
        const uptime = process.uptime();

        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            service: 'CreatorCircle Backend API',
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            database: {
                status: dbStatus,
                name: mongoose.connection.name || 'unknown'
            },
            system: {
                uptime: `${Math.floor(uptime / 60)} minutes`,
                memory: {
                    used: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
                    total: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`
                },
                nodeVersion: process.version,
                platform: process.platform
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: 'Health check failed'
        });
    }
});

// Simple ping endpoint
router.get('/ping', (req: Request, res: Response) => {
    res.json({
        message: 'pong',
        timestamp: new Date().toISOString()
    });
});

export { router as health_routes };
