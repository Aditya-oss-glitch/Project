#!/bin/bash

# Road Rescue 360 - macOS Setup Script
echo "🍎 Setting up Road Rescue 360 on macOS..."

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    if command -v brew &> /dev/null; then
        brew install node
    else
        echo "❌ Please install Node.js from https://nodejs.org"
        exit 1
    fi
else
    echo "✅ Node.js is already installed: $(node --version)"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

if [ $? -eq 0 ]; then
    echo "✅ Setup complete!"
    echo "🚀 Start backend: cd backend && npm start"
else
    echo "❌ Setup failed"
    exit 1
fi
