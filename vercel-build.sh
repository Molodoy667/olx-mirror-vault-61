#!/bin/bash

# Vercel Build Script for Novado PWA
set -e

echo "🚀 Starting Vercel build..."

# Check Node.js version
echo "📋 Node.js version: $(node --version)"
echo "📋 NPM version: $(npm --version)"

# Clean install dependencies
echo "📦 Installing dependencies..."
npm ci --prefer-offline --no-audit --no-optional

# Build the application
echo "🔨 Building application..."
npm run build:vercel

# Verify build output
echo "✅ Build completed successfully!"
echo "📁 Build output:"
ls -la dist/

# Check for critical files
if [ ! -f "dist/index.html" ]; then
    echo "❌ Error: index.html not found in dist/"
    exit 1
fi

if [ ! -d "dist/assets" ]; then
    echo "❌ Error: assets directory not found in dist/"
    exit 1
fi

echo "🎉 Build verification completed successfully!"