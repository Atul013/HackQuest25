import React, { useState, useEffect } from 'react';
import hapticAlertService from '../services/haptic-alert.service';

/**
 * Haptic Alert Demo Component
 * Demonstrates vibration, screen flash, and morse code alerts
 */
const HapticAlertDemo = () => {
  const [permissions, setPermissions] = useState({
    vibration: false,
    flash: false,
    notifications: false
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAlerting, setIsAlerting] = useState(false);

  useEffect(() => {
    initializeService();
  }, []);

  const initializeService = async () => {
    const perms = await hapticAlertService.initialize();
    setPermissions(perms);
    setIsInitialized(true);
  };

  const handleTestAlert = async (severity) => {
    setIsAlerting(true);
    
    await hapticAlertService.triggerCriticalAlert({
      severity: severity,
      message: 'TEST ALERT',
      type: 'test',
      morseMessage: 'SOS'
    });

    setTimeout(() => setIsAlerting(false), 10000); // Reset after 10 seconds
  };

  const handleStopAlert = () => {
    hapticAlertService.stopAlerts();
    setIsAlerting(false);
  };

  const handleCustomMorse = async (message) => {
    setIsAlerting(true);
    await hapticAlertService.flashMorseCode(message);
    setTimeout(() => setIsAlerting(false), 5000);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🚨 Haptic Alert System
        </h2>
        <p className="text-gray-600">
          Critical emergency alerts using vibration, screen flash, and morse code
        </p>
      </div>

      {/* Permissions Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">Permissions Status</h3>
        <div className="space-y-2">
          <PermissionStatus 
            label="Vibration" 
            enabled={permissions.vibration}
            icon="📳"
          />
          <PermissionStatus 
            label="Screen Flash" 
            enabled={permissions.flash}
            icon="💡"
          />
          <PermissionStatus 
            label="Notifications" 
            enabled={permissions.notifications}
            icon="🔔"
          />
        </div>
      </div>

      {/* Test Buttons */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Test Alerts</h3>
        <div className="grid grid-cols-1 gap-3">
          <AlertButton
            severity="critical"
            label="Critical Alert (SOS)"
            color="red"
            onClick={() => handleTestAlert('critical')}
            disabled={isAlerting || !isInitialized}
          />
          <AlertButton
            severity="high"
            label="High Priority Alert"
            color="orange"
            onClick={() => handleTestAlert('high')}
            disabled={isAlerting || !isInitialized}
          />
          <AlertButton
            severity="medium"
            label="Medium Priority Alert"
            color="yellow"
            onClick={() => handleTestAlert('medium')}
            disabled={isAlerting || !isInitialized}
          />
        </div>
      </div>

      {/* Morse Code Messages */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Morse Code Messages</h3>
        <div className="grid grid-cols-2 gap-2">
          <MorseButton message="SOS" onClick={handleCustomMorse} disabled={isAlerting} />
          <MorseButton message="HELP" onClick={handleCustomMorse} disabled={isAlerting} />
          <MorseButton message="FIRE" onClick={handleCustomMorse} disabled={isAlerting} />
          <MorseButton message="DANGER" onClick={handleCustomMorse} disabled={isAlerting} />
        </div>
      </div>

      {/* Stop Button */}
      {isAlerting && (
        <button
          onClick={handleStopAlert}
          className="w-full py-3 px-4 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition-colors"
        >
          ⏹️ Stop All Alerts
        </button>
      )}

      {/* Info Section */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">How It Works</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Vibration patterns encode morse code</li>
          <li>✓ Screen flashes in synchronized morse code</li>
          <li>✓ Flashlight (if available) also uses morse code</li>
          <li>✓ SOS: ... --- ... (3 short, 3 long, 3 short)</li>
          <li>✓ Works even when phone is in silent mode</li>
        </ul>
      </div>
    </div>
  );
};

// Permission Status Component
const PermissionStatus = ({ label, enabled, icon }) => (
  <div className="flex items-center justify-between">
    <span className="text-gray-700">
      {icon} {label}
    </span>
    <span className={`px-2 py-1 rounded text-xs font-semibold ${
      enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      {enabled ? '✓ Enabled' : '✗ Disabled'}
    </span>
  </div>
);

// Alert Button Component
const AlertButton = ({ severity, label, color, onClick, disabled }) => {
  const colorClasses = {
    red: 'bg-red-500 hover:bg-red-600',
    orange: 'bg-orange-500 hover:bg-orange-600',
    yellow: 'bg-yellow-500 hover:bg-yellow-600'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`py-3 px-4 ${colorClasses[color]} text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      🚨 {label}
    </button>
  );
};

// Morse Button Component
const MorseButton = ({ message, onClick, disabled }) => (
  <button
    onClick={() => onClick(message)}
    disabled={disabled}
    className="py-2 px-3 bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {message}
  </button>
);

export default HapticAlertDemo;
