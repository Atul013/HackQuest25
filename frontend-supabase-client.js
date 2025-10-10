// PublicAlert Frontend - Direct Supabase Integration
// No Express server needed!

import { createClient } from '@supabase/supabase-js'

// Your Supabase credentials - UPDATE THESE WITH CORRECT VALUES
const supabaseUrl = 'https://akblmbpxxotmebzghczj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrYmxtYnB4eG90bWViemdobnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg1Njg4MjEsImV4cCI6MjA0NDE0NDgyMX0.qJEFO4Y1F1H3dq6A0G8VmZS4Q5Z8QmH_VuQk5pZhwNw' // REPLACE THIS WITH YOUR ACTUAL ANON KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// =================== AUTHENTICATION ===================

export async function adminLogin(password) {
  const { data, error } = await supabase.rpc('admin_login', {
    password_input: password
  })
  
  if (error) {
    console.error('Admin login error:', error)
    return { success: false, error: error.message }
  }
  
  return data
}

// =================== VENUES ===================

export async function getAllVenues() {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('active', true)
    .order('name')
  
  if (error) {
    console.error('Get venues error:', error)
    return { data: null, error: error.message }
  }
  
  return { data, error: null }
}

export async function getVenueById(venueId) {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', venueId)
    .single()
  
  if (error) {
    console.error('Get venue error:', error)
    return { data: null, error: error.message }
  }
  
  return { data, error: null }
}

export async function createVenue(venueData) {
  const { data, error } = await supabase.rpc('create_venue', {
    p_name: venueData.name,
    p_type: venueData.type,
    p_address: venueData.address,
    p_latitude: venueData.latitude,
    p_longitude: venueData.longitude,
    p_radius: venueData.radius || 100,
    p_capacity: venueData.capacity,
    p_contact_info: venueData.contactInfo,
    p_emergency_contacts: venueData.emergencyContacts,
    p_facilities: venueData.facilities
  })
  
  if (error) {
    console.error('Create venue error:', error)
    return { success: false, error: error.message }
  }
  
  return data
}

export async function generateVenueQR(venueId) {
  const { data, error } = await supabase.rpc('generate_venue_qr', {
    venue_id_input: venueId
  })
  
  if (error) {
    console.error('Generate QR error:', error)
    return { success: false, error: error.message }
  }
  
  return data
}

// =================== SUBSCRIPTIONS ===================

export async function subscribeToVenue(venueId, deviceToken, preferences = {}) {
  const { data, error } = await supabase.rpc('subscribe_to_venue', {
    p_venue_id: venueId,
    p_device_token: deviceToken,
    p_notification_preferences: preferences
  })
  
  if (error) {
    console.error('Subscribe error:', error)
    return { success: false, error: error.message }
  }
  
  return data
}

export async function unsubscribeFromVenue(venueId, deviceToken) {
  const { data, error } = await supabase.rpc('unsubscribe_from_venue', {
    p_venue_id: venueId,
    p_device_token: deviceToken
  })
  
  if (error) {
    console.error('Unsubscribe error:', error)
    return { success: false, error: error.message }
  }
  
  return data
}

export async function getUserSubscriptions(deviceToken) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      venues (id, name, type, address)
    `)
    .eq('device_token', deviceToken)
    .gt('expires_at', new Date().toISOString())
  
  if (error) {
    console.error('Get subscriptions error:', error)
    return { data: null, error: error.message }
  }
  
  return { data, error: null }
}

// =================== ALERTS ===================

export async function getVenueAlerts(venueId) {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('venue_id', venueId)
    .eq('active', true)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Get alerts error:', error)
    return { data: null, error: error.message }
  }
  
  return { data, error: null }
}

export async function createAlert(alertData) {
  const { data, error } = await supabase.rpc('create_alert', {
    p_venue_id: alertData.venueId,
    p_alert_type: alertData.alertType,
    p_severity: alertData.severity,
    p_title: alertData.title,
    p_message: alertData.message,
    p_instructions: alertData.instructions,
    p_affected_areas: alertData.affectedAreas,
    p_estimated_duration: alertData.estimatedDuration
  })
  
  if (error) {
    console.error('Create alert error:', error)
    return { success: false, error: error.message }
  }
  
  return data
}

export async function deactivateAlert(alertId) {
  const { data, error } = await supabase.rpc('deactivate_alert', {
    alert_id_input: alertId
  })
  
  if (error) {
    console.error('Deactivate alert error:', error)
    return { success: false, error: error.message }
  }
  
  return data
}

// =================== TEMPORARY ANNOUNCEMENTS ===================

export async function getVenueAnnouncements(venueId) {
  const { data, error } = await supabase
    .from('temporary_announcements')
    .select('*')
    .eq('venue_id', venueId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Get announcements error:', error)
    return { data: null, error: error.message }
  }
  
  return { data, error: null }
}

export async function createAnnouncement(announcementData) {
  const { data, error } = await supabase.rpc('create_announcement', {
    p_venue_id: announcementData.venueId,
    p_transcribed_text: announcementData.transcribedText,
    p_announcement_type: announcementData.announcementType || 'general',
    p_priority: announcementData.priority || 'medium',
    p_duration_minutes: announcementData.durationMinutes || 10
  })
  
  if (error) {
    console.error('Create announcement error:', error)
    return { success: false, error: error.message }
  }
  
  return data
}

// =================== REAL-TIME SUBSCRIPTIONS ===================

export function subscribeToVenueAlerts(venueId, callback) {
  return supabase
    .channel('venue-alerts')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'alerts',
      filter: `venue_id=eq.${venueId}`
    }, callback)
    .subscribe()
}

export function subscribeToVenueAnnouncements(venueId, callback) {
  return supabase
    .channel('venue-announcements')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'temporary_announcements',
      filter: `venue_id=eq.${venueId}`
    }, callback)
    .subscribe()
}

export function subscribeToAllAlerts(callback) {
  return supabase
    .channel('all-alerts')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'alerts'
    }, callback)
    .subscribe()
}

// =================== UTILITY FUNCTIONS ===================

export async function getVenueStats(venueId) {
  const { data, error } = await supabase.rpc('get_venue_stats', {
    venue_id_input: venueId
  })
  
  if (error) {
    console.error('Get venue stats error:', error)
    return { success: false, error: error.message }
  }
  
  return data
}

export async function healthCheck() {
  const { data, error } = await supabase.rpc('health_check')
  
  if (error) {
    console.error('Health check error:', error)
    return { status: 'ERROR', error: error.message }
  }
  
  return data
}

export async function manualCleanup() {
  const { data, error } = await supabase.rpc('manual_cleanup')
  
  if (error) {
    console.error('Manual cleanup error:', error)
    return { success: false, error: error.message }
  }
  
  return data
}

// =================== DEVICE TOKEN MANAGEMENT ===================

export function generateDeviceToken() {
  // Generate a unique device token for this browser session
  let deviceToken = localStorage.getItem('publicalert_device_token')
  
  if (!deviceToken) {
    deviceToken = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('publicalert_device_token', deviceToken)
  }
  
  return deviceToken
}

export function getStoredDeviceToken() {
  return localStorage.getItem('publicalert_device_token')
}

// =================== GEOLOCATION HELPERS ===================

export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180
  const φ2 = lat2 * Math.PI/180
  const Δφ = (lat2-lat1) * Math.PI/180
  const Δλ = (lon2-lon1) * Math.PI/180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c // Distance in meters
}

export async function findNearbyVenues(userLat, userLon, maxDistance = 1000) {
  const { data: venues, error } = await getAllVenues()
  
  if (error) return { data: null, error }
  
  const nearbyVenues = venues.filter(venue => {
    const distance = calculateDistance(userLat, userLon, venue.latitude, venue.longitude)
    return distance <= Math.max(venue.radius, maxDistance)
  })
  
  return { data: nearbyVenues, error: null }
}

// =================== EXPORT DEFAULT ===================

export default {
  supabase,
  // Auth
  adminLogin,
  // Venues
  getAllVenues,
  getVenueById,
  createVenue,
  generateVenueQR,
  // Subscriptions
  subscribeToVenue,
  unsubscribeFromVenue,
  getUserSubscriptions,
  // Alerts
  getVenueAlerts,
  createAlert,
  deactivateAlert,
  // Announcements
  getVenueAnnouncements,
  createAnnouncement,
  // Real-time
  subscribeToVenueAlerts,
  subscribeToVenueAnnouncements,
  subscribeToAllAlerts,
  // Utilities
  getVenueStats,
  healthCheck,
  manualCleanup,
  generateDeviceToken,
  getStoredDeviceToken,
  findNearbyVenues
}