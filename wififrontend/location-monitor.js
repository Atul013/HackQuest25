/**
 * Location Monitoring Service
 * Continuously tracks user location every 2 minutes
 * Auto-unsubscribes from announcements if user exits geofence
 */

class LocationMonitorService {
  constructor() {
    this.intervalId = null;
    this.UPDATE_INTERVAL = 2 * 60 * 1000; // 2 minutes
    this.userId = null;
    this.lastKnownLocation = null;
    this.isMonitoring = false;
    this.venueId = null;
    
    // Supabase client (should be initialized in parent)
    this.supabase = window.supabase_js?.createClient(
      'https://akblmbpxxotmebzghczj.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrYmxtYnB4eG90bWViemdoY3pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNzQxMDUsImV4cCI6MjA3NTY1MDEwNX0.6d8XmmmoSh0hY8OWoymIEX7UnQU6qpgyQsyIe7_KHtI'
    );
  }

  /**
   * Start monitoring user location
   * @param {string} userId - User's phone number or unique ID
   * @param {number} initialLat - Initial latitude
   * @param {number} initialLon - Initial longitude
   */
  async startMonitoring(userId, initialLat, initialLon) {
    if (this.isMonitoring) {
      console.log('⚠️ Location monitoring already active');
      return;
    }

    this.userId = userId;
    this.lastKnownLocation = { lat: initialLat, lon: initialLon };
    this.isMonitoring = true;

    console.log('📍 Starting location monitoring...');
    console.log(`   User ID: ${userId}`);
    console.log(`   Initial: ${initialLat}, ${initialLon}`);
    console.log(`   Interval: ${this.UPDATE_INTERVAL / 1000} seconds`);

    // Check initial geofence status
    await this.checkGeofenceStatus(initialLat, initialLon);

    // Set up periodic location checks
    this.intervalId = setInterval(async () => {
      await this.updateLocation();
    }, this.UPDATE_INTERVAL);

    // Store monitoring state in localStorage
    this.saveMonitoringState();

    console.log('✅ Location monitoring active');
  }

  /**
   * Update current location and check geofence
   */
  async updateLocation() {
    if (!this.isMonitoring || !this.userId) {
      console.warn('⚠️ Monitoring not active, skipping update');
      return;
    }

    console.log('🔄 Updating location...');

    try {
      // Get current location
      const position = await this.getCurrentPosition();
      
      if (position) {
        const { latitude, longitude, accuracy } = position.coords;
        
        console.log(`📍 New location: ${latitude}, ${longitude} (±${accuracy}m)`);
        
        this.lastKnownLocation = {
          lat: latitude,
          lon: longitude,
          accuracy: accuracy,
          timestamp: Date.now()
        };

        // Check geofence status
        await this.checkGeofenceStatus(latitude, longitude);

        // Update database
        await this.updateDatabaseLocation(latitude, longitude, accuracy);

        // Save state
        this.saveMonitoringState();
      }
    } catch (error) {
      console.error('❌ Location update failed:', error);
      
      // If location permission denied, stop monitoring
      if (error.code === 1) { // PERMISSION_DENIED
        console.warn('⚠️ Location permission denied, stopping monitoring');
        this.stopMonitoring();
        this.notifyUserAboutLocationLoss();
      }
    }
  }

  /**
   * Get current GPS position
   */
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000 // Accept 1-minute cached location
        }
      );
    });
  }

  /**
   * Check if user is inside any geofence
   */
  async checkGeofenceStatus(lat, lon) {
    console.log('🔍 Checking geofence status...');

    try {
      // Fetch all active venues
      const { data: venues, error } = await this.supabase
        .from('venues')
        .select('*')
        .eq('active', true);

      if (error) throw error;

      if (!venues || venues.length === 0) {
        console.warn('⚠️ No active venues found');
        return;
      }

      console.log(`   Checking against ${venues.length} venues...`);

      let insideAnyVenue = false;
      let currentVenue = null;

      // Check each venue
      for (const venue of venues) {
        const isInside = this.isPointInGeofence(lat, lon, venue);
        
        if (isInside) {
          insideAnyVenue = true;
          currentVenue = venue;
          console.log(`✅ INSIDE: ${venue.name}`);
          
          // Update venue association in database
          await this.associateWithVenue(venue.id);
          break;
        }
      }

      if (!insideAnyVenue) {
        console.log('❌ OUTSIDE all geofences');
        
        // Check if user was previously inside a venue
        if (this.venueId) {
          console.warn('🚪 User has LEFT the geofenced area!');
          await this.handleGeofenceExit();
        }
        
        // Clear venue association
        await this.associateWithVenue(null);
      } else {
        this.venueId = currentVenue.id;
      }

    } catch (error) {
      console.error('❌ Geofence check failed:', error);
    }
  }

  /**
   * Check if point is inside a venue's geofence
   * Supports both circular and polygon geofences
   */
  isPointInGeofence(lat, lon, venue) {
    // If venue has polygon boundary (custom shape)
    if (venue.polygon_coordinates && Array.isArray(venue.polygon_coordinates)) {
      return this.isPointInPolygon(lat, lon, venue.polygon_coordinates);
    }

    // Otherwise use circular geofence (radius-based)
    const distance = this.calculateDistance(
      lat,
      lon,
      venue.latitude,
      venue.longitude
    );

    return distance <= (venue.radius || 500);
  }

  /**
   * Point-in-polygon check using Ray Casting algorithm
   */
  isPointInPolygon(lat, lon, polygon) {
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const lat_i = polygon[i][0];
      const lon_i = polygon[i][1];
      const lat_j = polygon[j][0];
      const lon_j = polygon[j][1];
      
      const intersect = ((lon_i > lon) !== (lon_j > lon)) &&
        (lat < (lat_j - lat_i) * (lon - lon_i) / (lon_j - lon_i) + lat_i);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Update location in database
   */
  async updateDatabaseLocation(lat, lon, accuracy) {
    try {
      const { error } = await this.supabase
        .from('wifi_subscriptions')
        .update({
          last_latitude: lat,
          last_longitude: lon,
          location_accuracy: accuracy,
          last_seen: new Date().toISOString()
        })
        .eq('phone', this.userId);

      if (error) throw error;

      console.log('✅ Database location updated');
    } catch (error) {
      console.error('❌ Failed to update database:', error);
    }
  }

  /**
   * Associate user with venue
   */
  async associateWithVenue(venueId) {
    try {
      const { error } = await this.supabase
        .from('wifi_subscriptions')
        .update({
          venue_id: venueId,
          last_seen: new Date().toISOString()
        })
        .eq('phone', this.userId);

      if (error) throw error;

      if (venueId) {
        console.log(`✅ Associated with venue: ${venueId}`);
      } else {
        console.log('ℹ️ Venue association cleared');
      }
    } catch (error) {
      console.error('❌ Failed to associate with venue:', error);
    }
  }

  /**
   * Handle user exiting geofence
   */
  async handleGeofenceExit() {
    console.log('========================================');
    console.log('🚪 USER EXITED GEOFENCE');
    console.log('========================================');
    console.log('Actions:');
    console.log('  1. Clearing venue association');
    console.log('  2. User will NO LONGER receive announcements');
    console.log('  3. Monitoring continues (in case user returns)');
    console.log('========================================');

    // Mark as inactive for announcements (but keep monitoring)
    try {
      const { error } = await this.supabase
        .from('wifi_subscriptions')
        .update({
          venue_id: null,
          active: false, // No more announcements
          last_seen: new Date().toISOString()
        })
        .eq('phone', this.userId);

      if (error) throw error;

      console.log('✅ User marked as inactive for announcements');
      
      // Clear local venue ID
      this.venueId = null;

      // Notify user
      this.notifyUserAboutGeofenceExit();

    } catch (error) {
      console.error('❌ Failed to handle geofence exit:', error);
    }
  }

  /**
   * Notify user about geofence exit
   */
  notifyUserAboutGeofenceExit() {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('AlertNet Status', {
        body: 'You have left the emergency alert zone. You will no longer receive location-specific announcements.',
        icon: '/icon-alert.png'
      });
    }

    console.log('📱 User notified about geofence exit');
  }

  /**
   * Notify user about location permission loss
   */
  notifyUserAboutLocationLoss() {
    alert('⚠️ Location access lost!\n\nYou will no longer receive location-based emergency alerts.\n\nPlease enable location permissions to continue receiving alerts.');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isMonitoring = false;
    console.log('🛑 Location monitoring stopped');

    // Clear saved state
    localStorage.removeItem('alertnet_monitoring');
  }

  /**
   * Save monitoring state to localStorage
   */
  saveMonitoringState() {
    try {
      const state = {
        userId: this.userId,
        venueId: this.venueId,
        lastLocation: this.lastKnownLocation,
        isMonitoring: this.isMonitoring,
        savedAt: Date.now()
      };

      localStorage.setItem('alertnet_monitoring', JSON.stringify(state));
    } catch (error) {
      console.warn('Could not save monitoring state:', error);
    }
  }

  /**
   * Restore monitoring state from localStorage
   */
  async restoreMonitoringState() {
    try {
      const savedState = localStorage.getItem('alertnet_monitoring');
      if (!savedState) return false;

      const state = JSON.parse(savedState);
      
      // Check if state is recent (within last 30 minutes)
      const timeSinceLastSave = Date.now() - state.savedAt;
      if (timeSinceLastSave > 30 * 60 * 1000) {
        console.log('ℹ️ Monitoring state is stale, not restoring');
        return false;
      }

      // Restore monitoring
      if (state.isMonitoring && state.userId && state.lastLocation) {
        console.log('🔄 Restoring location monitoring...');
        await this.startMonitoring(
          state.userId,
          state.lastLocation.lat,
          state.lastLocation.lon
        );
        return true;
      }

      return false;
    } catch (error) {
      console.warn('Could not restore monitoring state:', error);
      return false;
    }
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      userId: this.userId,
      venueId: this.venueId,
      lastLocation: this.lastKnownLocation,
      updateInterval: this.UPDATE_INTERVAL / 1000, // in seconds
      nextUpdateIn: this.intervalId ? 'Active' : 'Stopped'
    };
  }
}

// Create global instance
window.locationMonitor = new LocationMonitorService();
console.log('✅ Location Monitoring Service loaded');

// Auto-restore on page load
document.addEventListener('DOMContentLoaded', async () => {
  const restored = await window.locationMonitor.restoreMonitoringState();
  if (restored) {
    console.log('✅ Location monitoring restored from previous session');
  }
});
