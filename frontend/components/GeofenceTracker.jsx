/**
 * GeofenceTracker Component
 * React component for managing geofence tracking UI
 */

import React, { useState, useEffect, useCallback } from 'react';
import geolocationService from '../services/geolocation.service';

const GeofenceTracker = ({ venueId, venueName, onStatusChange }) => {
  const [trackingStatus, setTrackingStatus] = useState({
    isTracking: false,
    permission: 'prompt',
    currentLocation: null,
    insideGeofence: false,
    lastUpdate: null,
    error: null
  });

  const [stats, setStats] = useState({
    updateCount: 0,
    accuracy: null,
    distance: null
  });

  /**
   * Initialize geolocation tracking
   */
  useEffect(() => {
    const initializeTracking = async () => {
      // Check if geolocation is supported
      if (!geolocationService.isSupported()) {
        setTrackingStatus(prev => ({
          ...prev,
          error: 'Geolocation is not supported by your device'
        }));
        return;
      }

      // Check current permission status
      const permission = await geolocationService.checkPermission();
      setTrackingStatus(prev => ({ ...prev, permission }));

      if (permission === 'granted') {
        await startTracking();
      }
    };

    initializeTracking();

    // Cleanup on unmount
    return () => {
      if (trackingStatus.isTracking) {
        geolocationService.stopTracking();
      }
    };
  }, []);

  /**
   * Start location tracking
   */
  const startTracking = async () => {
    try {
      await geolocationService.startTracking({
        onUpdate: handleLocationUpdate,
        onError: handleLocationError
      });

      setTrackingStatus(prev => ({
        ...prev,
        isTracking: true,
        permission: 'granted',
        error: null
      }));

      if (onStatusChange) {
        onStatusChange({ tracking: true, error: null });
      }
    } catch (error) {
      handleLocationError(error);
    }
  };

  /**
   * Stop location tracking
   */
  const stopTracking = () => {
    geolocationService.stopTracking();
    setTrackingStatus(prev => ({
      ...prev,
      isTracking: false
    }));

    if (onStatusChange) {
      onStatusChange({ tracking: false });
    }
  };

  /**
   * Handle location update
   */
  const handleLocationUpdate = useCallback(async (position) => {
    console.log('📍 Location update received:', position);

    // Update state
    setTrackingStatus(prev => ({
      ...prev,
      currentLocation: position,
      lastUpdate: new Date(),
      error: null
    }));

    setStats(prev => ({
      ...prev,
      updateCount: prev.updateCount + 1,
      accuracy: position.accuracy
    }));

    // Send to backend
    try {
      const token = localStorage.getItem('authToken');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      
      const response = await geolocationService.sendLocationToBackend(apiUrl, token);
      
      if (response.success) {
        const isInside = response.venues?.inside?.includes(venueId);
        setTrackingStatus(prev => ({
          ...prev,
          insideGeofence: isInside
        }));

        if (onStatusChange) {
          onStatusChange({
            tracking: true,
            inside: isInside,
            venues: response.venues
          });
        }
      }
    } catch (error) {
      console.error('Failed to send location to server:', error);
      // Don't stop tracking on API errors, just log
    }
  }, [venueId, onStatusChange]);

  /**
   * Handle location error
   */
  const handleLocationError = useCallback((error) => {
    console.error('❌ Geolocation error:', error);
    
    setTrackingStatus(prev => ({
      ...prev,
      error: error.message,
      isTracking: false
    }));

    if (onStatusChange) {
      onStatusChange({ tracking: false, error: error.message });
    }
  }, [onStatusChange]);

  /**
   * Request location permission
   */
  const requestPermission = async () => {
    try {
      await geolocationService.requestPermission();
      await startTracking();
    } catch (error) {
      handleLocationError(error);
    }
  };

  /**
   * Format time ago
   */
  const timeAgo = (date) => {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="geofence-tracker">
      <div className="tracker-header">
        <h3>📍 Location Tracking</h3>
        <span className={`status-badge ${trackingStatus.isTracking ? 'active' : 'inactive'}`}>
          {trackingStatus.isTracking ? '🟢 Active' : '🔴 Inactive'}
        </span>
      </div>

      <div className="tracker-body">
        {/* Permission Status */}
        {trackingStatus.permission === 'prompt' && (
          <div className="permission-request">
            <p>📍 Location access required to receive emergency alerts</p>
            <button onClick={requestPermission} className="btn-primary">
              Enable Location Tracking
            </button>
          </div>
        )}

        {trackingStatus.permission === 'denied' && (
          <div className="permission-denied">
            <p>❌ Location permission denied</p>
            <small>Please enable location access in your browser settings</small>
          </div>
        )}

        {/* Tracking Active */}
        {trackingStatus.isTracking && (
          <div className="tracking-info">
            <div className="info-row">
              <span className="label">Venue:</span>
              <span className="value">{venueName || 'Unknown'}</span>
            </div>

            <div className="info-row">
              <span className="label">Status:</span>
              <span className={`value ${trackingStatus.insideGeofence ? 'inside' : 'outside'}`}>
                {trackingStatus.insideGeofence ? '✅ Inside Geofence' : '❌ Outside Geofence'}
              </span>
            </div>

            {trackingStatus.currentLocation && (
              <>
                <div className="info-row">
                  <span className="label">Location:</span>
                  <span className="value">
                    {trackingStatus.currentLocation.lat.toFixed(6)}, 
                    {trackingStatus.currentLocation.lon.toFixed(6)}
                  </span>
                </div>

                <div className="info-row">
                  <span className="label">Accuracy:</span>
                  <span className="value">±{Math.round(stats.accuracy)}m</span>
                </div>
              </>
            )}

            <div className="info-row">
              <span className="label">Last Update:</span>
              <span className="value">{timeAgo(trackingStatus.lastUpdate)}</span>
            </div>

            <div className="info-row">
              <span className="label">Updates:</span>
              <span className="value">{stats.updateCount}</span>
            </div>

            <button onClick={stopTracking} className="btn-secondary">
              Stop Tracking
            </button>
          </div>
        )}

        {/* Error Display */}
        {trackingStatus.error && (
          <div className="error-message">
            ⚠️ {trackingStatus.error}
          </div>
        )}
      </div>

      <style jsx>{`
        .geofence-tracker {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          max-width: 500px;
        }

        .tracker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .tracker-header h3 {
          margin: 0;
          font-size: 18px;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge.active {
          background: #10b981;
          color: white;
        }

        .status-badge.inactive {
          background: #ef4444;
          color: white;
        }

        .permission-request,
        .permission-denied {
          text-align: center;
          padding: 20px;
        }

        .tracking-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .info-row .label {
          font-weight: 600;
          color: #6b7280;
        }

        .info-row .value {
          color: #1f2937;
        }

        .value.inside {
          color: #10b981;
          font-weight: 600;
        }

        .value.outside {
          color: #ef4444;
        }

        .btn-primary,
        .btn-secondary {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #1f2937;
          margin-top: 12px;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }

        .error-message {
          padding: 12px;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 8px;
          margin-top: 12px;
        }
      `}</style>
    </div>
  );
};

export default GeofenceTracker;
