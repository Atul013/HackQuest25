import React, { useEffect, useRef, useState } from 'react';

/**
 * GeofenceMap Component
 * 
 * Visual representation of geofences using Leaflet.js
 * Shows venue locations, geofence boundaries, and user position
 * 
 * Perfect for hackathon demos!
 */

const GeofenceMap = ({ 
  userLocation = null, 
  venues = [],
  selectedVenueId = null,
  showAllVenues = true 
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({
    user: null,
    venues: [],
    circles: []
  });

  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState(null);

  // Initialize map
  useEffect(() => {
    // Check if Leaflet is loaded
    if (typeof window === 'undefined' || !window.L) {
      setError('Leaflet library not loaded. Please include Leaflet CSS and JS.');
      return;
    }

    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      // Create map centered on Kochi, Kerala, India (default - Lulu Mall area)
      const map = window.L.map(mapRef.current, {
        center: [10.0280, 76.3100],
        zoom: 12,
        zoomControl: true
      });

      // Add OpenStreetMap tiles
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);

      // Cleanup
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    } catch (err) {
      setError(`Map initialization error: ${err.message}`);
    }
  }, []);

  // Update venues and geofences
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const L = window.L;

    // Clear existing venue markers and circles
    markersRef.current.venues.forEach(marker => marker.remove());
    markersRef.current.circles.forEach(circle => circle.remove());
    markersRef.current.venues = [];
    markersRef.current.circles = [];

    if (!venues || venues.length === 0) return;

    // Filter venues if needed
    const venuesToShow = showAllVenues 
      ? venues 
      : venues.filter(v => v.id === selectedVenueId);

    // Track bounds for auto-zoom
    const bounds = [];

    venuesToShow.forEach(venue => {
      const { latitude, longitude, geofence_radius, name, id } = venue;
      const isSelected = id === selectedVenueId;

      // Add venue marker
      const venueIcon = L.divIcon({
        className: 'custom-venue-marker',
        html: `
          <div style="
            background: ${isSelected ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 12px;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 2px solid white;
          ">
            📍 ${name}
          </div>
        `,
        iconSize: [120, 40],
        iconAnchor: [60, 20]
      });

      const marker = L.marker([latitude, longitude], { icon: venueIcon })
        .addTo(map)
        .bindPopup(`
          <div style="text-align: center;">
            <strong>${name}</strong><br/>
            <small>Lat: ${latitude.toFixed(4)}</small><br/>
            <small>Lon: ${longitude.toFixed(4)}</small><br/>
            <strong>Radius: ${geofence_radius}m</strong>
          </div>
        `);

      markersRef.current.venues.push(marker);

      // Add geofence circle
      const circle = L.circle([latitude, longitude], {
        radius: geofence_radius,
        color: isSelected ? '#ef4444' : '#3b82f6',
        fillColor: isSelected ? '#ef4444' : '#3b82f6',
        fillOpacity: 0.15,
        weight: 2,
        dashArray: isSelected ? null : '10, 10'
      }).addTo(map);

      // Add tooltip to circle
      circle.bindTooltip(`${name} - ${geofence_radius}m radius`, {
        permanent: false,
        direction: 'center'
      });

      markersRef.current.circles.push(circle);

      // Add to bounds
      bounds.push([latitude, longitude]);
    });

    // Auto-zoom to show all venues
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }

  }, [venues, selectedVenueId, showAllVenues, mapReady]);

  // Update user location marker
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const L = window.L;

    // Remove existing user marker
    if (markersRef.current.user) {
      markersRef.current.user.remove();
      markersRef.current.user = null;
    }

    if (!userLocation || !userLocation.latitude || !userLocation.longitude) return;

    const { latitude, longitude, isInside, venueName } = userLocation;

    // Create pulsing user marker
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="position: relative;">
          <div style="
            position: absolute;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: ${isInside ? '#10b981' : '#f59e0b'};
            opacity: 0.3;
            animation: pulse 2s infinite;
          "></div>
          <div style="
            position: relative;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: ${isInside ? '#10b981' : '#f59e0b'};
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            margin: 10px;
          "></div>
        </div>
        <style>
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.5); opacity: 0.1; }
            100% { transform: scale(1); opacity: 0.3; }
          }
        </style>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const userMarker = L.marker([latitude, longitude], { icon: userIcon })
      .addTo(map)
      .bindPopup(`
        <div style="text-align: center;">
          <strong>📱 Your Location</strong><br/>
          <small>Lat: ${latitude.toFixed(6)}</small><br/>
          <small>Lon: ${longitude.toFixed(6)}</small><br/>
          <div style="
            margin-top: 8px;
            padding: 4px 8px;
            border-radius: 12px;
            background: ${isInside ? '#10b981' : '#f59e0b'};
            color: white;
            font-weight: bold;
            font-size: 12px;
          ">
            ${isInside ? '✅ INSIDE' : '❌ OUTSIDE'}
            ${venueName ? `<br/>${venueName}` : ''}
          </div>
        </div>
      `);

    markersRef.current.user = userMarker;

    // Pan to user location
    map.panTo([latitude, longitude]);

  }, [userLocation, mapReady]);

  if (error) {
    return (
      <div style={{
        padding: '20px',
        background: '#fee',
        border: '1px solid #f88',
        borderRadius: '8px',
        color: '#c33'
      }}>
        <strong>Map Error:</strong> {error}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Map container */}
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: '400px',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }} 
      />

      {/* Loading overlay */}
      {!mapReady && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255,255,255,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🗺️</div>
            <div>Loading map...</div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'white',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        fontSize: '12px',
        zIndex: 1000
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Legend</div>
        <div style={{ marginBottom: '4px' }}>
          <span style={{ color: '#3b82f6' }}>━━━</span> Geofence Boundary
        </div>
        <div style={{ marginBottom: '4px' }}>
          📍 Venue Location
        </div>
        <div style={{ marginBottom: '4px' }}>
          <span style={{ 
            display: 'inline-block',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#10b981',
            marginRight: '4px'
          }}></span> Inside Geofence
        </div>
        <div>
          <span style={{ 
            display: 'inline-block',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#f59e0b',
            marginRight: '4px'
          }}></span> Outside Geofence
        </div>
      </div>
    </div>
  );
};

export default GeofenceMap;
