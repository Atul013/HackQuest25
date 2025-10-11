# Geofence Service

Lightweight Node/Express geofence checking service intended to run on Google Cloud Run.

Endpoints
- POST /location
  - Body: { userId, venueId, latitude, longitude }
  - Response: { inside: boolean, message?, outsideCount?, action?, instructions? }

- GET /health

Configuration (env vars)
- REDIS_URL: optional. If provided, uses Redis to persist per-user state. Otherwise falls back to in-memory store.
- OUTSIDE_THRESHOLD: number of consecutive outside detections required to trigger instructions (default 5)
- CHECK_INTERVAL_MS: expected interval between checks in milliseconds (default 120000)
- DEFAULT_VENUE_LAT, DEFAULT_VENUE_LON, DEFAULT_VENUE_RADIUS: fallback venue center and radius used if no backend DB is available.

Build & deploy (Cloud Run)
1) Build and push image (example using gcloud builds):
   cd geofence-service
   gcloud builds submit --tag gcr.io/PROJECT_ID/geofence-service

2) Deploy to Cloud Run:
   gcloud run deploy geofence-service \
     --image gcr.io/PROJECT_ID/geofence-service \
     --region asia-south1 \
     --platform managed \
     --allow-unauthenticated \
     --set-env-vars OUTSIDE_THRESHOLD=5,CHECK_INTERVAL_MS=120000,DEFAULT_VENUE_LAT=40.7589,DEFAULT_VENUE_LON=-73.9851,DEFAULT_VENUE_RADIUS=1000

3) After deploy, call POST /location on the service URL.
