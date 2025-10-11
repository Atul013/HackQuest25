# 🚀 Deployment Guide for WiFi Frontend

## 📋 Prerequisites

1. **Google Cloud SDK installed**
   - Download from: https://cloud.google.com/sdk/docs/install
   - Run: `gcloud init` to authenticate

2. **Google Cloud Project**
   - Create a project in Google Cloud Console
   - Enable App Engine API
   - Note your PROJECT_ID

## 🔧 Quick Deployment Steps

### Option 1: Automated Script (Recommended)
```bash
cd wififrontend
deploy.bat
```
- Enter your Project ID when prompted
- Wait for deployment to complete

### Option 2: Manual Deployment
```bash
# 1. Set your project
gcloud config set project YOUR_PROJECT_ID

# 2. Navigate to wififrontend directory
cd wififrontend

# 3. Deploy to App Engine
gcloud app deploy app.yaml --quiet
```

## 📱 After Deployment

Your WiFi portal will be available at:
- **Main URL**: `https://YOUR_PROJECT_ID.el.r.appspot.com/`
- **Login Page**: `https://YOUR_PROJECT_ID.el.r.appspot.com/`
- **Success Page**: `https://YOUR_PROJECT_ID.el.r.appspot.com/success`

## 🔄 Updating the Site

To update your deployed site:
1. Make changes to `login-mypublicwifi.html` or `success.html`
2. Run the deployment script again
3. Changes will be live in 1-2 minutes

## 🔧 Troubleshooting

### Permission Errors
```bash
# Re-authenticate
gcloud auth login

# Set correct project
gcloud config set project YOUR_ACTUAL_PROJECT_ID
```

### App Engine Not Enabled
```bash
# Enable App Engine API
gcloud services enable appengine.googleapis.com
```

### First Time App Engine Setup
```bash
# Create App Engine app (first time only)
gcloud app create --region=asia-south1
```

## 📂 Deployment Files

- `app.yaml` - App Engine configuration
- `login-mypublicwifi.html` - Main WiFi login page with transcription alerts
- `success.html` - Success page with live transcription polling
- `style-modern.css` - Styling for the portal
- `deploy.bat` - Automated deployment script

## ✅ Features Deployed

- ✅ WiFi registration portal
- ✅ Supabase integration for user storage
- ✅ Live transcription alert system
- ✅ Haptic feedback and notifications
- ✅ Mobile-responsive design
- ✅ Auto-scaling and SSL certificates