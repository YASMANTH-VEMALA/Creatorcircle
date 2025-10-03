# CreatorCircle Monorepo Commands Reference

## 🚀 Development Commands

### Start Development
```bash
# Start mobile app (main development command)
npm run dev

# Start mobile app specifically
npm run dev:mobile

# Start backend (when ready)
npm run dev:backend
```

### Mobile App Commands
```bash
# Start Metro bundler
npm run mobile:start

# Run on Android device/emulator
npm run mobile:android

# Run on iOS simulator
npm run mobile:ios

# Run on web (requires additional dependencies)
npm run mobile:web
```

### Build Commands
```bash
# Build all apps
npm run build

# Build mobile app only
npm run build:mobile

# Build backend only (when ready)
npm run build:backend
```

### Maintenance Commands
```bash
# Run tests across all packages
npm run test

# Lint all code
npm run lint

# Fix linting issues
npm run lint:fix

# Clean all build artifacts
npm run clean

# Clean and reinstall everything
npm run reset

# Setup monorepo from scratch
npm run setup
```

## 📦 Workspace Management

### Install Dependencies
```bash
# Install dependency in mobile app
npm install <package> --workspace=apps/mobile

# Install dependency in backend
npm install <package> --workspace=apps/backend

# Install dependency in shared package
npm install <package> --workspace=packages/shared-types

# Install root dependency (affects all workspaces)
npm install <package>
```

### Check Dependencies
```bash
# List all workspace dependencies
npm list --workspaces

# List mobile app dependencies
npm list --workspace=apps/mobile

# List specific package dependencies
npm list --workspace=packages/shared-types
```

### Run Commands in Specific Workspaces
```bash
# Run any command in mobile app
npm run <command> --workspace=apps/mobile

# Run any command in backend
npm run <command> --workspace=apps/backend

# Run command in all workspaces
npm run <command> --workspaces
```

## 🔧 Development Workflow

### Daily Development
```bash
# 1. Start development
npm run dev

# 2. In another terminal, run on device
npm run mobile:android
# or
npm run mobile:ios
```

### Adding New Features
```bash
# 1. Navigate to mobile app
cd apps/mobile

# 2. Add new screen/component
# Edit files in src/

# 3. Test changes
npm run start
```

### Working with Shared Packages
```bash
# 1. Add new types
# Edit packages/shared-types/src/

# 2. Use in mobile app
# Import from '@creatorcircle/shared-types'

# 3. Use in backend (when ready)
# Import from '@creatorcircle/shared-types'
```

## 🧪 Testing Commands

### Project Health
```bash
# Check mobile app health
cd apps/mobile && npx expo-doctor

# Check TypeScript compilation
cd apps/mobile && npx tsc --noEmit

# Check shared packages
cd packages/shared-types && npx tsc --noEmit
cd packages/shared-utils && npx tsc --noEmit
```

### Dependency Management
```bash
# Update Expo dependencies
cd apps/mobile && npx expo install --fix

# Check for outdated packages
npm outdated --workspaces
```

## 📁 Directory Navigation

### Quick Navigation
```bash
# Go to mobile app
cd apps/mobile

# Go to backend
cd apps/backend

# Go to shared types
cd packages/shared-types

# Go to shared utils
cd packages/shared-utils

# Back to root
cd ../..  # or cd /Users/srinivas/Desktop/Creatorcircle
```

## 🎯 Common Tasks

### Starting Fresh Development Session
```bash
cd /Users/srinivas/Desktop/Creatorcircle
npm run dev
# In another terminal:
npm run mobile:android
```

### Adding New Dependencies
```bash
# For mobile app
npm install react-native-vector-icons --workspace=apps/mobile

# For backend (when ready)
npm install express mongoose --workspace=apps/backend
```

### Troubleshooting
```bash
# Reset everything
npm run reset

# Check workspace status
npm list --workspaces

# Run setup script
./tools/scripts/setup.sh
```

---

*Commands reference for CreatorCircle monorepo*  
*Updated: October 3, 2025*
