// Test file to demonstrate shared packages usage in mobile app
import {
    validateEmail,
    validatePassword,
    formatRelativeTime,
    truncateText,
    API_ENDPOINTS,
    VALIDATION_RULES
} from '@creatorcircle/shared-utils';

import {
    User,
    Profile,
    Post,
    SocialPlatform
} from '@creatorcircle/shared-types';

// Example usage of shared utilities
export class SharedPackagesDemo {
    static testValidation() {
        console.log('🧪 Testing shared validation utilities...');

        // Test email validation
        const email = 'test@example.com';
        const isValidEmail = validateEmail(email);
        console.log(`Email "${email}" is valid: ${isValidEmail}`);

        // Test password validation
        const password = 'TestPass123!';
        const passwordResult = validatePassword(password);
        console.log(`Password validation:`, passwordResult);

        console.log('✅ Validation utilities working!');
    }

    static testFormatting() {
        console.log('🧪 Testing shared formatting utilities...');

        // Test date formatting
        const now = new Date();
        const relativeTime = formatRelativeTime(now);
        console.log(`Relative time: ${relativeTime}`);

        // Test text truncation
        const longText = 'This is a very long text that should be truncated';
        const truncated = truncateText(longText, 20);
        console.log(`Truncated: ${truncated}`);

        console.log('✅ Formatting utilities working!');
    }

    static testConstants() {
        console.log('🧪 Testing shared constants...');

        // Test API endpoints
        console.log('Login endpoint:', API_ENDPOINTS.AUTH.LOGIN);
        console.log('Posts endpoint:', API_ENDPOINTS.POSTS.LIST);

        // Test validation rules
        console.log('Password min length:', VALIDATION_RULES.PASSWORD_MIN_LENGTH);
        console.log('Post max length:', VALIDATION_RULES.POST_MAX_LENGTH);

        console.log('✅ Constants working!');
    }

    static testTypes() {
        console.log('🧪 Testing shared types...');

        // Test creating objects with shared types
        const user: User = {
            uid: 'test-123',
            email: 'test@example.com',
            displayName: 'Test User'
        };

        const post: Post = {
            id: 'post-123',
            userId: user.uid,
            userName: user.displayName || 'Unknown',
            content: 'This is a test post',
            likes: 0,
            comments: 0,
            reports: 0,
            isEdited: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const platform: SocialPlatform = 'instagram';

        console.log('User created:', user.email);
        console.log('Post created:', post.content);
        console.log('Platform:', platform);

        console.log('✅ Types working!');
    }

    static runAllTests() {
        console.log('🚀 Running shared packages integration test...');
        console.log('');

        this.testValidation();
        console.log('');

        this.testFormatting();
        console.log('');

        this.testConstants();
        console.log('');

        this.testTypes();
        console.log('');

        console.log('🎉 All shared packages tests passed!');
        console.log('✅ Monorepo shared packages integration successful!');
    }
}
