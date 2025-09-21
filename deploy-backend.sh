#!/bin/bash

# Road Rescue 360 - Backend Deployment Script
echo "🚀 Preparing Road Rescue 360 for deployment..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install --production --ignore-optional

if [ $? -eq 0 ]; then
    echo "✅ Backend ready for deployment!"
    echo "📝 Next steps:"
    echo "   1. git add . && git commit -m 'Deploy backend'"
    echo "   2. git push origin main"
    echo "   3. Deploy on Render"
else
    echo "❌ Deployment preparation failed"
    exit 1
fi
