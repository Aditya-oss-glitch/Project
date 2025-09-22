#!/bin/bash

# Road Rescue 360 - Simple Capacitor Setup (No TypeScript)
echo "📱 Setting up Capacitor for Road Rescue 360 (Simple Version)..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first:"
    echo "   brew install node"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install Capacitor CLI globally
echo "📦 Installing Capacitor CLI..."
npm install -g @capacitor/cli

# Install Capacitor dependencies
echo "📦 Installing Capacitor dependencies..."
npm install @capacitor/core @capacitor/android @capacitor/cli

# Initialize Capacitor (if not already done)
if [ ! -d "android" ]; then
    echo "🚀 Initializing Capacitor..."
    npx cap init "RoadRescue360" "com.roadrescue360.app" --web-dir=frontend
    
    echo "📱 Adding Android platform..."
    npx cap add android
else
    echo "✅ Capacitor already initialized"
fi

# Sync with Android
echo "🔄 Syncing with Android..."
npx cap sync android

echo "🎉 Capacitor setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Open Android Studio:"
echo "      npx cap open android"
echo "   2. Build APK in Android Studio:"
echo "      Build → Build Bundle(s) / APK(s) → Build APK(s)"
echo ""
echo "🌐 Your website hosting on Render remains unchanged!"
