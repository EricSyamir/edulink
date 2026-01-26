#!/bin/bash
# Fly.io Deployment Script
# Run this after adding payment info to Fly.io

echo "🚀 Deploying Edulink API to Fly.io..."

# Add Fly CLI to PATH (Windows)
export PATH="$PATH:$HOME/.fly/bin"

# Set environment variables/secrets
echo "📝 Setting environment variables..."

fly secrets set DATABASE_URL="postgresql+psycopg2://postgres.stkxcgpvzjpkblihoshz:YOUR_PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"

fly secrets set SESSION_SECRET_KEY="REPLACE_WITH_GENERATED_KEY"

fly secrets set CORS_ORIGINS="https://edulink-my.vercel.app"

fly secrets set DEBUG="False"

fly secrets set FACE_MODEL_NAME="buffalo_sc"

fly secrets set FACE_RECOGNITION_ENABLED="True"

# Deploy
echo "🚀 Deploying..."
fly deploy

echo "✅ Deployment complete!"
echo "📋 Next steps:"
echo "1. Initialize database: curl -X POST https://edulink-api.fly.dev/api/setup/init-database"
echo "2. Update Vercel VITE_API_URL to: https://edulink-api.fly.dev"
