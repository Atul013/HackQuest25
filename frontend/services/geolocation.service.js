/**
 * Frontend Geolocation Service
 * Handles browser geolocation API and periodic location updates
 */

class GeolocationService {
  constructor() {
    this.isTracking = false;
    this.watchId = null;
    this.updateInterval = null;
    this.currentPosition = null;
    this.permissionStatus = 'prompt'; // 'granted', 'denied', 'prompt'
    
    // Configuration
    this.UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
    this.HIGH_ACCURACY = true;
    this.TIMEOUT = 10000; // 10 seconds
    this.MAX_AGE = 60000; // 1 minute
    
    // Callbacks
    this.onLocationUpdate = null;
    this.onError = null;
  }

  /**
   * Check if geolocation is supported by browser
   */
  isSupported() {
    return 'geolocation' in navigator;
  }

  /**
   * Check current permission status
   */
  async checkPermission() {
    if (!('permissions' in navigator)) {
      return 'prompt';
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      this.permissionStatus = result.state;
      
      // Listen for permission changes
      result.addEventListener('change', () => {
        this.permissionStatus = result.state;
        console.log('🗺️ Geolocation permission changed:', result.state);
      });
      
      return result.state;
    } catch (error) {
      console.warn('Could not check permission:', error);
      return 'prompt';
    }
  }

  /**
   * Request location permission and get current position
   */
  async requestPermission() {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported by your browser');
    }

    return new Promise((resolve, reject) => {
      const options = {
        enableHighAccuracy: this.HIGH_ACCURACY,
        timeout: this.TIMEOUT,
        maximumAge: this.MAX_AGE
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.permissionStatus = 'granted';
          this.currentPosition = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          resolve(this.currentPosition);
        },
        (error) => {
          this.permissionStatus = 'denied';
          reject(this.handleError(error));
        },
        options
      );
    });
  }

  /**
   * Start tracking user location
   */
  async startTracking(callbacks = {}) {
    if (this.isTracking) {
      console.warn('⚠️ Location tracking already active');
      return;
    }

    // Set callbacks
    this.onLocationUpdate = callbacks.onUpdate;
    this.onError = callbacks.onError;

    // Check permission first
    const permission = await this.checkPermission();
    if (permission === 'denied') {
      throw new Error('Location permission denied');
    }

    // Get initial position
    try {
      await this.requestPermission();
      console.log('✅ Initial location obtained:', this.currentPosition);
      
      // Notify callback
      if (this.onLocationUpdate) {
        this.onLocationUpdate(this.currentPosition);
      }
    } catch (error) {
      if (this.onError) {
        this.onError(error);
      }
      throw error;
    }

    // Start watching position changes
    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePositionUpdate(position),
      (error) => this.handlePositionError(error),
      {
        enableHighAccuracy: this.HIGH_ACCURACY,
        timeout: this.TIMEOUT,
        maximumAge: this.MAX_AGE
      }
    );

    // Also set up periodic updates (fallback)
    this.updateInterval = setInterval(() => {
      this.getCurrentPosition();
    }, this.UPDATE_INTERVAL);

    this.isTracking = true;
    console.log('🗺️ Location tracking started');
  }

  /**
   * Stop tracking user location
   */
  stopTracking() {
    if (!this.isTracking) {
      return;
    }

    // Clear watch position
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    // Clear interval
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.isTracking = false;
    console.log('🛑 Location tracking stopped');
  }

  /**
   * Get current position once
   */
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          this.currentPosition = pos;
          resolve(pos);
        },
        (error) => reject(this.handleError(error)),
        {
          enableHighAccuracy: this.HIGH_ACCURACY,
          timeout: this.TIMEOUT,
          maximumAge: this.MAX_AGE
        }
      );
    });
  }

  /**
   * Handle position update from watch
   */
  handlePositionUpdate(position) {
    this.currentPosition = {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp
    };

    console.log('📍 Location updated:', this.currentPosition);

    if (this.onLocationUpdate) {
      this.onLocationUpdate(this.currentPosition);
    }
  }

  /**
   * Handle position error
   */
  handlePositionError(error) {
    const errorObj = this.handleError(error);
    console.error('❌ Location error:', errorObj);

    if (this.onError) {
      this.onError(errorObj);
    }
  }

  /**
   * Parse geolocation error
   */
  handleError(error) {
    const errorMessages = {
      1: 'Location permission denied',
      2: 'Location unavailable',
      3: 'Location request timeout'
    };

    return {
      code: error.code,
      message: errorMessages[error.code] || 'Unknown location error',
      originalError: error
    };
  }

  /**
   * Calculate distance to a point
   */
  distanceTo(targetLat, targetLon) {
    if (!this.currentPosition) {
      return null;
    }

    const R = 6371000; // Earth radius in meters
    const φ1 = this.currentPosition.lat * Math.PI / 180;
    const φ2 = targetLat * Math.PI / 180;
    const Δφ = (targetLat - this.currentPosition.lat) * Math.PI / 180;
    const Δλ = (targetLon - this.currentPosition.lon) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Send location update to backend
   */
  async sendLocationToBackend(apiUrl, authToken) {
    if (!this.currentPosition) {
      throw new Error('No location data available');
    }

    try {
      const response = await fetch(`${apiUrl}/api/geofence/update-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          lat: this.currentPosition.lat,
          lon: this.currentPosition.lon,
          accuracy: this.currentPosition.accuracy,
          timestamp: this.currentPosition.timestamp
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to send location to backend:', error);
      throw error;
    }
  }

  /**
   * Get tracking status
   */
  getStatus() {
    return {
      isTracking: this.isTracking,
      hasPermission: this.permissionStatus === 'granted',
      permissionStatus: this.permissionStatus,
      currentPosition: this.currentPosition,
      isSupported: this.isSupported()
    };
  }
}

// Export singleton instance
export default new GeolocationService();
