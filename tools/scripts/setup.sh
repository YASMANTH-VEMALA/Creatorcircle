#!/bin/bash

# CreatorCircle Monorepo Setup Script

echo "🚀 Setting up CreatorCircle monorepo..."

# Check Node.js version
echo "📋 Checking Node.js version..."
node_version=$(node -v)
echo "Node.js version: $node_version"

# Check npm version
echo "📋 Checking npm version..."
npm_version=$(npm -v)
echo "npm version: $npm_version"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install workspace dependencies
echo "📦 Installing workspace dependencies..."
npm install --workspaces --if-present

# Check if mobile app is ready
echo "📱 Checking mobile app setup..."
cd apps/mobile
if [ -f "package.json" ]; then
    echo "✅ Mobile app package.json found"
else
    echo "❌ Mobile app package.json not found"
fi

# Go back to root
cd ../..

# Check if backend is ready (placeholder)
echo "🖥️  Checking backend setup..."
cd apps/backend
if [ -f "package.json" ]; then
    echo "✅ Backend app package.json found (placeholder)"
else
    echo "❌ Backend app package.json not found"
fi

# Go back to root
cd ../..

echo "✅ Monorepo setup complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run dev:mobile' to start the mobile app"
echo "2. During Firebase migration, backend will be set up"
echo "3. Use 'npm run dev' to start both apps (when backend is ready)"
