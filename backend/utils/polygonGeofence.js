/**
 * Polygon Geofencing Utilities
 * 
 * Advanced geofencing with custom polygon shapes instead of circles
 * Provides precise boundary detection for irregular venue shapes
 */

/**
 * Ray Casting Algorithm for Point-in-Polygon Detection
 * 
 * Determines if a point is inside a polygon by counting ray intersections
 * More accurate than circle-based geofencing for irregular shapes
 * 
 * @param {number} lat - User latitude
 * @param {number} lon - User longitude
 * @param {Array<[number, number]>} polygon - Array of [lat, lon] coordinates
 * @returns {boolean} - True if point is inside polygon
 */
function isPointInPolygon(lat, lon, polygon) {
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [lat_i, lon_i] = polygon[i];
    const [lat_j, lon_j] = polygon[j];
    
    // Check if ray crosses polygon edge
    const intersect = ((lon_i > lon) !== (lon_j > lon)) &&
      (lat < (lat_j - lat_i) * (lon - lon_i) / (lon_j - lon_i) + lat_i);
    
    if (intersect) {
      inside = !inside;
    }
  }
  
  return inside;
}

/**
 * Create rectangular geofence from center point and dimensions
 * 
 * @param {number} centerLat - Center latitude
 * @param {number} centerLon - Center longitude
 * @param {number} widthMeters - Width in meters
 * @param {number} heightMeters - Height in meters
 * @returns {Array<[number, number]>} - Polygon coordinates
 */
function createRectangularGeofence(centerLat, centerLon, widthMeters, heightMeters) {
  // Approximate: 1 degree latitude ≈ 111,320 meters
  // 1 degree longitude varies by latitude
  const latOffset = (heightMeters / 2) / 111320;
  const lonOffset = (widthMeters / 2) / (111320 * Math.cos(centerLat * Math.PI / 180));
  
  return [
    [centerLat + latOffset, centerLon - lonOffset],  // North-West
    [centerLat + latOffset, centerLon + lonOffset],  // North-East
    [centerLat - latOffset, centerLon + lonOffset],  // South-East
    [centerLat - latOffset, centerLon - lonOffset],  // South-West
    [centerLat + latOffset, centerLon - lonOffset]   // Close polygon
  ];
}

/**
 * Calculate polygon area (approximate, in square meters)
 * 
 * @param {Array<[number, number]>} polygon - Polygon coordinates
 * @returns {number} - Approximate area in square meters
 */
function calculatePolygonArea(polygon) {
  let area = 0;
  
  for (let i = 0; i < polygon.length - 1; i++) {
    const [lat1, lon1] = polygon[i];
    const [lat2, lon2] = polygon[i + 1];
    area += (lon2 - lon1) * (lat2 + lat1);
  }
  
  area = Math.abs(area) / 2;
  
  // Convert to approximate square meters
  // 1 degree ≈ 111,320 meters at equator
  const metersPerDegree = 111320;
  return area * metersPerDegree * metersPerDegree;
}

/**
 * Check if polygon is valid (closed and has minimum points)
 * 
 * @param {Array<[number, number]>} polygon - Polygon coordinates
 * @returns {boolean} - True if valid
 */
function isValidPolygon(polygon) {
  if (!polygon || polygon.length < 4) {
    return false;
  }
  
  // Check if polygon is closed (first and last points match)
  const first = polygon[0];
  const last = polygon[polygon.length - 1];
  
  return first[0] === last[0] && first[1] === last[1];
}

/**
 * Get bounding box of polygon (for optimization)
 * 
 * @param {Array<[number, number]>} polygon - Polygon coordinates
 * @returns {Object} - {minLat, maxLat, minLon, maxLon}
 */
function getPolygonBounds(polygon) {
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
 * Quick bounding box check before expensive point-in-polygon
 * 
 * @param {number} lat - User latitude
 * @param {number} lon - User longitude
 * @param {Array<[number, number]>} polygon - Polygon coordinates
 * @returns {boolean} - True if point is within bounding box
 */
function isInBoundingBox(lat, lon, polygon) {
  const bounds = getPolygonBounds(polygon);
  
  return lat >= bounds.minLat && lat <= bounds.maxLat &&
         lon >= bounds.minLon && lon <= bounds.maxLon;
}

/**
 * Optimized polygon check with bounding box pre-filter
 * 
 * @param {number} lat - User latitude
 * @param {number} lon - User longitude
 * @param {Array<[number, number]>} polygon - Polygon coordinates
 * @returns {boolean} - True if inside polygon
 */
function isInsidePolygonGeofence(lat, lon, polygon) {
  // Validate polygon
  if (!isValidPolygon(polygon)) {
    console.error('Invalid polygon provided');
    return false;
  }
  
  // Quick bounding box check first (optimization)
  if (!isInBoundingBox(lat, lon, polygon)) {
    return false;
  }
  
  // Precise point-in-polygon check
  return isPointInPolygon(lat, lon, polygon);
}

/**
 * Kochi venue polygons - Precise boundaries
 */
const KOCHI_VENUE_POLYGONS = {
  ERNAKULAM_JUNCTION: [
    [9.9830, 76.2985],  // North-West
    [9.9830, 76.3015],  // North-East
    [9.9802, 76.3015],  // South-East
    [9.9802, 76.2985],  // South-West
    [9.9830, 76.2985]   // Close polygon
  ],
  
  COCHIN_AIRPORT: [
    [10.1580, 76.3850],  // North-West (covers terminals)
    [10.1580, 76.4000],  // North-East (includes runway area)
    [10.1460, 76.4000],  // South-East
    [10.1460, 76.3850],  // South-West
    [10.1580, 76.3850]   // Close polygon
  ],
  
  MARINE_DRIVE: [
    [9.9700, 76.2780],  // North start
    [9.9700, 76.2835],  // North end (elongated waterfront)
    [9.9650, 76.2835],  // South end
    [9.9650, 76.2780],  // South start
    [9.9700, 76.2780]   // Close polygon
  ],
  
  LULU_MALL: [
    [10.0285, 76.3110],  // North-West corner (precise mall boundary)
    [10.0285, 76.3142],  // North-East corner
    [10.0259, 76.3142],  // South-East corner
    [10.0259, 76.3110],  // South-West corner
    [10.0285, 76.3110]   // Close polygon
  ],
  
  FORT_KOCHI_BEACH: [
    [9.9680, 76.2400],  // North point (irregular coastal shape)
    [9.9685, 76.2450],  // North-East
    [9.9640, 76.2455],  // South-East
    [9.9625, 76.2410],  // South-West
    [9.9635, 76.2395],  // West point
    [9.9680, 76.2400]   // Close polygon
  ]
};

module.exports = {
  isPointInPolygon,
  isInsidePolygonGeofence,
  createRectangularGeofence,
  calculatePolygonArea,
  isValidPolygon,
  getPolygonBounds,
  isInBoundingBox,
  KOCHI_VENUE_POLYGONS
};
