#!/bin/bash

# RoadRescue360 Deployment Script for Render

echo "🚀 Starting RoadRescue360 deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install --production

# Check if installation was successful
if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to install backend dependencies"
    exit 1
fi

echo "✅ Backend dependencies installed successfully"

# Go back to root
cd ..

# Check if environment variables are set
echo "🔍 Checking environment variables..."

if [ -z "$MONGODB_URI" ]; then
    echo "⚠️ Warning: MONGODB_URI not set. Using default local MongoDB."
fi

if [ -z "$JWT_SECRET" ]; then
    echo "⚠️ Warning: JWT_SECRET not set. This may cause authentication issues."
fi

# Start the application
echo "🚀 Starting RoadRescue360 backend..."
cd backend
npm start
