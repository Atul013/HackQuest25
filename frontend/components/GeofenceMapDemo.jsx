import React, { useState, useEffect } from 'react';
import GeofenceMap from './GeofenceMap';

/**
 * GeofenceMapDemo Component
 * 
 * Complete demo interface with map visualization
 * Perfect for showing judges the geofencing system
 */

const GeofenceMapDemo = () => {
  const [venues, setVenues] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [manualLat, setManualLat] = useState('9.9710');
  const [manualLon, setManualLon] = useState('76.2910');
  const [error, setError] = useState(null);

  // Sample venues (Kochi, Kerala, India) - Precise KML coordinates
  const SAMPLE_VENUES = [
    {
      id: 1,
      name: 'Ernakulam Junction Railway Station',
      latitude: 9.9710,
      longitude: 76.2910,
      geofence_type: 'polygon',
      geofence_polygon: [
        [9.9742998, 76.2899817],
        [9.9693476, 76.2904496],
        [9.9691786, 76.2903102],
        [9.9685445, 76.290396],
        [9.9685234, 76.2907393],
        [9.9657971, 76.2917371],
        [9.9657232, 76.292059],
        [9.9669172, 76.2921341],
        [9.9686677, 76.2919773],
        [9.9720914, 76.2911941],
        [9.9743315, 76.2904431],
        [9.9742998, 76.2899817]
      ]
    },
    {
      id: 2,
      name: 'Cochin International Airport',
      latitude: 10.1540,
      longitude: 76.3950,
      geofence_type: 'polygon',
      geofence_polygon: [
        [10.159892, 76.385748],
        [10.1566815, 76.3858338],
        [10.1546539, 76.3828727],
        [10.1545272, 76.3802549],
        [10.1486976, 76.3804265],
        [10.1499649, 76.4200803],
        [10.1545272, 76.4195653],
        [10.1539358, 76.4045879],
        [10.1568083, 76.4044162],
        [10.1578221, 76.4011117],
        [10.1603144, 76.4005967],
        [10.159892, 76.385748]
      ]
    },
    {
      id: 3,
      name: 'Lulu Mall Kochi',
      latitude: 10.0280,
      longitude: 76.3100,
      geofence_type: 'polygon',
      geofence_polygon: [
        [10.0305599, 76.3069647],
        [10.027158, 76.3063425],
        [10.0264184, 76.3058275],
        [10.0252774, 76.3066643],
        [10.0250027, 76.3086599],
        [10.0265029, 76.3098615],
        [10.0270101, 76.3107842],
        [10.0257, 76.3120073],
        [10.0258479, 76.3130372],
        [10.0283835, 76.3127583],
        [10.0300316, 76.3099473],
        [10.0305599, 76.3069647]
      ]
    },
    {
      id: 4,
      name: 'Rajagiri School of Engineering & Technology',
      latitude: 9.9935,
      longitude: 76.3580,
      geofence_type: 'polygon',
      geofence_polygon: [
        [9.994284, 76.3552391],
        [9.9940852, 76.3552435],
        [9.9936414, 76.355104],
        [9.9932293, 76.3551791],
        [9.9927327, 76.3558228],
        [9.9924369, 76.3561876],
        [9.9922256, 76.3566811],
        [9.9919826, 76.3572283],
        [9.9917059, 76.3590908],
        [9.9917587, 76.3597452],
        [9.9917164, 76.3602066],
        [9.9917481, 76.360507],
        [9.9920228, 76.3605284],
        [9.9922342, 76.3606679],
        [9.99253, 76.3607001],
        [9.9928576, 76.3608181],
        [9.9930583, 76.3608932],
        [9.9930794, 76.3607323],
        [9.9935655, 76.3605714],
        [9.9936289, 76.3602388],
        [9.9938508, 76.3602173],
        [9.9939036, 76.3598847],
        [9.9941149, 76.3597989],
        [9.994844, 76.3598203],
        [9.9944742, 76.3590586],
        [9.994041, 76.3581574],
        [9.9940938, 76.3572454],
        [9.994284, 76.3552391]
      ]
    }
  ];

  // Load venues on mount
  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    try {
      // Try to fetch from API
      const response = await fetch('http://localhost:3000/api/geofence/venues');
      if (response.ok) {
        const data = await response.json();
        setVenues(data.venues || SAMPLE_VENUES);
      } else {
        // Fallback to sample data
        setVenues(SAMPLE_VENUES);
      }
    } catch (err) {
      console.log('Using sample venue data');
      setVenues(SAMPLE_VENUES);
    }
  };

  // Calculate if point is inside any venue
  const checkGeofence = (lat, lon) => {
    for (const venue of venues) {
      const distance = calculateDistance(
        lat, lon,
        venue.latitude, venue.longitude
      );
      if (distance <= venue.geofence_radius) {
        return { isInside: true, venue };
      }
    }
    return { isInside: false, venue: null };
  };

  // Haversine distance calculation
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Update user location
  const updateUserLocation = (lat, lon) => {
    const { isInside, venue } = checkGeofence(lat, lon);
    setUserLocation({
      latitude: lat,
      longitude: lon,
      isInside,
      venueName: venue ? venue.name : null
    });
  };

  // Use browser geolocation
  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setIsTracking(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateUserLocation(latitude, longitude);
      },
      (err) => {
        setError(`Location error: ${err.message}`);
        setIsTracking(false);
      }
    );
  };

  const stopTracking = () => {
    setIsTracking(false);
  };

  // Use manual location (for demo)
  const useManualLocation = () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);

    if (isNaN(lat) || isNaN(lon)) {
      setError('Invalid coordinates');
      return;
    }

    updateUserLocation(lat, lon);
    setError(null);
  };

  // Quick test locations (Kochi, Kerala) - Updated with precise coordinates
  const testLocations = [
    {
      name: 'Inside Ernakulam Junction',
      lat: 9.9710,
      lon: 76.2910,
      expected: 'INSIDE'
    },
    {
      name: 'Outside Ernakulam Junction',
      lat: 9.9750,
      lon: 76.2910,
      expected: 'OUTSIDE'
    },
    {
      name: 'Inside Cochin Airport',
      lat: 10.1540,
      lon: 76.3950,
      expected: 'INSIDE'
    },
    {
      name: 'Inside Lulu Mall',
      lat: 10.0280,
      lon: 76.3100,
      expected: 'INSIDE'
    },
    {
      name: 'Inside Rajagiri Campus',
      lat: 9.9935,
      lon: 76.3580,
      expected: 'INSIDE'
    }
  ];

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px' }}>
          🗺️ Geofence Visualization Demo
        </h1>
        <p style={{ margin: 0, opacity: 0.9 }}>
          See the geofence boundaries in action
        </p>
      </div>

      {/* Main content */}
      <div style={{ 
        flex: 1, 
        display: 'flex',
        gap: '20px',
        padding: '20px',
        overflow: 'hidden'
      }}>
        {/* Map - 70% width */}
        <div style={{ flex: '0 0 70%', position: 'relative' }}>
          <GeofenceMap
            userLocation={userLocation}
            venues={venues}
            selectedVenueId={selectedVenue}
            showAllVenues={true}
          />
        </div>

        {/* Controls - 30% width */}
        <div style={{ 
          flex: '0 0 30%',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Status */}
          {userLocation && (
            <div style={{
              padding: '16px',
              background: userLocation.isInside ? '#d1fae5' : '#fed7aa',
              border: `2px solid ${userLocation.isInside ? '#10b981' : '#f59e0b'}`,
              borderRadius: '8px'
            }}>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                {userLocation.isInside ? '✅ INSIDE GEOFENCE' : '❌ OUTSIDE GEOFENCE'}
              </div>
              {userLocation.venueName && (
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  📍 {userLocation.venueName}
                </div>
              )}
              <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8 }}>
                Lat: {userLocation.latitude.toFixed(6)}<br/>
                Lon: {userLocation.longitude.toFixed(6)}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              padding: '12px',
              background: '#fee',
              border: '1px solid #f88',
              borderRadius: '8px',
              color: '#c33',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Browser Location */}
          <div style={{
            padding: '16px',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
              📱 Use Browser Location
            </h3>
            {!isTracking ? (
              <button
                onClick={startTracking}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Get My Location
              </button>
            ) : (
              <button
                onClick={stopTracking}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Stop Tracking
              </button>
            )}
          </div>

          {/* Manual Location */}
          <div style={{
            padding: '16px',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
              🎯 Manual Location (GPS Spoofing)
            </h3>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>
                Latitude:
              </label>
              <input
                type="text"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  marginTop: '4px'
                }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>
                Longitude:
              </label>
              <input
                type="text"
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  marginTop: '4px'
                }}
              />
            </div>
            <button
              onClick={useManualLocation}
              style={{
                width: '100%',
                padding: '12px',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Update Location
            </button>
          </div>

          {/* Quick Test Locations */}
          <div style={{
            padding: '16px',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
              ⚡ Quick Test Locations
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {testLocations.map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setManualLat(loc.lat.toString());
                    setManualLon(loc.lon.toString());
                    updateUserLocation(loc.lat, loc.lon);
                  }}
                  style={{
                    padding: '10px',
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <strong>{loc.name}</strong><br/>
                  <small style={{ opacity: 0.7 }}>
                    Expected: {loc.expected}
                  </small>
                </button>
              ))}
            </div>
          </div>

          {/* Venues List */}
          <div style={{
            padding: '16px',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
              📍 Venues ({venues.length})
            </h3>
            <div style={{ fontSize: '12px' }}>
              {venues.map(venue => (
                <div
                  key={venue.id}
                  onClick={() => setSelectedVenue(
                    selectedVenue === venue.id ? null : venue.id
                  )}
                  style={{
                    padding: '8px',
                    marginBottom: '8px',
                    background: selectedVenue === venue.id ? '#dbeafe' : '#f9fafb',
                    border: `1px solid ${selectedVenue === venue.id ? '#3b82f6' : '#e5e7eb'}`,
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <strong>{venue.name}</strong><br/>
                  <small style={{ opacity: 0.7 }}>
                    Radius: {venue.geofence_radius}m
                  </small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeofenceMapDemo;
