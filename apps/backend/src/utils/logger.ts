import winston from 'winston';

// Create logger configuration
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        return `${timestamp} [${level}]: ${stack || message}`;
    })
);

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'creatorcircle-backend' },
    transports: [
        // Console transport for development
        new winston.transports.Console({
            format: consoleFormat,
            level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
        }),

        // File transport for all logs
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: logFormat
        }),

        new winston.transports.File({
            filename: 'logs/combined.log',
            format: logFormat
        })
    ],
});

// Create logs directory if it doesn't exist
import { promises as fs } from 'fs';
import path from 'path';

const logsDir = path.join(process.cwd(), 'logs');
fs.mkdir(logsDir, { recursive: true }).catch(() => {
    // Directory might already exist, ignore error
});

// Export logger instance
export default logger;
