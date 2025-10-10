/**
 * Main Server File - Integration Example
 * Shows how to integrate geofencing with your Express app
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
require('dotenv').config();

// Import security middleware
const security = require('./config/security');

// Import routes
const geofencingRoutes = require('./routes/geofencing.routes');
const hapticAlertsRoutes = require('./routes/haptic-alerts.routes');

// Import services
const geofencingService = require('./services/geofencing.service');
const geofenceScheduler = require('./scheduler/geofence.scheduler');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST']
  }
});

// Security Middleware (PRODUCTION)
if (process.env.NODE_ENV === 'production') {
  app.use(security.helmet);
  app.use(security.cors);
} else {
  // Development: Allow all origins
  app.use(require('cors')());
}

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    services: {
      geofencing: geofencingService ? 'active' : 'inactive',
      scheduler: geofenceScheduler.isRunning ? 'active' : 'inactive'
    }
  });
});

// Mount geofencing routes
app.use('/api/geofence', geofencingRoutes);
app.use('/api/haptic-alerts', hapticAlertsRoutes);

// WebSocket connection for real-time alerts
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Subscribe to venue alerts
  socket.on('subscribe_venue', (venueId) => {
    socket.join(`venue_${venueId}`);
    console.log(`📍 Socket ${socket.id} subscribed to venue ${venueId}`);
  });

  // Unsubscribe from venue
  socket.on('unsubscribe_venue', (venueId) => {
    socket.leave(`venue_${venueId}`);
    console.log(`🚪 Socket ${socket.id} unsubscribed from venue ${venueId}`);
  });

  // Location update from client
  socket.on('location_update', async (data) => {
    try {
      const { userId, lat, lon } = data;
      const result = await geofencingService.updateUserLocation(userId, lat, lon);
      
      // Send acknowledgment back to client
      socket.emit('location_ack', {
        success: true,
        inside: result.insideGeofences,
        outside: result.outsideGeofences
      });
    } catch (error) {
      socket.emit('location_error', {
        message: error.message
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Broadcast alert to venue (called from alert service)
function broadcastAlertToVenue(venueId, alert) {
  io.to(`venue_${venueId}`).emit('emergency_alert', {
    id: alert.id,
    title: alert.title,
    message: alert.message,
    severity: alert.severity,
    type: alert.type,
    timestamp: new Date()
  });
  console.log(`📢 Alert broadcast to venue ${venueId}`);
}

// Example: Send test alert
app.post('/api/alerts/send', async (req, res) => {
  try {
    const { venueId, title, message, severity, type } = req.body;

    // Get all users in venue
    const users = await geofencingService.getUsersInVenue(venueId);
    
    // Broadcast via WebSocket
    broadcastAlertToVenue(venueId, { title, message, severity, type });

    // Also send push notifications (FCM integration would go here)
    // await sendPushNotifications(users, { title, message });

    res.json({
      success: true,
      sentTo: users.length,
      message: 'Alert sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start geofence scheduler
geofenceScheduler.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  // Stop scheduler
  geofenceScheduler.stop();
  
  // Close server
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  geofenceScheduler.stop();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║   🚨 PublicAlert Server Running                   ║
  ║   📍 Geofencing: ACTIVE                          ║
  ║   ⏰ Scheduler: RUNNING                          ║
  ║   🌐 Port: ${PORT}                                   ║
  ╚═══════════════════════════════════════════════════╝
  `);
});

module.exports = { app, server, io, broadcastAlertToVenue };
