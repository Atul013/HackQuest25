#!/bin/bash
# Quick Deploy Script for HackQuest25
# Run this after installing gcloud CLI

set -e  # Exit on error

echo "🚀 HackQuest25 - Cloud Deployment Script"
echo "========================================"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found!"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo "✅ gcloud CLI found"
echo ""

# Get project ID
read -p "Enter Google Cloud Project ID (or press Enter to create new): " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo ""
    echo "Creating new project..."
    PROJECT_ID="hackquest-$(date +%s)"
    gcloud projects create $PROJECT_ID --name="HackQuest25"
    echo "✅ Created project: $PROJECT_ID"
fi

# Set project
echo ""
echo "Setting active project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable APIs
echo ""
echo "Enabling required APIs..."
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
echo "✅ APIs enabled"

# Get Supabase credentials
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Supabase Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "Supabase URL (default: https://akblmbpxxotmebzghczj.supabase.co): " SUPABASE_URL
SUPABASE_URL=${SUPABASE_URL:-https://akblmbpxxotmebzghczj.supabase.co}

read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
read -p "Supabase Service Role Key: " SUPABASE_SERVICE_KEY

# Deploy backend
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Deploying Backend to Cloud Run..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd backend

gcloud run deploy hackquest-backend \
  --source . \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars "NODE_ENV=production,SUPABASE_URL=$SUPABASE_URL,SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY"

# Get backend URL
BACKEND_URL=$(gcloud run services describe hackquest-backend \
  --region asia-south1 \
  --format='value(status.url)')

echo ""
echo "✅ Backend deployed successfully!"
echo "📍 URL: $BACKEND_URL"

# Test health endpoint
echo ""
echo "Testing health endpoint..."
curl -s "$BACKEND_URL/health" | python -m json.tool

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Backend URL: $BACKEND_URL"
echo ""
echo "Next Steps:"
echo "1. Update frontend/.env with backend URL:"
echo "   BACKEND_URL=$BACKEND_URL"
echo ""
echo "2. Deploy frontend to Firebase:"
echo "   cd ../qrfrontend"
echo "   npm run build"
echo "   firebase deploy"
echo ""
echo "3. Run ML model locally:"
echo "   cd ../frontend"
echo "   python model.py"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
