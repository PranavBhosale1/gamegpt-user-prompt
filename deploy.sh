#!/bin/bash

# GameGPT Deployment Script for Render
# This script helps prepare your application for deployment

echo "🚀 GameGPT Deployment Preparation Script"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "backend/requirements.txt" ] || [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✅ Project structure looks good"

# Check for required files
echo "📋 Checking deployment files..."

files_to_check=(
    "backend/render.yaml"
    "frontend/render.yaml"
    "backend/Dockerfile"
    "frontend/Dockerfile"
    "frontend/nginx.conf"
    "DEPLOYMENT.md"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "🔧 Environment Configuration Check:"
echo "===================================="

# Check backend environment
echo "Backend environment variables needed:"
echo "- GOOGLE_API_KEY (required)"
echo "- HOST=0.0.0.0"
echo "- DEBUG=False"
echo "- ALLOWED_ORIGINS (will be set to your frontend URL)"

echo ""
echo "Frontend environment variables needed:"
echo "- VITE_API_URL (will be set to your backend URL)"
echo "- VITE_S3_UPLOAD_URL (will be set to your backend URL/upload)"
echo "- VITE_NODE_API_URL (will be set to your backend URL/api/reaction)"
echo "- VITE_NODE_API_URL_EMOTION (will be set to your backend URL/api/emotions)"
echo "- VITE_NODE_API_URL_GET_EMOTION (will be set to your backend URL/api/getemotions)"

echo ""
echo "📝 Next Steps:"
echo "=============="
echo "1. Push your code to GitHub"
echo "2. Go to https://dashboard.render.com"
echo "3. Create a new Web Service for the backend"
echo "4. Create a new Static Site for the frontend"
echo "5. Set the environment variables as shown above"
echo "6. Deploy both services"
echo "7. Update CORS settings with actual URLs"

echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md"
echo ""
echo "🎉 Ready for deployment!"
