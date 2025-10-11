# 🔐 HackQuest25 Deployment Credentials & Hosting Information

## 📊 **Project Overview**
- **Project Name**: HackQuest25
- **Type**: Emergency Alert System with PWA Frontend
- **Status**: ✅ Fully Deployed & Operational

---

## 🚀 **Live Deployment URLs**

### **Backend API (Google Cloud Run)**
- **Service URL**: `https://hackquest-backend-701994675545.asia-south1.run.app`
- **Health Check**: `https://hackquest-backend-701994675545.asia-south1.run.app/health`
- **API Status**: `https://hackquest-backend-701994675545.asia-south1.run.app/api/status`
- **Region**: `asia-south1`
- **Project ID**: `hackquest25`

### **Frontend App (Firebase Hosting)**
- **App URL**: `https://rsetquest-ec4c0.web.app`
- **Project ID**: `rsetquest-ec4c0`
- **Firebase Console**: `https://console.firebase.google.com/project/rsetquest-ec4c0/overview`

---

## ☁️ **Google Cloud Configuration**

### **Cloud Run Service**
```bash
# Deployment Command
gcloud run deploy hackquest-backend \
  --source ./backend \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --timeout 300 \
  --set-env-vars NODE_ENV=production

# Service Details
Service Name: hackquest-backend
Project: hackquest25 (701994675545)
Region: asia-south1
Scaling: 0-5 instances
Memory: 512Mi
CPU: 1
Timeout: 300s
```

### **Environment Variables (Cloud Run)**
```bash
NODE_ENV=production
SUPABASE_URL=https://akblmbpxxotmebzghczj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
FRONTEND_URL=https://rsetquest-ec4c0.web.app
```

---

## 🔥 **Firebase Configuration**

### **Project Details**
```json
{
  "projectId": "rsetquest-ec4c0",
  "storageBucket": "rsetquest-ec4c0.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abcdef"
}
```

### **Hosting Configuration**
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{
      "source": "**",
      "destination": "/index.html"
    }]
  }
}
```

### **Deployment Commands**
```bash
# Build and Deploy
cd qrfrontend
npm run build
firebase deploy --only hosting

# Environment Variables (Build Time)
set VITE_API_URL=https://hackquest-backend-701994675545.asia-south1.run.app
set VITE_SUPABASE_URL=https://akblmbpxxotmebzghczj.supabase.co
set VITE_SUPABASE_ANON_KEY=your_key
```

---

## 💾 **Supabase Database Configuration**

### **Project Details**
- **URL**: `https://akblmbpxxotmebzghczj.supabase.co`
- **Project**: `akblmbpxxotmebzghczj`
- **Region**: Auto-assigned

### **API Keys**
```bash
# Anonymous Key (Public)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrYmxtYnB4eG90bWViemdoY3pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNzQxMDUsImV4cCI6MjA3NTY1MDEwNX0.6d8XmmmoSh0hY8OWoymIEX7UnQU6qpgyQsyIe7_KHtI

# Service Role Key (Server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrYmxtYnB4eG90bWViemdoY3pqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA3NDEwNSwiZXhwIjoyMDc1NjUwMTA1fQ.FlXon9jR0s55Kv0GyHfzHsW2Z37UJU9r4DJ3G4sJfu4
```

### **Database Tables**
- `transcriptions` - Audio transcription storage
- `user_locations` - Geofencing data
- `alerts` - Emergency alerts

---

## 🔧 **Local Development**

### **WiFi Frontend**
```bash
cd wififrontend
npm run dev
# Runs on: http://localhost:5173/ (or next available port)
```

### **QR Frontend** 
```bash
cd qrfrontend
npm run dev
# Runs on: http://localhost:5174/ (or next available port)
```

### **Backend Server**
```bash
cd backend
npm start
# Runs on: http://localhost:8080/
```

---

## 📱 **PWA Configuration**

### **Manifest Details**
- **Name**: AlertNet - Emergency Registration
- **Short Name**: AlertNet
- **Theme Color**: #475569
- **Background Color**: #ffffff
- **Display**: standalone
- **Scope**: /
- **Start URL**: /

### **Service Worker**
- **File**: `/sw.js`
- **Cache Strategy**: Network first with fallback
- **Offline Support**: ✅ Enabled

---

## 🛠️ **Deployment Architecture**

```
┌─────────────────────┐    ┌──────────────────────┐
│   Firebase Hosting  │    │   Google Cloud Run   │
│   (Frontend PWA)    │◄──►│   (Backend API)      │
│ rsetquest-ec4c0.web │    │ hackquest-backend    │
│       .app          │    │ .asia-south1.run.app │
└─────────────────────┘    └──────────────────────┘
           │                          │
           │                          │
           ▼                          ▼
┌─────────────────────┐    ┌──────────────────────┐
│     User Devices    │    │   Supabase Database  │
│   (PWA Install)     │    │   (Data Storage)     │
│   Phone Number Reg  │    │ akblmbpxxotmebzghczj │
└─────────────────────┘    └──────────────────────┘
```

---

## 📋 **Access Information**

### **Google Cloud Console**
- **Project**: hackquest25
- **Console**: `https://console.cloud.google.com/run?project=hackquest25`

### **Firebase Console**
- **Project**: rsetquest-ec4c0
- **Console**: `https://console.firebase.google.com/project/rsetquest-ec4c0`

### **Supabase Dashboard**
- **Project**: akblmbpxxotmebzghczj
- **Dashboard**: `https://supabase.com/dashboard/project/akblmbpxxotmebzghczj`

---

## 🔒 **Security Notes**

⚠️ **IMPORTANT**: 
- Service role keys are for server-side use only
- Anonymous keys are safe for frontend use
- Environment variables are configured for production
- CORS is properly configured between services

---

## 📞 **Support Commands**

### **Check Service Status**
```bash
# Backend Health
curl https://hackquest-backend-701994675545.asia-south1.run.app/health

# Frontend Status
curl https://rsetquest-ec4c0.web.app

# Cloud Run Service Info
gcloud run services describe hackquest-backend --region asia-south1
```

### **Redeploy Services**
```bash
# Backend
gcloud run deploy hackquest-backend --source ./backend --region asia-south1

# Frontend
cd qrfrontend && npm run build && firebase deploy --only hosting
```

---

## ✅ **Deployment Checklist**

- [x] Google Cloud Run backend deployed
- [x] Firebase hosting frontend deployed  
- [x] Environment variables configured
- [x] CORS settings enabled
- [x] PWA manifest and service worker active
- [x] Supabase database connected
- [x] Health checks passing
- [x] Auto-scaling configured (0-5 instances)
- [x] SSL certificates active (HTTPS)
- [x] Phone number registration flow working
- [x] PWA installation timing fixed

---

*Last Updated: October 11, 2025*
*Status: ✅ All Services Operational*