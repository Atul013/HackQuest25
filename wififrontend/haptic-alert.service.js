/**
 * Haptic Alert Service
 * Provides vibration, screen flash, and morse code alerts for critical emergencies
 * 
 * Features:
 * - Device vibration with custom patterns
 * - Screen flash using CSS/DOM manipulation
 * - Flashlight API (if supported)
 * - Morse code patterns for SOS and custom messages
 * - Permission management
 */

class HapticAlertService {
  constructor() {
    this.permissions = {
      vibration: false,
      flash: false,
      notifications: false
    };
    
    // Morse code timing (in milliseconds)
    this.morseTimings = {
      dot: 200,        // Short pulse
      dash: 600,       // Long pulse (3x dot)
      gapSymbol: 200,  // Gap between dots/dashes in same letter
      gapLetter: 600,  // Gap between letters
      gapWord: 1400    // Gap between words
    };
    
    // Morse code alphabet
    this.morseCode = {
      'SOS': '... --- ...',    // Emergency signal
      'ALERT': '.- .-.. . .-. -',
      'FIRE': '..-. .. .-. .',
      'HELP': '.... . .-.. .--.',
      'DANGER': '-.. .- -. --. . .-.',
      'EMERGENCY': '. -- . .-. --. . -. -.-. -.--'
    };
    
    this.isFlashing = false;
    this.flashController = null;
  }

  /**
   * Initialize and request permissions
   */
  async initialize() {
    try {
      // Check vibration support
      this.permissions.vibration = 'vibrate' in navigator;
      
      // Check notification permission (required for background alerts)
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          this.permissions.notifications = true;
        } else if (Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission();
          this.permissions.notifications = permission === 'granted';
        }
      }
      
      // Flash permission is implicit (uses screen or flashlight)
      this.permissions.flash = true;
      
      console.log('Haptic Alert Service initialized:', this.permissions);
      return this.permissions;
    } catch (error) {
      console.error('Failed to initialize haptic alerts:', error);
      return this.permissions;
    }
  }

  /**
   * Trigger alert with all available methods (updated for priority-based behavior)
   */
  async triggerAlert(alertData) {
    const {
      severity = 'critical',
      message = 'EMERGENCY',
      type = 'general',
      morseMessage = 'SOS'
    } = alertData;

    console.log('🚨 ALERT TRIGGERED:', alertData);

    const promises = [];

    // 1. Vibration - ENABLED FOR ALL PRIORITIES
    if (this.permissions.vibration) {
      promises.push(this.vibrateEmergencyPattern(severity));
    }

    // 2. Screen flash - Different behavior based on priority
    if (this.permissions.flash) {
      if (severity === 'low') {
        // Single white flash for low priority
        promises.push(this.flashSingleWhite());
      } else {
        // Morse code flash for critical and medium priority
        promises.push(this.flashMorseCode(morseMessage, severity));
      }
    }

    // 3. Try flashlight (if available on device)
    if (this.isFlashlightAvailable() && severity !== 'low') {
      promises.push(this.flashlightMorseCode(morseMessage));
    }

    // Execute all alerts simultaneously
    await Promise.allSettled(promises);
  }

  /**
   * Legacy method name for backwards compatibility
   */
  async triggerCriticalAlert(alertData) {
    return this.triggerAlert(alertData);
  }

  /**
   * Emergency vibration patterns based on severity
   * NOW ENABLED FOR ALL PRIORITIES with adjusted intensities
   */
  async vibrateEmergencyPattern(severity) {
    if (!this.permissions.vibration) {
      console.warn('Vibration not supported');
      return;
    }

    let pattern;
    let repeatCount = 1; // How many times to repeat the pattern
    
    switch (severity) {
      case 'critical':
        // SOS pattern: ... --- ... (short short short, long long long, short short short)
        pattern = [
          200, 100, 200, 100, 200, 300,  // ... (SOS S)
          600, 100, 600, 100, 600, 300,  // --- (SOS O)
          200, 100, 200, 100, 200        // ... (SOS S)
        ];
        repeatCount = 3; // Repeat 3 times for critical
        break;
        
      case 'medium':
        // Double pulse (medium intensity)
        pattern = [400, 200, 400];
        repeatCount = 2; // Repeat twice for medium
        break;
        
      case 'low':
        // Single gentle pulse for low priority
        pattern = [300];
        repeatCount = 1; // Single pulse only
        break;
        
      default:
        // Default to single pulse
        pattern = [300];
        repeatCount = 1;
    }

    try {
      // Vibrate with pattern
      for (let i = 0; i < repeatCount; i++) {
        navigator.vibrate(pattern);
        if (i < repeatCount - 1) {
          await this.sleep(1000); // 1 second gap between repetitions
        }
      }
      
      console.log(`✓ Vibration pattern executed: ${severity} (${repeatCount}x)`);
    } catch (error) {
      console.error('Vibration failed:', error);
    }
  }

  /**
   * Flash screen in morse code pattern (for critical and medium priority)
   */
  async flashMorseCode(message = 'SOS', severity = 'critical') {
    if (this.isFlashing) {
      console.log('Already flashing, skipping...');
      return;
    }

    this.isFlashing = true;
    this.flashController = new AbortController();

    try {
      // Get morse code pattern
      const morsePattern = this.morseCode[message.toUpperCase()] || this.morseCode['SOS'];
      
      console.log(`Flashing morse code: ${message} = ${morsePattern} (${severity})`);

      // Create flash overlay with color based on severity
      let flashOverlay = document.getElementById('emergency-flash-overlay');
      if (!flashOverlay) {
        flashOverlay = this.createFlashOverlay();
      }

      // Set flash color based on severity
      const flashColor = severity === 'critical' ? '#FF0000' : '#FF8C00'; // Red for critical, Orange for medium
      flashOverlay.style.backgroundColor = flashColor;

      // Execute morse code flashes
      await this.executeMorseFlash(morsePattern, flashOverlay);

      // Repeat based on severity: 3x for critical, 2x for medium
      const repeatCount = severity === 'critical' ? 2 : 1;
      for (let i = 0; i < repeatCount; i++) {
        if (this.flashController.signal.aborted) break;
        await this.sleep(this.morseTimings.gapWord * 2);
        await this.executeMorseFlash(morsePattern, flashOverlay);
      }

      console.log(`✓ Morse code flash completed (${severity})`);
    } catch (error) {
      console.error('Flash morse code failed:', error);
    } finally {
      this.isFlashing = false;
    }
  }

  /**
   * Single white flash for low priority alerts
   */
  async flashSingleWhite() {
    if (this.isFlashing) {
      console.log('Already flashing, skipping...');
      return;
    }

    this.isFlashing = true;

    try {
      console.log('Flashing single white flash (low priority)');

      // Create flash overlay
      let flashOverlay = document.getElementById('emergency-flash-overlay');
      if (!flashOverlay) {
        flashOverlay = this.createFlashOverlay();
      }

      // Set white color for low priority
      flashOverlay.style.backgroundColor = '#FFFFFF';

      // Single flash: 500ms duration
      await this.flash(flashOverlay, 500);

      console.log('✓ Single white flash completed');
    } catch (error) {
      console.error('Flash failed:', error);
    } finally {
      this.isFlashing = false;
    }
  }

  /**
   * Create full-screen flash overlay
   */
  createFlashOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'emergency-flash-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: white;
      z-index: 999999;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.1s ease;
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  /**
   * Execute morse code flash pattern
   */
  async executeMorseFlash(morsePattern, overlay) {
    const symbols = morsePattern.split(' ');

    for (const symbol of symbols) {
      if (this.flashController?.signal.aborted) break;

      for (const char of symbol) {
        if (char === '.') {
          // Dot: short flash
          await this.flash(overlay, this.morseTimings.dot);
        } else if (char === '-') {
          // Dash: long flash
          await this.flash(overlay, this.morseTimings.dash);
        }
        
        // Gap between symbols in same letter
        await this.sleep(this.morseTimings.gapSymbol);
      }
      
      // Gap between letters
      await this.sleep(this.morseTimings.gapLetter);
    }
  }

  /**
   * Single flash
   */
  async flash(overlay, duration) {
    overlay.style.opacity = '1';
    await this.sleep(duration);
    overlay.style.opacity = '0';
  }

  /**
   * Check if flashlight API is available (experimental)
   */
  isFlashlightAvailable() {
    return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
  }

  /**
   * Use device flashlight for morse code (if available)
   * This requires camera permission and is experimental
   */
  async flashlightMorseCode(message = 'SOS') {
    try {
      // Request camera access for flashlight
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();

      if (!capabilities.torch) {
        console.log('Flashlight not available on this device');
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      const morsePattern = this.morseCode[message.toUpperCase()] || this.morseCode['SOS'];
      const symbols = morsePattern.split(' ');

      // Execute morse code with flashlight
      for (const symbol of symbols) {
        for (const char of symbol) {
          const duration = char === '.' ? this.morseTimings.dot : this.morseTimings.dash;
          
          // Turn on
          await track.applyConstraints({ advanced: [{ torch: true }] });
          await this.sleep(duration);
          
          // Turn off
          await track.applyConstraints({ advanced: [{ torch: false }] });
          await this.sleep(this.morseTimings.gapSymbol);
        }
        await this.sleep(this.morseTimings.gapLetter);
      }

      // Cleanup
      stream.getTracks().forEach(track => track.stop());
      console.log('✓ Flashlight morse code completed');
    } catch (error) {
      console.log('Flashlight not available or permission denied:', error.message);
    }
  }

  /**
   * Stop all active alerts
   */
  stopAlerts() {
    // Stop vibration
    if (this.permissions.vibration) {
      navigator.vibrate(0);
    }

    // Stop flashing
    if (this.flashController) {
      this.flashController.abort();
      this.flashController = null;
    }

    // Remove flash overlay
    const overlay = document.getElementById('emergency-flash-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 300);
    }

    this.isFlashing = false;
    console.log('✓ All alerts stopped');
  }

  /**
   * Test the alert system
   */
  async testAlert(type = 'critical') {
    console.log(`Testing ${type} alert...`);
    
    await this.triggerCriticalAlert({
      severity: type,
      message: 'TEST ALERT',
      morseMessage: 'SOS'
    });
  }

  /**
   * Helper: Sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current permissions status
   */
  getPermissions() {
    return { ...this.permissions };
  }

  /**
   * Check if alerts are available
   */
  isAvailable() {
    return this.permissions.vibration || this.permissions.flash;
  }
}

// Export singleton instance
export const hapticAlertService = new HapticAlertService();
export default hapticAlertService;
