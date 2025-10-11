#!/bin/bash

echo "🚀 Deploying WiFi Frontend to Google Cloud App Engine..."

# Set the project ID (replace with your actual project ID)
PROJECT_ID="hackquest25"

# Set the project
gcloud config set project $PROJECT_ID

echo "📦 Preparing files for deployment..."

# Make sure we're in the wififrontend directory
cd wififrontend

# Check if required files exist
if [ ! -f "login-mypublicwifi.html" ]; then
    echo "❌ Error: login-mypublicwifi.html not found!"
    exit 1
fi

if [ ! -f "success.html" ]; then
    echo "❌ Error: success.html not found!"
    exit 1
fi

if [ ! -f "app.yaml" ]; then
    echo "❌ Error: app.yaml not found!"
    exit 1
fi

echo "✅ All required files found"

# Deploy to App Engine
echo "🌐 Deploying to Google Cloud App Engine..."
gcloud app deploy app.yaml --quiet

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Your WiFi portal is now live at:"
    echo "   https://$PROJECT_ID.el.r.appspot.com/"
    echo ""
    echo "📱 URLs:"
    echo "   Main login: https://$PROJECT_ID.el.r.appspot.com/"
    echo "   Success page: https://$PROJECT_ID.el.r.appspot.com/success"
    echo ""
    echo "🎯 To update, just run this script again!"
else
    echo "❌ Deployment failed!"
    exit 1
fi