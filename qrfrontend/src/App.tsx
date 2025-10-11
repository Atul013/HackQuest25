import { ShieldAlert, MapPin, Bell, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
}

function App() {
  const [step, setStep] = useState<'initial' | 'installing' | 'pwa-ready' | 'installed' | 'requesting-permission' | 'active'>('initial');
  const [locationPermission, setLocationPermission] = useState<'denied' | 'granted' | 'pending' | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isInGeofence, setIsInGeofence] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [lastBackendResult, setLastBackendResult] = useState<any>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  // Geofence configuration (defaults will be overwritten by backend /venue/:id)
  const [GEOFENCE_CENTER, setGEOFENCE_CENTER] = useState({ lat: 40.7589, lng: -73.9851 });
  const [GEOFENCE_RADIUS, setGEOFENCE_RADIUS] = useState(1000);

  // Backend geofence API - prefer Vite env var VITE_GEOFENCE_API_URL (full endpoint), fallback to deployed Cloud Run URL
  const GEOFENCE_API_URL = (import.meta.env as any).VITE_GEOFENCE_API_URL || 'https://geofence-service-701994675545.asia-south1.run.app/location';
  const GEOFENCE_API_BASE = GEOFENCE_API_URL.replace(/\/location\/?$/, '');
  const CHECK_INTERVAL_MS_CONFIG = parseInt(((import.meta.env as any).VITE_CHECK_INTERVAL_MS || '120000'), 10);

  // Simple stable user id persisted in localStorage so service can track per-user state
  const getOrCreateUserId = () => {
    try {
      let id = localStorage.getItem('hq_user_id');
      if (!id) {
        id = 'user_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        localStorage.setItem('hq_user_id', id);
      }
      return id;
    } catch (e) {
      return 'user_' + Date.now();
    }
  };

  useEffect(() => {
    // Check if PWA is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setStep('installed');
    }

    // Fetch authoritative venue info from backend
    (async () => {
      try {
        const base = GEOFENCE_API_BASE;
        const resp = await fetch(`${base}/venue/1`);
        if (resp.ok) {
          const j = await resp.json();
          if (j && j.venue) {
            // Coerce values to numbers (avoid string values from API) and ensure a sensible default
            setGEOFENCE_CENTER({ lat: Number(j.venue.latitude) || 40.7589, lng: Number(j.venue.longitude) || -73.9851 });
            const radiusNum = Number(j.venue.radius ?? j.venue.radius_meters) || 1000;
            setGEOFENCE_RADIUS(radiusNum);
            console.log('Loaded venue from API', j.venue, '-> radius (m):', radiusNum);
          }
        }
      } catch (err: any) {
        console.warn('Could not fetch venue info from backend', err?.message || err);
      }
    })();

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setCanInstall(false);
      setStep('installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);



  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const checkGeofenceStatus = (location: LocationData) => {
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      GEOFENCE_CENTER.lat,
      GEOFENCE_CENTER.lng
    );

  // Ensure radius is numeric and apply a tolerance to avoid false negatives
  const radius = (typeof GEOFENCE_RADIUS === 'number') ? GEOFENCE_RADIUS : (Number(GEOFENCE_RADIUS) || 1000);
  // Use a tolerance that's at least 5 meters or 2% of the radius (whichever is larger).
  // This reduces chances of marking a user outside due to small GPS jitter or backend rounding.
  const EPSILON = Math.max(5, radius * 0.02);
  const inGeofence = distance <= (radius + EPSILON);
    setIsInGeofence(inGeofence);

  console.log(`Distance from geofence center: ${distance.toFixed(2)} m (radius: ${radius} m, eps: ${EPSILON.toFixed(2)} m)`);
    console.log(`Inside geofence: ${inGeofence}`);

    return inGeofence;
  };

  const requestLocationPermission = async () => {
    setStep('requesting-permission');
    setLocationPermission('pending');

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      
      if (permission.state === 'granted') {
        setLocationPermission('granted');
        getCurrentLocation();
      } else {
        // Request permission
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: Date.now()
            };
            setCurrentLocation(location);
            setLocationPermission('granted');
            checkGeofenceStatus(location);
            startBackgroundTracking();
            setStep('active');
            setAlertsEnabled(true);
          },
          (error) => {
            console.error('Location permission denied:', error);
            setLocationPermission('denied');
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocationPermission('denied');
    }
  };

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now()
        };
        setCurrentLocation(location);
        checkGeofenceStatus(location);
        startBackgroundTracking();
        setStep('active');
        setAlertsEnabled(true);
      },
      (error) => {
        console.error('Error getting location:', error);
      }
    );
  };

  const startBackgroundTracking = () => {
    // Check location periodically. Default 2 minutes (120000ms) to match backend CHECK_INTERVAL_MS
    const intervalMs = CHECK_INTERVAL_MS_CONFIG || 120000;
    console.log('Starting background tracking with interval', intervalMs);
    const intervalId = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: Date.now()
          };
          setCurrentLocation(location);
          checkGeofenceStatus(location);
          
          // Send location to backend for geofencing check
          sendLocationToBackend(location);
        },
        (error) => {
          console.error('Background location update failed:', error);
        },
        {
          enableHighAccuracy: false, // Use less battery for background checks
          timeout: 15000,
          maximumAge: 600000 // 10 minutes
        }
      );
  }, intervalMs);

    // Store interval ID to clear it later if needed
    localStorage.setItem('geofenceInterval', intervalId.toString());
  };

  const sendLocationToBackend = async (location: LocationData) => {
    try {
      const response = await fetch(GEOFENCE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: getOrCreateUserId(),
          // venueId may be provided by your app; fallback to 1
          venueId: 1,
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: location.timestamp
        })
      });
      
      const result = await response.json();
      console.log('Location sent to backend:', result);
      setLastBackendResult(result);
    } catch (error) {
      console.error('Failed to send location to backend:', error);
      setLastBackendResult({ error: String(error) });
    }
  };

  // Check if running as installed PWA
  const isPWA = () => {
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone === true ||
           document.referrer.includes('android-app://');
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      setStep('installing');
      const result = await deferredPrompt.prompt();
      console.log('Install prompt result:', result);
      
      if (result.outcome === 'accepted') {
        setDeferredPrompt(null);
        setCanInstall(false);
        // The appinstalled event will handle setting step to 'installed'
      } else {
        // User declined, show alternative instructions
        setTimeout(() => {
          setStep('pwa-ready');
        }, 1000);
      }
    } else {
      // No prompt available, show manual installation instructions
      setStep('installing');
      setTimeout(() => {
        setStep('pwa-ready');
      }, 2000);
    }
  };

  const handleContinue = () => {
    if (step === 'initial') {
      if (isPWA()) {
        // If already installed as PWA, skip to location permission
        setStep('installed');
      } else {
        // If in browser, trigger install prompt
        handleInstall();
      }
    } else if (step === 'installed') {
      requestLocationPermission();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-32 right-10 w-80 h-80 bg-cyan-200/30 rounded-full blur-3xl animate-float-delayed" />
      </div>

      <div className="w-full max-w-md mx-auto relative z-10">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 space-y-8 animate-fade-in">
          {step === 'initial' && (
            <>
              <div className="flex justify-center animate-slide-down">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse-slow" />
                  <div className="relative bg-gradient-to-br from-blue-500 to-cyan-500 p-5 rounded-full animate-bounce-subtle">
                    <ShieldAlert className="w-12 h-12 text-white" strokeWidth={2} />
                  </div>
                </div>
              </div>

              <div className="text-center space-y-3 animate-slide-up">
                <h1 className="text-3xl font-bold text-slate-800 leading-tight">
                  Emergency Alert Web App
                </h1>
                <p className="text-slate-600 text-lg">
                  Stay protected with real-time safety notifications
                </p>
              </div>

              <div className="space-y-4 animate-slide-up-delayed">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full" />
                  <p className="text-slate-700 leading-relaxed">
                    Your location will be continuously tracked for timely alerts.
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full" />
                  <p className="text-slate-700 leading-relaxed">
                    This web app will install automatically and run in the background.
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full" />
                  <p className="text-slate-700 leading-relaxed">
                    Receive emergency notifications directly to your device.
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={handleContinue}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  {canInstall ? 'Install Emergency App' : 'Enable Emergency Alerts'}
                </button>
              </div>
            </>
          )}

          {step === 'installing' && (
            <>
              <div className="flex justify-center animate-slide-down">
                <div className="relative bg-gradient-to-br from-orange-500 to-red-500 p-5 rounded-full animate-spin-slow">
                  <ShieldAlert className="w-12 h-12 text-white" strokeWidth={2} />
                </div>
              </div>

              <div className="text-center space-y-3 animate-slide-up">
                <h1 className="text-3xl font-bold text-slate-800 leading-tight">
                  Installing App...
                </h1>
                <p className="text-slate-600 text-lg">
                  Please follow the browser prompts to install the web app
                </p>
              </div>

              <div className="flex justify-center">
                <div className="animate-pulse flex space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </>
          )}

          {step === 'pwa-ready' && (
            <>
              <div className="flex justify-center animate-slide-down">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse-slow" />
                  <div className="relative bg-gradient-to-br from-green-500 to-emerald-500 p-5 rounded-full animate-bounce-subtle">
                    <CheckCircle className="w-12 h-12 text-white" strokeWidth={2} />
                  </div>
                </div>
              </div>

              <div className="text-center space-y-3 animate-slide-up">
                <h1 className="text-3xl font-bold text-slate-800 leading-tight">
                  Ready to Install!
                </h1>
                <p className="text-slate-600 text-lg">
                  Add this app to your home screen for the full experience
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-blue-800">
                    <ShieldAlert className="w-5 h-5" />
                    <span className="font-semibold">Installation Instructions</span>
                  </div>
                  <div className="text-blue-700 text-sm mt-2 space-y-1">
                    <p>• Look for "Add to Home Screen" in your browser menu</p>
                    <p>• Or tap the install prompt that appears</p>
                    <p>• Once installed, open the app for location features</p>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">What's Next?</span>
                  </div>
                  <p className="text-green-700 text-sm mt-2">
                    After installation, open the app from your home screen to enable location-based emergency alerts and geofencing features.
                  </p>
                </div>
              </div>
            </>
          )}

          {step === 'installed' && (
            <>
              <div className="flex justify-center animate-slide-down">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse-slow" />
                  <div className="relative bg-gradient-to-br from-green-500 to-emerald-500 p-5 rounded-full animate-bounce-subtle">
                    <CheckCircle className="w-12 h-12 text-white" strokeWidth={2} />
                  </div>
                </div>
              </div>

              <div className="text-center space-y-3 animate-slide-up">
                <h1 className="text-3xl font-bold text-slate-800 leading-tight">
                  App Installed Successfully!
                </h1>
                <p className="text-slate-600 text-lg">
                  Now let's enable location-based alerts
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-blue-800">
                    <MapPin className="w-5 h-5" />
                    <span className="font-semibold">Location Permission Required</span>
                  </div>
                  <p className="text-blue-700 text-sm mt-2">
                    We need your location to check if you're in an alert zone and send you timely emergency notifications.
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={handleContinue}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  Enable Location Alerts
                </button>
              </div>
            </>
          )}

          {step === 'requesting-permission' && (
            <>
              <div className="flex justify-center animate-slide-down">
                <div className="relative bg-gradient-to-br from-yellow-500 to-orange-500 p-5 rounded-full animate-pulse">
                  <MapPin className="w-12 h-12 text-white" strokeWidth={2} />
                </div>
              </div>

              <div className="text-center space-y-3 animate-slide-up">
                <h1 className="text-3xl font-bold text-slate-800 leading-tight">
                  Requesting Location Permission
                </h1>
                <p className="text-slate-600 text-lg">
                  Please allow location access in your browser
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  📍 Look for the location permission prompt in your browser and click "Allow" to enable emergency alerts.
                </p>
              </div>
            </>
          )}

          {step === 'active' && (
            <>
              <div className="flex justify-center animate-slide-down">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse-slow" />
                  <div className="relative bg-gradient-to-br from-green-500 to-emerald-500 p-5 rounded-full">
                    <Bell className="w-12 h-12 text-white" strokeWidth={2} />
                  </div>
                </div>
              </div>

              <div className="text-center space-y-3 animate-slide-up">
                <h1 className="text-3xl font-bold text-slate-800 leading-tight">
                  Emergency Alerts Active
                </h1>
                <p className="text-slate-600 text-lg">
                  You're now protected by our alert system
                </p>
              </div>

              <div className="space-y-4">
                <div className={`border rounded-lg p-4 ${isInGeofence ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${isInGeofence ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="font-semibold text-slate-800">
                      {isInGeofence ? 'Inside Alert Zone' : 'Outside Alert Zone'}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm mt-2">
                    {isInGeofence 
                      ? 'You will receive emergency notifications for this area.' 
                      : 'Move closer to the monitored area to receive alerts.'}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-blue-800">
                    <Bell className="w-5 h-5" />
                    <span className="font-semibold">Background Monitoring</span>
                  </div>
                  <p className="text-blue-700 text-sm mt-2">
                    App checks your location every 10 minutes to ensure you receive timely alerts.
                  </p>
                </div>

                {currentLocation && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs">
                    <div className="text-slate-600">
                      <div>Lat: {currentLocation.latitude.toFixed(6)}</div>
                      <div>Lng: {currentLocation.longitude.toFixed(6)}</div>
                      <div>Updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                )}
              </div>

              {locationPermission === 'denied' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">
                    ⚠️ Location access denied. Please enable location permissions in your browser settings to receive emergency alerts.
                  </p>
                </div>
              )}
            </>
          )}

          <div className="text-center">
            <p className="text-xs text-slate-500 leading-relaxed">
              By continuing, you consent to location tracking and emergency notifications. Your privacy is protected.
            </p>
          </div>
        </div>

        {/* Debug overlay (visible to developers/testing only) */}
        <div className="fixed right-4 bottom-4 z-50 bg-white/90 border border-slate-200 rounded-lg p-3 text-sm shadow-lg w-72">
          <div className="font-semibold text-slate-700">Debug — Geofence</div>
          <div className="mt-2 text-xs text-slate-600">
            <div>Venue center: {GEOFENCE_CENTER.lat.toFixed(6)}, {GEOFENCE_CENTER.lng.toFixed(6)}</div>
            <div>Radius: {Math.round(GEOFENCE_RADIUS)} m</div>
            <hr className="my-2" />
            <div>Current: {currentLocation ? `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}` : 'n/a'}</div>
            <div>Distance: {currentLocation ? `${calculateDistance(currentLocation.latitude, currentLocation.longitude, GEOFENCE_CENTER.lat, GEOFENCE_CENTER.lng).toFixed(1)} m` : 'n/a'}</div>
            <div className="mt-2">Inside (client): {isInGeofence ? 'yes' : 'no'}</div>
            <div className="mt-2">Last backend:</div>
            <pre className="bg-slate-50 p-2 rounded text-xs max-h-28 overflow-auto">{lastBackendResult ? JSON.stringify(lastBackendResult) : 'n/a'}</pre>
            <div className="flex gap-2 mt-2">
              <button
                className="flex-1 bg-blue-500 text-white py-1 rounded"
                onClick={() => {
                  if (currentLocation) sendLocationToBackend(currentLocation);
                }}
              >Send now</button>
              <button
                className="flex-1 bg-gray-200 text-slate-700 py-1 rounded"
                onClick={() => {
                  // Force a fresh high-accuracy location read for debugging
                  navigator.geolocation.getCurrentPosition((pos) => {
                    const l: LocationData = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, timestamp: Date.now() };
                    setCurrentLocation(l);
                    checkGeofenceStatus(l);
                  }, (err) => console.warn('geo err', err), { enableHighAccuracy: true, timeout: 20000 });
                }}
              >Refresh</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
