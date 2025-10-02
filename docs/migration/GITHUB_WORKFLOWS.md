# GitHub Workflows Documentation

## 🔄 CI/CD Pipeline Overview

The CreatorCircle monorepo uses multiple GitHub Actions workflows to ensure code quality and deployment readiness across all packages.

## 📱 Mobile CI Workflow (`mobile-ci.yml`)

### Trigger Conditions
- **Push**: to `main` or `develop` branches
- **Pull Request**: to `main` branch
- **Paths**: Changes in `apps/mobile/**` or `packages/**`

### Steps
1. **📥 Checkout**: Get latest code
2. **🏗️ Setup Node.js**: Install Node.js 18 with npm cache
3. **📦 Dependencies**: Install root and mobile dependencies
4. **🔧 Expo Setup**: Install Expo CLI globally
5. **🏗️ Build**: Build shared packages
6. **🧪 Health Check**: Run Expo doctor (non-blocking)
7. **📝 TypeScript**: Check mobile app TypeScript (allows errors)
8. **📝 Shared Types**: Check shared packages TypeScript (strict)
9. **🧹 Dependencies**: Check for outdated Expo packages
10. **✅ Verify**: Confirm workspace structure

### Duration
- **Estimated**: 5-10 minutes
- **Timeout**: 30 minutes

## 🖥️ Backend CI Workflow (`backend-ci.yml`)

### Trigger Conditions
- **Push**: to `main` or `develop` branches
- **Pull Request**: to `main` branch
- **Paths**: Changes in `apps/backend/**` or `packages/**`

### Services
- **MongoDB 7.0**: Test database with health checks
- **Ports**: MongoDB on 27017

### Steps
1. **📥 Checkout**: Get latest code
2. **🏗️ Setup Node.js**: Install Node.js 18 with npm cache
3. **📦 Dependencies**: Install root and backend dependencies
4. **🏗️ Build**: Build shared packages
5. **📝 TypeScript**: Check backend TypeScript (when ready)
6. **🧪 Tests**: Run backend tests with MongoDB
7. **🧹 Lint**: Check code quality
8. **🚀 Build**: Test backend build process
9. **✅ Verify**: Confirm backend readiness

### Duration
- **Estimated**: 5-15 minutes
- **Timeout**: 20 minutes

## 📚 Shared Packages CI Workflow (`shared-packages-ci.yml`)

### Trigger Conditions
- **Push**: to `main` or `develop` branches
- **Pull Request**: to `main` branch
- **Paths**: Changes in `packages/**`

### Matrix Strategy
- **Packages**: `shared-types`, `shared-utils`
- **Parallel Execution**: Tests both packages simultaneously

### Steps (Per Package)
1. **📥 Checkout**: Get latest code
2. **🏗️ Setup Node.js**: Install Node.js 18 with npm cache
3. **📦 Dependencies**: Install package dependencies
4. **📝 TypeScript**: Strict TypeScript checking
5. **🏗️ Build**: Test build process
6. **🧪 Tests**: Run package tests
7. **🧹 Lint**: Check code quality
8. **✅ Verify**: Confirm package structure

### Duration
- **Estimated**: 2-5 minutes per package
- **Timeout**: 15 minutes

## 🏗️ Monorepo Health Check (`monorepo-ci.yml`)

### Trigger Conditions
- **Push**: to `main` branch
- **Pull Request**: to `main` branch
- **Paths**: Any changes in the repository

### Steps
1. **📥 Checkout**: Get latest code
2. **🏗️ Setup Node.js**: Install Node.js 18 with npm cache
3. **📦 Dependencies**: Install all dependencies
4. **🏗️ Build**: Build all packages
5. **🧪 Test**: Run all tests
6. **🧹 Lint**: Lint all code
7. **✅ Structure Check**: Verify monorepo structure
8. **🔍 Issue Detection**: Check for common problems

### Duration
- **Estimated**: 5-10 minutes
- **Timeout**: 10 minutes

## 🚀 Workflow Features

### Advanced Features
- **📊 Matrix Builds**: Parallel testing of shared packages
- **🗄️ Database Services**: MongoDB for backend testing
- **⏰ Timeouts**: Prevent hanging workflows
- **🔄 Continue on Error**: Non-blocking checks for development
- **📦 Dependency Caching**: Faster subsequent runs
- **🎯 Path Filtering**: Only run when relevant files change

### Security Features
- **🔒 Environment Variables**: Secure secret management
- **🛡️ Permissions**: Minimal required permissions
- **🔐 Token Management**: Secure authentication handling

## 📋 Workflow Status

### Current Status
- **Mobile CI**: ✅ **Fully Functional**
- **Backend CI**: ✅ **Ready for Backend Development**
- **Shared Packages CI**: ✅ **Fully Functional**
- **Monorepo CI**: ✅ **Comprehensive Health Checks**

### Future Enhancements
- **🧪 E2E Testing**: End-to-end testing workflows
- **🚀 Deployment**: Automated deployment pipelines
- **📊 Performance**: Performance monitoring
- **🔍 Security**: Security scanning workflows

## 🔧 Local Testing

### Test Workflow Steps Locally
```bash
# Test mobile app checks
cd apps/mobile
npx expo-doctor
npx tsc --noEmit --skipLibCheck

# Test shared packages
cd packages/shared-types
npx tsc --noEmit

cd packages/shared-utils
npx tsc --noEmit

# Test workspace structure
cd ../..
npm list --workspaces --depth=0
```

### Simulate CI Environment
```bash
# Clean install (like CI)
npm run reset

# Build all packages
npm run build --workspaces --if-present

# Run all tests
npm run test --workspaces --if-present
```

## 📊 Success Criteria

### Mobile CI
- ✅ Expo doctor passes (warnings allowed)
- ✅ Shared packages compile without errors
- ✅ Workspace structure verified
- ✅ Dependencies properly linked

### Backend CI
- ✅ MongoDB service healthy
- ✅ Dependencies install correctly
- ✅ TypeScript configuration valid
- ✅ Ready for implementation

### Shared Packages CI
- ✅ All packages compile without errors
- ✅ Package structure valid
- ✅ Dependencies properly managed

## 🎯 Next Steps

1. **Implement Backend**: Start Express.js development
2. **Add Testing**: Implement unit and integration tests
3. **Add Linting**: Set up ESLint and Prettier
4. **Add Deployment**: Create deployment workflows
5. **Add Security**: Implement security scanning

---

*GitHub Workflows documentation for CreatorCircle monorepo*  
*Updated: October 3, 2025*
