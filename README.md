# PublicAlert Backend - Emergency Alert System

A comprehensive emergency alert system backend built for the 24-hour hackathon. This system provides real-time emergency alerts for public venues using QR codes, WiFi portals, and geofencing.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account and project
- Web Push VAPID keys

### Installation

1. **Clone and setup**
```bash
cd PublicAlert-Backend
npm install
```

2. **Environment Setup**
```bash
# Copy example environment file
copy .env.example .env

# Update .env with your credentials:
# - Supabase URL and keys
# - VAPID keys for push notifications
# - JWT secret
# - Admin password
```

3. **Database Setup**
- Create a Supabase project
- Run the SQL schema from `database-schema.md`
- Configure Row Level Security (RLS) policies

4. **Start Development Server**
```bash
npm run dev
# or
npm start
```

Server will run on `http://localhost:3000`

## 📋 API Documentation

### Authentication
- **Admin Login**: `POST /api/admin/login`
- Uses JWT tokens with 24-hour expiry
- Admin routes require `Authorization: Bearer <token>` header

### Core Endpoints

#### Venues
- `GET /api/venues` - List all active venues
- `GET /api/venues/:id` - Get venue details
- `POST /api/venues` - Create venue (Admin)
- `PUT /api/venues/:id` - Update venue (Admin)
- `GET /api/venues/:id/qr` - Generate QR code for venue

#### Subscriptions
- `POST /api/subscriptions` - Subscribe to venue notifications
- `DELETE /api/subscriptions` - Unsubscribe from venue
- `GET /api/subscriptions/:deviceToken` - Get user subscriptions

#### Alerts
- `GET /api/venues/:venueId/alerts` - Get active alerts for venue
- `POST /api/alerts` - Create emergency alert (Admin)
- `PUT /api/alerts/:id` - Update alert (Admin)
- `PATCH /api/alerts/:id/deactivate` - Deactivate alert (Admin)

#### Temporary Announcements
- `GET /api/venues/:venueId/announcements` - Get active announcements
- `POST /api/announcements` - Create announcement from audio-to-text (Admin)

### Special Features

#### Audio-to-Text Announcements
```javascript
POST /api/announcements
{
  "venueId": "venue-uuid",
  "transcribedText": "Converted audio announcement text",
  "announcementType": "general",
  "priority": "high",
  "durationMinutes": 10
}
```

#### QR Code Generation
```javascript
GET /api/venues/:id/qr
// Returns:
{
  "venueId": "venue-uuid",
  "venueName": "Venue Name",
  "qrCode": "data:image/png;base64,iVBORw0KGgo...",
  "qrData": "https://your-app-domain.com/venue/venue-uuid"
}
```

## 🔧 Configuration

### Environment Variables
```env
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=mailto:your_email@example.com
ADMIN_PASSWORD=hackathon2025
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

### CORS Configuration
```javascript
// Configured for multiple origins
cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://your-frontend-domain.com'
  ],
  credentials: true
})
```

## 📊 Database Schema

The system uses **Supabase PostgreSQL** with the following tables:

### Tables
- **venues** - Public venue information with geospatial data
- **subscriptions** - User notification subscriptions with auto-expiry
- **alerts** - Emergency alerts with severity levels
- **temporary_announcements** - Audio-to-text announcements (10min auto-delete)

### Auto-Cleanup Features
1. **Node-cron**: Runs every minute to expire announcements
2. **PostgreSQL Triggers**: Database-level auto-updates and cleanup
3. **Row Level Security**: Comprehensive access control policies

See `database-schema.md` for complete schema details.

## 🔔 Push Notifications

### Web Push Integration
- Uses `web-push` library with VAPID keys
- Automatic notifications for emergency alerts
- High-priority announcements trigger notifications
- Supports subscription management

### Notification Types
- **Emergency Alerts**: Immediate push to all venue subscribers
- **High Priority Announcements**: Push notifications enabled
- **General Announcements**: Display only (no push)

## 🛡️ Security Features

### Authentication & Authorization
- JWT-based admin authentication
- Row Level Security (RLS) policies
- Service role for backend operations
- Secure admin password protection

### Data Protection
- Input validation on all endpoints
- SQL injection protection via Supabase
- CORS configuration for allowed origins
- Request size limits (10MB)

## 🚨 Emergency Features

### Real-time Capabilities
- Immediate alert broadcasting
- Geofencing-based subscriptions
- Auto-expiring temporary announcements
- QR code venue access

### Alert Severity Levels
- **critical**: Life-threatening emergencies
- **high**: Serious safety concerns
- **medium**: Important notifications
- **low**: General information

## 📱 Integration Points

### Frontend Integration
```javascript
// Example API call
const response = await fetch('/api/venues/123/alerts');
const alerts = await response.json();
```

### PWA Integration
- QR code scanning for venue access
- Service worker for offline notifications
- Geolocation for automatic venue detection

## 🔍 Monitoring & Debugging

### Logging
- Request logging middleware
- Error tracking and reporting
- Console output for development

### Health Check
```bash
GET /health
# Returns server status and timestamp
```

## 🚀 Deployment

### Production Checklist
1. Set `NODE_ENV=production`
2. Update CORS origins for production domain
3. Configure Supabase production environment
4. Set strong JWT secret and admin password
5. Enable HTTPS for web push notifications

### Scaling Considerations
- Supabase auto-scaling for database
- Horizontal scaling for Express server
- CDN for QR code images
- Push notification rate limiting

## 📞 Emergency Contacts

For hackathon support and questions:
- Backend API: `http://localhost:3000/health`
- Database: Supabase Dashboard
- Documentation: `database-schema.md`

---

**Built for 24-hour Hackathon** | **Hours 2-4: Backend Development** | **Status: ✅ COMPLETE**