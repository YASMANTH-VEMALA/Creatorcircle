# Environment Variables Setup Guide

## 🔐 Overview

CreatorCircle uses environment variables to securely manage API keys, database connections, and configuration settings across the monorepo.

## 📁 Environment Files Structure

```
CreatorCircle/
├── .env                          # Root environment variables (ignored by git)
├── .env.example                  # Empty template (tracked by git)
├── env.template                  # Comprehensive template with examples
└── apps/
    ├── mobile/
    │   └── .env                  # Mobile-specific variables (ignored by git)
    └── backend/
        └── .env                  # Backend-specific variables (ignored by git)
```

## 🚀 Quick Setup

### 1. Copy Template
```bash
# Copy the template to create your .env file
cp env.template .env
```

### 2. Fill in Your Values
Edit `.env` and replace placeholder values with your actual API keys and configuration.

### 3. Mobile App Setup
```bash
# Copy environment variables to mobile app
cp .env apps/mobile/.env
```

### 4. Restart Development Server
```bash
npm run dev
```

## 🔑 Current API Keys

### Perplexity AI (Already Configured)
- **Purpose**: AI Assistant features
- **Location**: `apps/mobile/src/config/apiKeys.ts`
- **Environment Variable**: `PERPLEXITY_API_KEY`
- **Status**: ✅ Working (secured in .env file)

### Firebase (Current Backend)
- **Purpose**: Authentication, database, storage
- **Location**: `apps/mobile/src/config/firebase.ts`
- **Environment Variables**: Multiple Firebase config variables
- **Status**: ✅ Working (will be replaced during migration)

### Google Maps (Placeholder)
- **Purpose**: Location features
- **Environment Variable**: `GOOGLE_MAPS_API_KEY`
- **Status**: ⚠️ Needs actual key for location features

## 🛠️ Environment Variable Usage

### In Mobile App (React Native/Expo)
```typescript
import Constants from 'expo-constants';

// Method 1: Process environment
const apiKey = process.env.PERPLEXITY_API_KEY;

// Method 2: Expo Constants (recommended)
const apiKey = Constants.expoConfig?.extra?.PERPLEXITY_API_KEY;

// Method 3: Fallback pattern
const apiKey = 
  process.env.PERPLEXITY_API_KEY || 
  Constants.expoConfig?.extra?.PERPLEXITY_API_KEY || 
  'fallback-value';
```

### In Backend (Node.js) - Future
```typescript
import dotenv from 'dotenv';
dotenv.config();

const mongoUri = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET;
```

## 📋 Environment Variables List

### **Current (Mobile App)**
| Variable | Purpose | Required | Example |
|----------|---------|----------|---------|
| `PERPLEXITY_API_KEY` | AI features | Yes | `pplx-abc123...` |
| `GOOGLE_MAPS_API_KEY` | Location features | Optional | `AIza...` |
| `EXPO_PROJECT_ID` | Expo services | Yes | `uuid-string` |
| `NODE_ENV` | Environment mode | Yes | `development` |

### **Future (Backend)**
| Variable | Purpose | Required | Example |
|----------|---------|----------|---------|
| `MONGODB_URI` | Database connection | Yes | `mongodb://localhost:27017/creatorcircle` |
| `JWT_SECRET` | Authentication | Yes | `super-secret-key` |
| `AWS_ACCESS_KEY_ID` | File storage | Yes | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | File storage | Yes | `secret-key` |
| `EMAIL_HOST` | Email service | Yes | `smtp.gmail.com` |
| `PORT` | Server port | Yes | `5000` |

## 🔒 Security Best Practices

### ✅ Do's
- ✅ Use `.env` files for local development
- ✅ Use hosting provider's environment variables for production
- ✅ Rotate API keys regularly
- ✅ Use different keys for development, staging, production
- ✅ Monitor API usage and set up alerts

### ❌ Don'ts
- ❌ Never commit `.env` files to version control
- ❌ Never share API keys in chat/email
- ❌ Never use production keys in development
- ❌ Never hardcode API keys in source code
- ❌ Never use weak secrets for JWT tokens

## 🧪 Testing Environment Setup

### Test Mobile App Environment
```bash
cd apps/mobile
npm run start
# Check console for "API key loaded" or similar messages
```

### Test Environment Loading
```typescript
// Add to any mobile app file for testing
console.log('Environment check:', {
  perplexityKey: process.env.PERPLEXITY_API_KEY ? '✅ Loaded' : '❌ Missing',
  nodeEnv: process.env.NODE_ENV || 'Not set',
  expoProjectId: Constants.expoConfig?.extra?.eas?.projectId || 'Not set'
});
```

## 🔄 Environment Management Workflow

### Development
1. Copy `env.template` to `.env`
2. Fill in development API keys
3. Start development server
4. Test functionality

### Staging
1. Use staging-specific API keys
2. Test with production-like data
3. Verify all integrations work

### Production
1. Use production API keys
2. Set environment variables in hosting platform
3. Never use development keys in production
4. Monitor and rotate keys regularly

## 🚨 Troubleshooting

### Common Issues

#### API Key Not Loading
```bash
# Check if .env file exists
ls -la .env

# Check if variables are being read
node -e "console.log(process.env.PERPLEXITY_API_KEY)"
```

#### Expo Constants Not Working
```bash
# Clear Expo cache
npx expo start --clear

# Check app.json extra section
cat apps/mobile/app.json | grep -A 10 "extra"
```

#### Environment Variables Not Updating
```bash
# Restart development server
npm run dev

# Clear all caches
npm run clean && npm install
```

## 📚 Resources

- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [Node.js Environment Variables](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs)
- [dotenv Documentation](https://github.com/motdotla/dotenv)

## 🎯 Next Steps

1. **✅ Environment Setup Complete**: All files created and configured
2. **🔄 Firebase Migration**: Environment variables ready for backend
3. **🚀 Production Setup**: Configure hosting provider environment variables
4. **🔍 Monitoring**: Set up API usage monitoring and alerts

---

*Environment setup guide for CreatorCircle monorepo*  
*Updated: October 3, 2025*
