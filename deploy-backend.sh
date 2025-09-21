#!/bin/bash

# Road Rescue 360 - Backend Deployment Script
echo "🚀 Starting Road Rescue 360 Backend Deployment..."

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    echo "❌ Error: backend/package.json not found. Please run this script from the project root."
    exit 1
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install --production

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully!"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Go back to root
cd ..

echo "🎉 Backend deployment preparation complete!"
echo "📝 Next steps:"
echo "   1. Commit your changes: git add . && git commit -m 'Deploy backend'"
echo "   2. Push to GitHub: git push origin main"
echo "   3. Deploy on Render using the updated render.yaml configuration"
