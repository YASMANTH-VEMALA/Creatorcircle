// Shared utilities for CreatorCircle monorepo
// Platform-independent utilities for frontend and backend

// Validation utilities
export const validateEmail = (email: string): boolean => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim().toLowerCase());
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!password || typeof password !== 'string') {
        errors.push('Password is required');
        return { isValid: false, errors };
    }

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (!/(?=.*[!@#$%^&*])/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

export const validateUsername = (username: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!username || typeof username !== 'string') {
        errors.push('Username is required');
        return { isValid: false, errors };
    }

    const trimmed = username.trim();

    if (trimmed.length < 3) {
        errors.push('Username must be at least 3 characters long');
    }

    if (trimmed.length > 30) {
        errors.push('Username must be less than 30 characters');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
        errors.push('Username can only contain letters, numbers, underscores, and hyphens');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

// URL and file utilities
export const isValidUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

export const isImageUrl = (url: string): boolean => {
    if (!isValidUrl(url)) return false;
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
    return imageExtensions.test(url) || url.includes('image') || url.includes('photo');
};

export const isVideoUrl = (url: string): boolean => {
    if (!isValidUrl(url)) return false;
    const videoExtensions = /\.(mp4|mov|avi|wmv|flv|webm|mkv)$/i;
    return videoExtensions.test(url) || url.includes('video');
};

export const getFileExtension = (filename: string): string => {
    if (!filename || typeof filename !== 'string') return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

export const generateUniqueId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Text utilities
export const truncateText = (text: string, maxLength: number): string => {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
};

export const capitalizeFirst = (text: string): string => {
    if (!text || typeof text !== 'string') return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const formatMentions = (text: string): string => {
    if (!text) return '';
    return text.replace(/@(\w+)/g, '<mention>@$1</mention>');
};

export const extractHashtags = (text: string): string[] => {
    if (!text) return [];
    const hashtags = text.match(/#[a-zA-Z0-9_]+/g);
    return hashtags ? hashtags.map(tag => tag.toLowerCase()) : [];
};

// Date utilities
export const formatDate = (date: Date): string => {
    if (!date || !(date instanceof Date)) return '';
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export const formatRelativeTime = (date: Date): string => {
    if (!date || !(date instanceof Date)) return '';

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0) return 'in the future';
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;

    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
};

export const isToday = (date: Date): boolean => {
    if (!date || !(date instanceof Date)) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
};

export const isThisWeek = (date: Date): boolean => {
    if (!date || !(date instanceof Date)) return false;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= weekAgo && date <= now;
};

// Number utilities
export const formatNumber = (num: number): string => {
    if (typeof num !== 'number') return '0';

    if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
};

export const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
};

// Array utilities
export const removeDuplicates = <T>(array: T[], key?: keyof T): T[] => {
    if (!Array.isArray(array)) return [];

    if (key) {
        const seen = new Set();
        return array.filter(item => {
            const keyValue = item[key];
            if (seen.has(keyValue)) return false;
            seen.add(keyValue);
            return true;
        });
    }

    return Array.from(new Set(array));
};

export const shuffleArray = <T>(array: T[]): T[] => {
    if (!Array.isArray(array)) return [];
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

export const chunkArray = <T>(array: T[], size: number): T[][] => {
    if (!Array.isArray(array) || size <= 0) return [];
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

// Export constants
export * from './constants';
