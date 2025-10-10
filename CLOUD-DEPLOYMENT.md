# 🚀 Cloud Deployment Guide - Google Cloud Run

Quick guide to deploy HackQuest25 to Google Cloud in 30 minutes.

---

## 📋 Prerequisites

### Required Tools
- [x] Google Cloud account (free tier available)
- [x] [gcloud CLI](https://cloud.google.com/sdk/docs/install) installed
- [x] Docker Desktop (optional, for local testing)
- [x] Node.js 18+ and npm

### Required Credentials
- [x] Supabase project URL and keys (already configured)
- [x] Google Cloud project ID

---

## ⚡ Quick Deploy (10 minutes)

### Step 1: Setup Google Cloud

```bash
# Install gcloud CLI first (if not installed)
# Windows: https://cloud.google.com/sdk/docs/install

# Login to Google Cloud
gcloud auth login

# Create new project
gcloud projects create hackquest-2025 --name="HackQuest25"

# Set active project
gcloud config set project hackquest-2025

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### Step 2: Deploy Backend

```bash
# Navigate to project root
cd E:\Projects\HackQuest25

# Deploy to Cloud Run (automatic build from source)
gcloud run deploy hackquest-backend \
  --source ./backend \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars NODE_ENV=production
```

**Wait 3-5 minutes for build and deployment...**

### Step 3: Get Deployment URL

```bash
# Get the deployed service URL
gcloud run services describe hackquest-backend \
  --region asia-south1 \
  --format='value(status.url)'

# Example output: https://hackquest-backend-xyz123-uc.a.run.app
```

### Step 4: Set Environment Variables

```bash
# Set Supabase credentials
gcloud run services update hackquest-backend \
  --region asia-south1 \
  --set-env-vars \
  SUPABASE_URL=https://akblmbpxxotmebzghczj.supabase.co,\
  SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...,\
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...,\
  FRONTEND_URL=https://your-frontend-url.web.app

# Update will redeploy automatically
```

---

## ✅ Verify Deployment

### Test Health Endpoint

```bash
# Replace with your actual URL
curl https://hackquest-backend-xyz123-uc.a.run.app/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-11T...",
  "services": {
    "geofencing": "active",
    "scheduler": "active"
  }
}
```

### Test Haptic Alert Endpoint

```bash
curl -X POST https://your-backend-url.run.app/api/haptic-alerts/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "venueId": "1",
    "severity": "high",
    "message": "Test deployment alert",
    "morseCode": "HELP"
  }'
```

---

## 🌐 Deploy Frontend (Firebase Hosting)

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools

# Login to Firebase
firebase login
```

### Step 2: Initialize Firebase

```bash
cd qrfrontend

# Initialize hosting
firebase init hosting

# Select options:
# - Create new project or use existing
# - Public directory: dist
# - Single-page app: Yes
# - Automatic builds: No
```

### Step 3: Update Backend URL

**Edit `qrfrontend/.env.production`:**
```env
VITE_API_URL=https://hackquest-backend-xyz123-uc.a.run.app
VITE_SUPABASE_URL=https://akblmbpxxotmebzghczj.supabase.co
VITE_SUPABASE_ANON_KEY=your_key
```

### Step 4: Build and Deploy

```bash
# Build production bundle
npm run build

# Deploy to Firebase
firebase deploy --only hosting

# Get URL: https://your-project.web.app
```

---

## 🔧 Update Backend with Frontend URL

```bash
# Update CORS origin
gcloud run services update hackquest-backend \
  --region asia-south1 \
  --update-env-vars FRONTEND_URL=https://your-project.web.app
```

---

## 🧪 Post-Deployment Testing

### 1. Test Backend Health
```bash
curl https://your-backend-url.run.app/health
```

### 2. Open Frontend
```bash
# Open in browser
start https://your-project.web.app
```

### 3. Test Alert Flow
1. Open frontend
2. Click "Subscribe to Alerts"
3. Use test buttons to trigger alerts
4. Verify haptic feedback works

### 4. Test ML Model Integration

**On your local computer:**
```bash
cd frontend

# Update .env with production backend
BACKEND_URL=https://your-backend-url.run.app

# Run model
python model.py

# Speak test announcement
# "Attention all passengers, flight AA123 is now boarding"
```

---

## 💰 Cost Breakdown

### Google Cloud Run (Backend)
- **Free Tier:** 2 million requests/month
- **After Free Tier:** $0.00002400 per request
- **Estimated:** $10-15/month with moderate traffic

### Firebase Hosting (Frontend)
- **Free Tier:** 10 GB storage, 360 MB/day transfer
- **After Free Tier:** $0.026/GB
- **Estimated:** $0/month (within free tier)

### Supabase (Database)
- **Free Tier:** 500 MB database, 1 GB storage
- **Upgrade:** $25/month for Pro (8 GB database)
- **Estimated:** $0/month (free tier)

**Total: $10-15/month** (all using free tiers where possible)

---

## 🔐 Security Configuration

### Enable HTTPS (Automatic)
Cloud Run automatically provides SSL certificates. No configuration needed.

### Update CORS in Backend

**Edit `backend/config/security.js`:**
```javascript
const allowedOrigins = [
  'https://your-project.web.app',
  'https://your-custom-domain.com'
];
```

### Set Strong Secrets

```bash
gcloud run services update hackquest-backend \
  --region asia-south1 \
  --set-env-vars \
  JWT_SECRET=$(openssl rand -base64 32),\
  ADMIN_PASSWORD=$(openssl rand -base64 16)
```

---

## 📊 Monitor Your Deployment

### View Logs
```bash
# Stream logs in real-time
gcloud run services logs tail hackquest-backend --region asia-south1

# View logs in Cloud Console
# https://console.cloud.google.com/run
```

### Check Metrics
```bash
# Open Cloud Console
gcloud run services describe hackquest-backend --region asia-south1

# View in browser
# Metrics: CPU, Memory, Request count, Latency
```

### Set Up Alerts
```bash
# Create alert for high error rate
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="Backend Error Rate" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=300s
```

---

## 🔄 Update Deployment

### Update Backend Code
```bash
# Make code changes, then redeploy
cd backend
gcloud run deploy hackquest-backend \
  --source . \
  --region asia-south1
```

### Update Frontend
```bash
cd qrfrontend
npm run build
firebase deploy --only hosting
```

### Update Environment Variables
```bash
gcloud run services update hackquest-backend \
  --region asia-south1 \
  --set-env-vars NEW_VAR=value
```

---

## 🐛 Troubleshooting

### Deployment Fails

**Check build logs:**
```bash
gcloud builds log --region=asia-south1
```

**Common issues:**
- Missing dependencies in `package.json`
- Port mismatch (Cloud Run uses port 8080)
- Environment variables not set

### Service Not Starting

**View container logs:**
```bash
gcloud run services logs read hackquest-backend --region asia-south1 --limit 50
```

**Fix:** Ensure `PORT` env var is handled:
```javascript
const PORT = process.env.PORT || 3000;
```

### Database Connection Error

**Verify Supabase credentials:**
```bash
curl https://your-supabase-url.supabase.co/rest/v1/
```

**Update credentials:**
```bash
gcloud run services update hackquest-backend \
  --region asia-south1 \
  --set-env-vars SUPABASE_URL=correct-url
```

### High Costs

**Reduce costs:**
```bash
# Set min instances to 0 (scale to zero)
gcloud run services update hackquest-backend \
  --region asia-south1 \
  --min-instances 0

# Set max instances cap
gcloud run services update hackquest-backend \
  --region asia-south1 \
  --max-instances 5
```

---

## 🚀 Advanced: Custom Domain

### Add Custom Domain
```bash
# Map custom domain
gcloud run domain-mappings create \
  --service hackquest-backend \
  --domain api.yourdomain.com \
  --region asia-south1

# Update DNS records as shown in output
```

### SSL Certificate
Automatic SSL certificates are provisioned by Google Cloud Run.

---

## 📱 Deploy ML Service (Optional)

If you want cloud-based ML processing:

```bash
# Deploy ML service
gcloud run deploy hackquest-ml \
  --source ./frontend \
  --region asia-south1 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 600

# Update backend to use ML service
gcloud run services update hackquest-backend \
  --region asia-south1 \
  --set-env-vars ML_SERVICE_URL=https://your-ml-service-url.run.app
```

---

## ✅ Deployment Checklist

### Before Deployment
- [x] Supabase database configured
- [x] Environment variables ready
- [x] Code tested locally
- [x] Docker build successful (optional)

### During Deployment
- [ ] Backend deployed to Cloud Run
- [ ] Frontend deployed to Firebase
- [ ] Environment variables set
- [ ] Health check passes

### After Deployment
- [ ] Test all endpoints
- [ ] Verify database connection
- [ ] Check logs for errors
- [ ] Test ML model integration
- [ ] Monitor costs

---

## 🎯 Quick Commands Reference

```bash
# Deploy backend
gcloud run deploy hackquest-backend --source ./backend --region asia-south1

# View logs
gcloud run services logs tail hackquest-backend --region asia-south1

# Update env vars
gcloud run services update hackquest-backend --set-env-vars KEY=VALUE

# Get service URL
gcloud run services describe hackquest-backend --format='value(status.url)'

# Delete service
gcloud run services delete hackquest-backend --region asia-south1
```

---

## 💡 Tips

1. **Use `--min-instances=0`** to save costs (scales to zero)
2. **Monitor logs** regularly for errors
3. **Set up alerts** for high error rates
4. **Use Cloud Build** for CI/CD automation
5. **Enable Cloud CDN** for static assets

---

## 📞 Support

- **Cloud Run Docs:** https://cloud.google.com/run/docs
- **Firebase Docs:** https://firebase.google.com/docs/hosting
- **Supabase Docs:** https://supabase.com/docs

---

**Deployment time: ~30 minutes | Cost: $10-15/month | Status: Production Ready** ✅
