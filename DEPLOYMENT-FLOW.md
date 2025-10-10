# 🎯 Deployment Flow - Visual Guide

Quick visual reference for deploying HackQuest25 to the cloud.

---

## 📊 Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCTION SETUP                      │
└─────────────────────────────────────────────────────────┘

        User's Computer                    Google Cloud
┌──────────────────────────┐      ┌──────────────────────────┐
│                          │      │                          │
│  ML Model (model.py)     │      │  Backend API             │
│  - Captures audio        │─────▶│  (Cloud Run)             │
│  - Whisper transcription │      │  - Express server        │
│  - Sends to backend      │      │  - WebSocket alerts      │
│                          │      │  - Geofencing            │
└──────────────────────────┘      └──────────┬───────────────┘
                                             │
        User's Browser                       │
┌──────────────────────────┐                │
│                          │                │
│  Frontend (React/TS)     │◀───────────────┘
│  (Firebase Hosting)      │
│  - QR/WiFi portals       │
│  - Haptic alerts UI      │
│  - WebSocket client      │
│                          │
└──────────────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │   Supabase          │
        │   (Database)        │
        │   - Venues          │
        │   - Subscriptions   │
        │   - Transcriptions  │
        └────────────────────┘
```

---

## 🚀 Deployment Steps (30 min)

```
STEP 1: Setup Google Cloud (5 min)
    │
    ├─▶ Install gcloud CLI
    ├─▶ Login: gcloud auth login
    ├─▶ Create project: gcloud projects create
    └─▶ Enable APIs: gcloud services enable
        │
        ▼
STEP 2: Deploy Backend (10 min)
    │
    ├─▶ cd backend
    ├─▶ gcloud run deploy hackquest-backend
    ├─▶ Wait for build...
    ├─▶ Get URL
    └─▶ Set environment variables
        │
        ▼
STEP 3: Deploy Frontend (10 min)
    │
    ├─▶ cd qrfrontend
    ├─▶ npm run build
    ├─▶ firebase init hosting
    ├─▶ firebase deploy
    └─▶ Get URL
        │
        ▼
STEP 4: Test Everything (5 min)
    │
    ├─▶ curl backend/health
    ├─▶ Open frontend in browser
    ├─▶ Test haptic alerts
    └─▶ Test ML model integration
        │
        ▼
    ✅ DEPLOYED!
```

---

## 💾 Data Flow

```
1. User speaks announcement
        │
        ▼
2. model.py captures audio
        │
        ▼
3. Whisper transcribes
        │
        ▼
4. Smart detection (announcement vs conversation)
        │
        ├──▶ If conversation: IGNORE
        │
        └──▶ If announcement:
                │
                ▼
5. POST to backend API (Cloud Run)
        │
        ▼
6. Backend saves to Supabase
        │
        ▼
7. Backend triggers haptic alerts
        │
        ▼
8. WebSocket sends to subscribed users
        │
        ▼
9. Browser receives alert
        │
        ▼
10. Phone vibrates 📳
```

---

## 🎛️ Component Status

```
Component                Status      Location           Cost
────────────────────────────────────────────────────────────
Backend API              ✅ Ready    Cloud Run         $10-15/mo
Frontend (QR)            ✅ Ready    Firebase          $0/mo
Frontend (WiFi)          ✅ Ready    Firebase          $0/mo
ML Model                 ✅ Local    User's Device     $0/mo
Database                 ✅ Active   Supabase          $0/mo
Geofencing               ✅ Active   Cloud Run         Included
WebSocket                ✅ Active   Cloud Run         Included
────────────────────────────────────────────────────────────
TOTAL                                                  $10-15/mo
```

---

## 🔐 Environment Variables Flow

```
DEVELOPMENT (.env)              PRODUCTION (Cloud Run)
────────────────────────────────────────────────────────
localhost:3000              →   your-app.run.app
Supabase keys               →   Same (already configured)
Frontend: localhost         →   your-project.web.app
NODE_ENV: development       →   production
```

---

## 📦 What Gets Deployed Where

```
CLOUD RUN (Backend)
├── Node.js server
├── Express routes
├── WebSocket server
├── Geofencing logic
├── Security middleware
└── Supabase client

FIREBASE HOSTING (Frontend)
├── React/TypeScript app
├── QR frontend (built)
├── WiFi frontend (built)
├── Static assets
└── Service worker

SUPABASE (Database)
├── Venues table
├── Subscriptions table
├── Transcriptions table
├── Alerts table
└── Auto-cleanup functions

USER'S DEVICE (ML Model)
├── Python app (model.py)
├── Whisper model
├── PyAudio (microphone)
└── Connects to backend
```

---

## ⚡ Quick Deploy Commands

```bash
# 1. Setup
gcloud auth login
gcloud projects create hackquest-2025

# 2. Deploy Backend
cd backend
gcloud run deploy hackquest-backend --source . --region asia-south1

# 3. Deploy Frontend
cd ../qrfrontend
npm run build
firebase deploy

# 4. Update ML Model Config
cd ../frontend
# Edit .env: BACKEND_URL=https://your-backend-url.run.app

# 5. Test
python model.py
```

---

## 🧪 Testing Checklist

```
□ Backend health check passes
□ Frontend loads in browser
□ WebSocket connection works
□ Haptic alert buttons work
□ ML model connects to backend
□ Announcements get detected
□ Alerts reach browser
□ Database stores transcriptions
□ Auto-cleanup runs (10 min)
□ Geofencing works
```

---

## 💰 Cost Tracking

```
SERVICE              FREE TIER             AFTER FREE TIER
─────────────────────────────────────────────────────────
Cloud Run           2M requests/mo         $0.000024/request
Firebase Hosting    10 GB, 360 MB/day     $0.026/GB
Supabase           500 MB DB              $25/mo (Pro)
─────────────────────────────────────────────────────────
Expected Monthly:   $0-10 (free tiers)    $10-15 typical
```

---

## 🔄 Update Flow

```
CODE CHANGE
    │
    ├─▶ Backend change?
    │       └─▶ gcloud run deploy hackquest-backend
    │
    ├─▶ Frontend change?
    │       └─▶ npm run build && firebase deploy
    │
    └─▶ ML model change?
            └─▶ Users update model.py locally
```

---

## 📊 Monitoring Dashboard

```
CLOUD CONSOLE: https://console.cloud.google.com/run
├── Metrics
│   ├── Request count
│   ├── Latency
│   ├── Error rate
│   └── Memory usage
├── Logs
│   ├── Real-time stream
│   ├── Error tracking
│   └── Request traces
└── Alerts
    ├── High error rate
    ├── High latency
    └── Cost threshold
```

---

## 🎯 Deployment Decision Tree

```
Need to deploy ML model to cloud?
    │
    ├─▶ NO → Use current setup ✅
    │         (ML runs on user's device)
    │         Cost: $10-15/mo
    │
    └─▶ YES → Deploy separate ML service
              (Cloud Run + larger instance)
              Cost: $25-35/mo
              
              Create API endpoint:
              POST /transcribe (audio file)
              Returns: transcription text
```

---

## 🚨 Rollback Plan

```
ISSUE DETECTED
    │
    ├─▶ Backend problem?
    │       └─▶ gcloud run services update-traffic
    │           --to-revisions PREVIOUS_REVISION=100
    │
    ├─▶ Frontend problem?
    │       └─▶ firebase hosting:rollback
    │
    └─▶ Database problem?
            └─▶ Use Supabase automatic backups
```

---

## ✅ Success Indicators

```
□ Health endpoint returns 200 OK
□ Frontend loads in <2 seconds
□ WebSocket connects successfully
□ Alerts delivered in <1 second
□ ML model detects announcements
□ Database queries <100ms
□ Zero errors in logs
□ Cost within budget
```

---

**Quick Reference:** See `CLOUD-DEPLOYMENT.md` for detailed commands.
