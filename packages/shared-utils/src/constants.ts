// Constants for CreatorCircle application

// API Endpoints (for future backend)
export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password',
        VERIFY_EMAIL: '/auth/verify-email',
    },
    USERS: {
        PROFILE: '/users/profile',
        UPDATE_PROFILE: '/users/profile',
        SEARCH: '/users/search',
        FOLLOW: '/users/follow',
        UNFOLLOW: '/users/unfollow',
        FOLLOWERS: '/users/followers',
        FOLLOWING: '/users/following',
        SUGGESTED: '/users/suggested',
        NEARBY: '/users/nearby',
        DELETE_ACCOUNT: '/users/delete',
    },
    POSTS: {
        LIST: '/posts',
        CREATE: '/posts',
        GET: '/posts/:id',
        UPDATE: '/posts/:id',
        DELETE: '/posts/:id',
        LIKE: '/posts/:id/like',
        UNLIKE: '/posts/:id/unlike',
        REPORT: '/posts/:id/report',
        USER_POSTS: '/posts/user/:userId',
    },
    COMMENTS: {
        LIST: '/comments/post/:postId',
        CREATE: '/comments',
        UPDATE: '/comments/:id',
        DELETE: '/comments/:id',
        LIKE: '/comments/:id/like',
        UNLIKE: '/comments/:id/unlike',
    },
    CHATS: {
        LIST: '/chats',
        CREATE: '/chats',
        GET: '/chats/:id',
        DELETE: '/chats/:id',
        MESSAGES: '/chats/:id/messages',
        SEND_MESSAGE: '/chats/:id/messages',
        MARK_READ: '/chats/:id/read',
    },
    UPLOAD: {
        IMAGE: '/upload/image',
        VIDEO: '/upload/video',
        PROFILE_IMAGE: '/upload/profile-image',
        DELETE: '/upload/:fileKey',
    },
    NOTIFICATIONS: {
        LIST: '/notifications',
        MARK_READ: '/notifications/:id/read',
        DELETE: '/notifications/:id',
        UPDATE_PUSH_TOKEN: '/notifications/push-token',
    },
} as const;

// Validation Rules
export const VALIDATION_RULES = {
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 30,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
    POST_MAX_LENGTH: 2000,
    COMMENT_MAX_LENGTH: 500,
    BIO_MAX_LENGTH: 300,
    COLLEGE_MAX_LENGTH: 100,
    PASSION_MAX_LENGTH: 100,
} as const;

// File Limits
export const FILE_LIMITS = {
    IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
    VIDEO_MAX_SIZE: 100 * 1024 * 1024, // 100MB
    PROFILE_IMAGE_MAX_SIZE: 2 * 1024 * 1024, // 2MB
    SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    SUPPORTED_VIDEO_TYPES: ['video/mp4', 'video/mov', 'video/avi', 'video/webm'],
    MAX_IMAGES_PER_POST: 10,
    MAX_VIDEOS_PER_POST: 3,
} as const;

// App Constants
export const APP_CONSTANTS = {
    APP_NAME: 'CreatorCircle',
    APP_VERSION: '1.0.0',
    MIN_APP_VERSION: '1.0.0',
    API_VERSION: 'v1',
    DEFAULT_TIMEZONE: 'Asia/Kolkata',
    DEFAULT_LANGUAGE: 'en',
    PAGINATION: {
        DEFAULT_LIMIT: 20,
        MAX_LIMIT: 100,
        MIN_LIMIT: 5,
    },
    CACHE: {
        USER_PROFILE_TTL: 5 * 60 * 1000, // 5 minutes
        POSTS_TTL: 2 * 60 * 1000, // 2 minutes
        SEARCH_RESULTS_TTL: 1 * 60 * 1000, // 1 minute
    },
} as const;

// XP System Constants
export const XP_CONSTANTS = {
    ACTIONS: {
        DAILY_LOGIN: 10,
        CREATE_POST: 25,
        RECEIVE_LIKE: 5,
        RECEIVE_COMMENT: 10,
        FOLLOW_USER: 5,
        COMPLETE_PROFILE: 50,
        VERIFY_EMAIL: 25,
        FIRST_COLLABORATION: 100,
    },
    LEVELS: {
        XP_PER_LEVEL: 1000,
        MAX_LEVEL: 100,
        LEVEL_MULTIPLIER: 1.2,
    },
    STREAKS: {
        MAX_STREAK: 365,
        STREAK_XP_MULTIPLIER: 1.5,
        WINDOW_HOURS: 24,
    },
} as const;

// Social Platform Constants
export const SOCIAL_PLATFORMS = {
    YOUTUBE: {
        name: 'YouTube',
        icon: 'logo-youtube',
        color: '#FF0000',
        baseUrl: 'https://youtube.com/',
    },
    INSTAGRAM: {
        name: 'Instagram',
        icon: 'logo-instagram',
        color: '#E4405F',
        baseUrl: 'https://instagram.com/',
    },
    LINKEDIN: {
        name: 'LinkedIn',
        icon: 'logo-linkedin',
        color: '#0077B5',
        baseUrl: 'https://linkedin.com/in/',
    },
    TWITTER: {
        name: 'Twitter',
        icon: 'logo-twitter',
        color: '#1DA1F2',
        baseUrl: 'https://twitter.com/',
    },
    GITHUB: {
        name: 'GitHub',
        icon: 'logo-github',
        color: '#333333',
        baseUrl: 'https://github.com/',
    },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
    SERVER_ERROR: 'Server error. Please try again later.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    FORBIDDEN: 'Access forbidden.',
    NOT_FOUND: 'Resource not found.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    UNKNOWN_ERROR: 'An unexpected error occurred.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
    LOGIN_SUCCESS: 'Successfully logged in!',
    REGISTER_SUCCESS: 'Account created successfully!',
    PROFILE_UPDATED: 'Profile updated successfully!',
    POST_CREATED: 'Post created successfully!',
    POST_DELETED: 'Post deleted successfully!',
    FOLLOW_SUCCESS: 'User followed successfully!',
    UNFOLLOW_SUCCESS: 'User unfollowed successfully!',
    MESSAGE_SENT: 'Message sent successfully!',
} as const;
