/**
 * Example: Complete Integration in React App
 */

import React, { useEffect, useState } from 'react';
import GeofenceTracker from './components/GeofenceTracker';
import geolocationService from './services/geolocation.service';
import io from 'socket.io-client';

function App() {
  const [socket, setSocket] = useState(null);
  const [venue, setVenue] = useState({
    id: 1,
    name: 'Central Railway Station'
  });
  const [alerts, setAlerts] = useState([]);
  const [trackingStatus, setTrackingStatus] = useState(null);

  useEffect(() => {
    // Initialize Socket.IO connection
    const socketConnection = io(process.env.REACT_APP_API_URL || 'http://localhost:3000');
    
    socketConnection.on('connect', () => {
      console.log('✅ Connected to server');
      // Subscribe to venue alerts
      socketConnection.emit('subscribe_venue', venue.id);
    });

    // Listen for emergency alerts
    socketConnection.on('emergency_alert', (alert) => {
      console.log('🚨 Emergency Alert:', alert);
      
      // Add to alerts list
      setAlerts(prev => [alert, ...prev]);
      
      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(alert.title, {
          body: alert.message,
          icon: '/alert-icon.png',
          badge: '/badge-icon.png',
          tag: `alert-${alert.id}`,
          requireInteraction: alert.severity === 'critical'
        });
      }
      
      // Play alert sound for critical alerts
      if (alert.severity === 'critical') {
        const audio = new Audio('/alert-sound.mp3');
        audio.play();
      }
    });

    socketConnection.on('location_ack', (data) => {
      console.log('📍 Location acknowledged:', data);
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
  }, [venue.id]);

  // Handle geofence status changes
  const handleGeofenceStatus = (status) => {
    console.log('Geofence status changed:', status);
    setTrackingStatus(status);

    if (status.tracking && socket) {
      // Send location updates via socket
      if (geolocationService.currentPosition) {
        socket.emit('location_update', {
          userId: localStorage.getItem('userId'),
          lat: geolocationService.currentPosition.lat,
          lon: geolocationService.currentPosition.lon
        });
      }
    }

    if (!status.inside && status.tracking) {
      // User is outside geofence
      showWarning('You are now outside the venue. You will be unsubscribed in 30 minutes.');
    }
  };

  const showWarning = (message) => {
    // Show toast/notification
    alert(message);
  };

  const acknowledgeAlert = (alertId) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    
    // Send acknowledgment to backend
    fetch(`${process.env.REACT_APP_API_URL}/api/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
  };

  return (
    <div className="app">
      <header>
        <h1>🚨 PublicAlert</h1>
        <p>{venue.name}</p>
      </header>

      <main>
        {/* Geofence Tracker Component */}
        <GeofenceTracker
          venueId={venue.id}
          venueName={venue.name}
          onStatusChange={handleGeofenceStatus}
        />

        {/* Tracking Status Display */}
        {trackingStatus && (
          <div className="status-card">
            <h3>Status</h3>
            <p>Tracking: {trackingStatus.tracking ? '✅ Active' : '❌ Inactive'}</p>
            <p>Inside Venue: {trackingStatus.inside ? '✅ Yes' : '❌ No'}</p>
          </div>
        )}

        {/* Active Alerts */}
        <div className="alerts-container">
          <h2>Emergency Alerts</h2>
          {alerts.length === 0 ? (
            <p>No active alerts</p>
          ) : (
            alerts.map(alert => (
              <div 
                key={alert.id} 
                className={`alert alert-${alert.severity}`}
              >
                <div className="alert-header">
                  <h3>{alert.title}</h3>
                  <span className="severity">{alert.severity}</span>
                </div>
                <p>{alert.message}</p>
                <button onClick={() => acknowledgeAlert(alert.id)}>
                  Acknowledge
                </button>
              </div>
            ))
          )}
        </div>
      </main>

      <style jsx>{`
        .app {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        header {
          text-align: center;
          margin-bottom: 40px;
        }

        .status-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .alerts-container {
          margin-top: 40px;
        }

        .alert {
          background: white;
          border-left: 4px solid;
          border-radius: 8px;
          padding: 20px;
          margin: 15px 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .alert-critical {
          border-color: #dc2626;
          background: #fef2f2;
        }

        .alert-high {
          border-color: #ea580c;
          background: #fff7ed;
        }

        .alert-medium {
          border-color: #f59e0b;
          background: #fffbeb;
        }

        .alert-low {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .severity {
          text-transform: uppercase;
          font-size: 12px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 20px;
          background: rgba(0,0,0,0.1);
        }

        button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          margin-top: 10px;
        }

        button:hover {
          background: #2563eb;
        }
      `}</style>
    </div>
  );
}

export default App;
