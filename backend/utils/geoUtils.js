/**
 * Geospatial Utility Functions
 * Helper functions for distance calculations and polygon checks
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} - Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  
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
 * Check if a point is inside a polygon using ray casting algorithm
 * @param {number} lat - Point latitude
 * @param {number} lon - Point longitude
 * @param {Array} polygon - Array of [lat, lon] coordinates defining polygon
 * @returns {boolean} - True if point is inside polygon
 */
function isPointInPolygon(lat, lon, polygon) {
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    
    const intersect = ((yi > lon) !== (yj > lon)) &&
                      (lat < (xj - xi) * (lon - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Calculate the center point of a polygon
 * @param {Array} polygon - Array of [lat, lon] coordinates
 * @returns {object} - {lat, lon} of center point
 */
function getPolygonCenter(polygon) {
  let latSum = 0;
  let lonSum = 0;
  
  polygon.forEach(([lat, lon]) => {
    latSum += lat;
    lonSum += lon;
  });
  
  return {
    lat: latSum / polygon.length,
    lon: lonSum / polygon.length
  };
}

/**
 * Calculate bounding box for a polygon
 * @param {Array} polygon - Array of [lat, lon] coordinates
 * @returns {object} - {minLat, maxLat, minLon, maxLon}
 */
function getBoundingBox(polygon) {
  let minLat = Infinity, maxLat = -Infinity;
  let minLon = Infinity, maxLon = -Infinity;
  
  polygon.forEach(([lat, lon]) => {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
  });
  
  return { minLat, maxLat, minLon, maxLon };
}

/**
 * Convert meters to approximate degrees (for quick radius calculations)
 * @param {number} meters - Distance in meters
 * @returns {number} - Approximate degrees
 */
function metersToDegrees(meters) {
  // 1 degree ≈ 111,000 meters at equator
  return meters / 111000;
}

/**
 * Create a circular geofence polygon from center point and radius
 * @param {number} centerLat - Center latitude
 * @param {number} centerLon - Center longitude
 * @param {number} radiusMeters - Radius in meters
 * @param {number} points - Number of points in polygon (default 32)
 * @returns {Array} - Polygon coordinates
 */
function createCircularGeofence(centerLat, centerLon, radiusMeters, points = 32) {
  const polygon = [];
  const radiusDegrees = metersToDegrees(radiusMeters);
  
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const lat = centerLat + radiusDegrees * Math.sin(angle);
    const lon = centerLon + radiusDegrees * Math.cos(angle);
    polygon.push([lat, lon]);
  }
  
  return polygon;
}

/**
 * Check if two geofences overlap
 * @param {object} geofence1 - First geofence {center, radius}
 * @param {object} geofence2 - Second geofence {center, radius}
 * @returns {boolean} - True if geofences overlap
 */
function geofencesOverlap(geofence1, geofence2) {
  const distance = calculateDistance(
    geofence1.center.lat,
    geofence1.center.lon,
    geofence2.center.lat,
    geofence2.center.lon
  );
  
  return distance < (geofence1.radius + geofence2.radius);
}

/**
 * Get nearest venue to a given location
 * @param {number} lat - User latitude
 * @param {number} lon - User longitude
 * @param {Array} venues - Array of venue objects with coordinates
 * @returns {object} - Nearest venue and distance
 */
function findNearestVenue(lat, lon, venues) {
  let nearest = null;
  let minDistance = Infinity;
  
  venues.forEach(venue => {
    const distance = calculateDistance(lat, lon, venue.latitude, venue.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = venue;
    }
  });
  
  return { venue: nearest, distance: minDistance };
}

/**
 * Format coordinates for display
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} precision - Decimal places (default 6)
 * @returns {string} - Formatted string
 */
function formatCoordinates(lat, lon, precision = 6) {
  return `${lat.toFixed(precision)}, ${lon.toFixed(precision)}`;
}

module.exports = {
  calculateDistance,
  isPointInPolygon,
  getPolygonCenter,
  getBoundingBox,
  metersToDegrees,
  createCircularGeofence,
  geofencesOverlap,
  findNearestVenue,
  formatCoordinates
};
