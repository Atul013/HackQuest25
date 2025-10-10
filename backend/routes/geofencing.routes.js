/**
 * Geofencing API Routes
 * Endpoints for location tracking and geofence management
 */

const express = require('express');
const router = express.Router();
const geofencingService = require('../services/geofencing.service');
const { authenticateUser } = require('../middleware/auth');
const { validateLocation } = require('../middleware/validation');

/**
 * POST /api/geofence/check-location
 * Check if user is inside venue geofence
 */
router.post('/check-location', authenticateUser, validateLocation, async (req, res) => {
  try {
    const { userId } = req.user;
    const { lat, lon, venueId } = req.body;

    // Check if inside specific venue
    if (venueId) {
      const isInside = geofencingService.isInsideGeofence(venueId, lat, lon);
      return res.json({
        success: true,
        venueId,
        isInside,
        location: { lat, lon }
      });
    }

    // Update location across all subscriptions
    const result = await geofencingService.updateUserLocation(userId, lat, lon);
    
    res.json(result);
  } catch (error) {
    console.error('Check location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check location'
    });
  }
});

/**
 * POST /api/geofence/update-location
 * Update user's current location (called periodically by client)
 */
router.post('/update-location', authenticateUser, validateLocation, async (req, res) => {
  try {
    const { userId } = req.user;
    const { lat, lon } = req.body;

    const result = await geofencingService.updateUserLocation(userId, lat, lon);

    // Return status for each venue
    res.json({
      success: true,
      timestamp: Date.now(),
      location: { lat, lon },
      venues: {
        inside: result.insideGeofences,
        outside: result.outsideGeofences
      }
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update location'
    });
  }
});

/**
 * GET /api/geofence/status
 * Get user's current geofence subscription status
 */
router.get('/status', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.user;

    const subscriptions = await geofencingService.getUserSubscriptions(userId);

    const status = await Promise.all(subscriptions.map(async (sub) => {
      const stats = await geofencingService.getGeofenceStats(sub.venue_id);
      return {
        venueId: sub.venue_id,
        subscribedAt: sub.subscribed_at,
        lastSeenAt: sub.last_seen_at,
        isActive: true,
        ...stats
      };
    }));

    res.json({
      success: true,
      userId,
      activeSubscriptions: status.length,
      subscriptions: status
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get status'
    });
  }
});

/**
 * GET /api/geofence/venue/:venueId/users
 * Get all users currently in venue geofence (admin only)
 */
router.get('/venue/:venueId/users', authenticateUser, async (req, res) => {
  try {
    const { venueId } = req.params;

    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const users = await geofencingService.getUsersInVenue(venueId);

    res.json({
      success: true,
      venueId,
      userCount: users.length,
      users: users.map(u => ({
        userId: u.id,
        deviceId: u.device_id,
        lastLocation: u.last_location
      }))
    });
  } catch (error) {
    console.error('Get venue users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get venue users'
    });
  }
});

/**
 * GET /api/geofence/venue/:venueId/stats
 * Get geofence analytics for a venue (admin only)
 */
router.get('/venue/:venueId/stats', authenticateUser, async (req, res) => {
  try {
    const { venueId } = req.params;

    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const stats = await geofencingService.getGeofenceStats(venueId);

    res.json({
      success: true,
      venueId,
      stats: {
        totalUsers: parseInt(stats.total_users),
        activeUsers: parseInt(stats.active_users),
        averageDurationMinutes: stats.avg_duration_seconds 
          ? Math.round(stats.avg_duration_seconds / 60) 
          : 0
      }
    });
  } catch (error) {
    console.error('Get venue stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get venue stats'
    });
  }
});

/**
 * POST /api/geofence/manual-unsubscribe
 * Manually unsubscribe from venue (user initiated)
 */
router.post('/manual-unsubscribe', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.user;
    const { venueId } = req.body;

    if (!venueId) {
      return res.status(400).json({
        success: false,
        error: 'venueId is required'
      });
    }

    await geofencingService.unsubscribeUser(userId, venueId);

    res.json({
      success: true,
      message: 'Successfully unsubscribed from venue',
      venueId
    });
  } catch (error) {
    console.error('Manual unsubscribe error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unsubscribe'
    });
  }
});

module.exports = router;
