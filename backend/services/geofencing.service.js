/**
 * Geofencing Service
 * Handles location tracking, geofence boundary checking, and auto-unsubscribe logic
 */

const { calculateDistance, isPointInPolygon } = require('../utils/geoUtils');
const db = require('../database/db');
const redis = require('../database/redis');

class GeofencingService {
  constructor() {
    // Cache for active geofences (venue_id -> geofence data)
    this.geofenceCache = new Map();
    
    // Tracking update intervals (in milliseconds)
    this.UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
    this.EXIT_GRACE_PERIOD = 30 * 60 * 1000; // 30 minutes
    
    // Initialize cache from database
    this.initializeCache();
  }

  /**
   * Initialize geofence cache from database
   */
  async initializeCache() {
    try {
      const { data: venues, error } = await db.supabase
        .from('venues')
        .select('id, name, latitude, longitude, radius')
        .eq('active', true);
      
      if (error) throw error;
      
      if (venues) {
        venues.forEach(venue => {
          this.geofenceCache.set(venue.id, {
            id: venue.id,
            name: venue.name,
            center: {
              lat: venue.latitude,
              lon: venue.longitude
            },
            radius: venue.radius || 500, // default 500 meters
            polygon: null // TODO: Add polygon support later
          });
        });
      }
      
      console.log(`✅ Initialized ${this.geofenceCache.size} geofences`);
    } catch (error) {
      console.error('Failed to initialize geofence cache:', error.message);
    }
  }

  /**
   * Check if user is inside a venue's geofence
   * @param {number} venueId - Venue ID
   * @param {number} userLat - User latitude
   * @param {number} userLon - User longitude
   * @returns {boolean} - True if inside geofence
   */
  isInsideGeofence(venueId, userLat, userLon) {
    const geofence = this.geofenceCache.get(venueId);
    
    if (!geofence) {
      console.warn(`Geofence not found for venue ${venueId}`);
      return false;
    }

    // If venue has a custom polygon boundary
    if (geofence.polygon && geofence.polygon.length > 0) {
      return isPointInPolygon(userLat, userLon, geofence.polygon);
    }

    // Otherwise use circular geofence (radius-based)
    const distance = calculateDistance(
      userLat,
      userLon,
      geofence.center.lat,
      geofence.center.lon
    );

    return distance <= geofence.radius;
  }

  /**
   * Update user location and check geofence status
   * @param {string} userId - User device ID
   * @param {number} lat - Current latitude
   * @param {number} lon - Current longitude
   * @returns {object} - Location update result
   */
  async updateUserLocation(userId, lat, lon) {
    try {
      // Validate coordinates
      if (!this.isValidCoordinate(lat, lon)) {
        return { success: false, error: 'Invalid coordinates' };
      }

      // Get user's current subscriptions
      const subscriptions = await this.getUserSubscriptions(userId);
      
      const locationUpdate = {
        userId,
        lat,
        lon,
        timestamp: Date.now(),
        insideGeofences: [],
        outsideGeofences: []
      };

      // Check each subscription against geofence
      for (const sub of subscriptions) {
        const isInside = this.isInsideGeofence(sub.venue_id, lat, lon);
        
        if (isInside) {
          locationUpdate.insideGeofences.push(sub.venue_id);
          // Update last seen location
          await this.updateLastSeen(userId, sub.venue_id, lat, lon);
        } else {
          locationUpdate.outsideGeofences.push(sub.venue_id);
          // Mark as outside, schedule for unsubscribe
          await this.scheduleUnsubscribe(userId, sub.venue_id);
        }
      }

      // Store location in Redis for quick access
      await this.cacheUserLocation(userId, lat, lon);

      // Log location update
      await this.logLocationUpdate(userId, lat, lon, locationUpdate);

      return {
        success: true,
        ...locationUpdate
      };

    } catch (error) {
      console.error('Error updating user location:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's active subscriptions
   */
  async getUserSubscriptions(userId) {
    const result = await db.query(`
      SELECT venue_id, subscribed_at, last_seen_at
      FROM subscriptions
      WHERE user_id = $1 
        AND active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    `, [userId]);
    
    return result.rows;
  }

  /**
   * Update user's last seen location in venue
   */
  async updateLastSeen(userId, venueId, lat, lon) {
    await db.query(`
      UPDATE subscriptions
      SET last_seen_at = NOW(),
          last_location = ST_SetSRID(ST_MakePoint($3, $4), 4326),
          outside_since = NULL
      WHERE user_id = $1 AND venue_id = $2
    `, [userId, venueId, lon, lat]);
  }

  /**
   * Schedule user for unsubscribe after grace period
   */
  async scheduleUnsubscribe(userId, venueId) {
    // Check if already marked as outside
    const result = await db.query(`
      SELECT outside_since
      FROM subscriptions
      WHERE user_id = $1 AND venue_id = $2
    `, [userId, venueId]);

    if (result.rows.length === 0) return;

    const outsideSince = result.rows[0].outside_since;

    if (!outsideSince) {
      // First time detected outside, mark timestamp
      await db.query(`
        UPDATE subscriptions
        SET outside_since = NOW()
        WHERE user_id = $1 AND venue_id = $2
      `, [userId, venueId]);
    } else {
      // Check if grace period has elapsed
      const elapsedTime = Date.now() - new Date(outsideSince).getTime();
      
      if (elapsedTime >= this.EXIT_GRACE_PERIOD) {
        // Grace period over, unsubscribe
        await this.unsubscribeUser(userId, venueId);
        console.log(`🚪 Auto-unsubscribed user ${userId} from venue ${venueId}`);
      }
    }
  }

  /**
   * Unsubscribe user from venue
   */
  async unsubscribeUser(userId, venueId) {
    await db.query(`
      UPDATE subscriptions
      SET active = false,
          unsubscribed_at = NOW(),
          unsubscribe_reason = 'geofence_exit'
      WHERE user_id = $1 AND venue_id = $2
    `, [userId, venueId]);

    // Remove from real-time notification room
    await redis.srem(`venue:${venueId}:users`, userId);
  }

  /**
   * Cache user location in Redis (for quick lookups)
   */
  async cacheUserLocation(userId, lat, lon) {
    const locationKey = `user:${userId}:location`;
    await redis.setex(locationKey, 3600, JSON.stringify({
      lat,
      lon,
      timestamp: Date.now()
    }));
  }

  /**
   * Log location update for analytics
   */
  async logLocationUpdate(userId, lat, lon, updateInfo) {
    await db.query(`
      INSERT INTO location_logs (user_id, latitude, longitude, inside_geofences, outside_geofences, logged_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      userId,
      lat,
      lon,
      JSON.stringify(updateInfo.insideGeofences),
      JSON.stringify(updateInfo.outsideGeofences)
    ]);
  }

  /**
   * Validate coordinate values
   */
  isValidCoordinate(lat, lon) {
    return (
      typeof lat === 'number' &&
      typeof lon === 'number' &&
      lat >= -90 && lat <= 90 &&
      lon >= -180 && lon <= 180
    );
  }

  /**
   * Get users currently inside a venue's geofence
   */
  async getUsersInVenue(venueId) {
    const result = await db.query(`
      SELECT u.id, u.device_id, u.fcm_token, s.last_location
      FROM users u
      JOIN subscriptions s ON u.id = s.user_id
      WHERE s.venue_id = $1 
        AND s.active = true
        AND s.last_seen_at > NOW() - INTERVAL '10 minutes'
    `, [venueId]);

    return result.rows;
  }

  /**
   * Run periodic cleanup job (remove stale subscriptions)
   */
  async runCleanupJob() {
    console.log('🧹 Running geofence cleanup job...');
    
    try {
      // Unsubscribe users who have been outside for > 30 minutes
      const result = await db.query(`
        UPDATE subscriptions
        SET active = false,
            unsubscribed_at = NOW(),
            unsubscribe_reason = 'geofence_exit_timeout'
        WHERE active = true
          AND outside_since IS NOT NULL
          AND outside_since < NOW() - INTERVAL '30 minutes'
        RETURNING user_id, venue_id
      `);

      if (result.rows.length > 0) {
        console.log(`🚪 Auto-unsubscribed ${result.rows.length} users`);
        
        // Remove from Redis notification rooms
        for (const row of result.rows) {
          await redis.srem(`venue:${row.venue_id}:users`, row.user_id);
        }
      }

      // Clean up old location logs (keep last 7 days)
      await db.query(`
        DELETE FROM location_logs
        WHERE logged_at < NOW() - INTERVAL '7 days'
      `);

    } catch (error) {
      console.error('Cleanup job failed:', error);
    }
  }

  /**
   * Get geofence statistics for analytics
   */
  async getGeofenceStats(venueId) {
    const stats = await db.query(`
      SELECT 
        COUNT(DISTINCT user_id) as total_users,
        COUNT(DISTINCT CASE WHEN last_seen_at > NOW() - INTERVAL '5 minutes' THEN user_id END) as active_users,
        AVG(EXTRACT(EPOCH FROM (unsubscribed_at - subscribed_at))) as avg_duration_seconds
      FROM subscriptions
      WHERE venue_id = $1
        AND subscribed_at > NOW() - INTERVAL '24 hours'
    `, [venueId]);

    return stats.rows[0];
  }
}

module.exports = new GeofencingService();
