// ========================================
// TRANSCRIPTION MONITOR SERVICE
// Polls Supabase for new transcriptions and triggers haptic alerts
// ========================================

class TranscriptionMonitor {
    constructor(supabaseClient, hapticService) {
        this.supabase = supabaseClient;
        this.hapticService = hapticService;
        this.pollInterval = null;
        this.lastCheckedTimestamp = new Date().toISOString();
        this.userPhone = null;
        this.isActive = false;
        
        console.log('📢 Transcription Monitor initialized');
    }
    
    // Start monitoring for transcriptions
    startMonitoring(phone) {
        if (this.isActive) {
            console.log('⚠️ Transcription monitor already running');
            return;
        }
        
        this.userPhone = phone;
        this.isActive = true;
        this.lastCheckedTimestamp = new Date().toISOString();
        
        console.log('🎧 Starting transcription monitoring for:', phone);
        console.log('📅 Last checked:', this.lastCheckedTimestamp);
        
        // Check immediately on start
        this.checkForNewTranscriptions();
        
        // Then check every 10 seconds
        this.pollInterval = setInterval(() => {
            this.checkForNewTranscriptions();
        }, 10000); // 10 seconds
        
        console.log('✅ Transcription monitor started (checking every 10 seconds)');
    }
    
    // Stop monitoring
    stopMonitoring() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        this.isActive = false;
        console.log('🛑 Transcription monitoring stopped');
    }
    
    // Check for new transcriptions
    async checkForNewTranscriptions() {
        if (!this.isActive || !this.userPhone) {
            return;
        }
        
        try {
            console.log('🔍 Checking for new transcriptions...');
            
            // Get user's current subscription to find venue_id
            const { data: subscription, error: subError } = await this.supabase
                .from('wifi_subscriptions')
                .select('venue_id, active')
                .eq('phone', this.userPhone)
                .eq('active', true)
                .single();
            
            if (subError || !subscription || !subscription.venue_id) {
                console.log('ℹ️ User not active or not in any venue');
                return;
            }
            
            console.log('📍 User is active in venue:', subscription.venue_id);
            
            // Query for new announcements/transcriptions at this venue
            const { data: announcements, error: announcementError } = await this.supabase
                .from('temporary_announcements')
                .select('*')
                .eq('venue_id', subscription.venue_id)
                .eq('status', 'active')
                .gte('created_at', this.lastCheckedTimestamp)
                .order('created_at', { ascending: false });
            
            if (announcementError) {
                console.error('❌ Error fetching announcements:', announcementError);
                return;
            }
            
            if (announcements && announcements.length > 0) {
                console.log(`🎉 Found ${announcements.length} new announcement(s)!`);
                
                // Process each announcement
                for (const announcement of announcements) {
                    await this.processAnnouncement(announcement);
                }
                
                // Update last checked timestamp
                this.lastCheckedTimestamp = new Date().toISOString();
            } else {
                console.log('💤 No new announcements');
            }
            
        } catch (error) {
            console.error('❌ Error checking transcriptions:', error);
        }
    }
    
    // Process a single announcement
    async processAnnouncement(announcement) {
        console.log('========================================');
        console.log('📢 NEW ANNOUNCEMENT RECEIVED');
        console.log('========================================');
        console.log('Type:', announcement.announcement_type);
        console.log('Priority:', announcement.priority);
        console.log('Text:', announcement.transcribed_text);
        console.log('Created:', announcement.created_at);
        console.log('========================================');
        
        // Map priority to haptic severity
        const severityMap = {
            'high': 'critical',
            'medium': 'medium',
            'low': 'low'
        };
        
        const severity = severityMap[announcement.priority] || 'medium';
        
        // Map announcement type to morse code
        const morseMap = {
            'emergency': 'SOS',
            'security': 'ALERT',
            'general': 'ALERT',
            'transport': 'ALERT',
            'maintenance': 'ALERT'
        };
        
        const morseCode = morseMap[announcement.announcement_type] || 'ALERT';
        
        // Trigger haptic alert based on priority
        try {
            await this.hapticService.triggerAlert({
                severity: severity,
                type: announcement.announcement_type,
                morseMessage: morseCode,
                message: announcement.transcribed_text
            });
            
            console.log('✅ Haptic alert triggered successfully');
        } catch (error) {
            console.error('❌ Failed to trigger haptic alert:', error);
        }
        
        // Display notification to user
        this.displayNotification(announcement);
    }
    
    // Display visual notification
    displayNotification(announcement) {
        // Check if Notification API is supported
        if (!('Notification' in window)) {
            console.log('⚠️ Notifications not supported');
            return;
        }
        
        // Check permission
        if (Notification.permission === 'granted') {
            const notification = new Notification('🚨 Emergency Alert', {
                body: announcement.transcribed_text,
                icon: '/icon.png',
                badge: '/badge.png',
                vibrate: [200, 100, 200],
                requireInteraction: true,
                tag: announcement.id
            });
            
            notification.onclick = function() {
                window.focus();
                this.close();
            };
        } else if (Notification.permission !== 'denied') {
            // Request permission
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.displayNotification(announcement);
                }
            });
        }
        
        // Also show in-page alert
        this.showInPageAlert(announcement);
    }
    
    // Show in-page alert banner
    showInPageAlert(announcement) {
        // Determine text color based on priority (white bg needs dark text)
        const textColor = announcement.priority === 'low' ? '#1f2937' : 'white';
        const buttonBgColor = announcement.priority === 'low' ? '#1f2937' : 'white';
        const buttonTextColor = announcement.priority === 'low' ? 'white' : '#333';
        
        // Create alert banner
        const alertBanner = document.createElement('div');
        alertBanner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: ${this.getAlertColor(announcement.priority)};
            color: ${textColor};
            padding: 20px;
            text-align: center;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideDown 0.5s ease-out;
        `;
        
        const priorityEmoji = {
            'high': '🚨',
            'medium': '⚠️',
            'low': 'ℹ️'
        };
        
        alertBanner.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto;">
                <div style="font-size: 24px; margin-bottom: 10px;">
                    ${priorityEmoji[announcement.priority] || '📢'} ${announcement.announcement_type.toUpperCase()}
                </div>
                <div style="font-size: 18px; line-height: 1.5;">
                    ${announcement.transcribed_text}
                </div>
                <div style="margin-top: 15px;">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            style="background: ${buttonBgColor}; color: ${buttonTextColor}; border: none; padding: 10px 20px; 
                                   border-radius: 5px; font-weight: bold; cursor: pointer;">
                        Dismiss
                    </button>
                </div>
            </div>
        `;
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from { transform: translateY(-100%); }
                to { transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(alertBanner);
        
        // Auto-dismiss after 30 seconds for low priority, 60 seconds for high
        const dismissTime = announcement.priority === 'high' ? 60000 : 30000;
        setTimeout(() => {
            if (alertBanner.parentNode) {
                alertBanner.style.animation = 'slideDown 0.5s ease-out reverse';
                setTimeout(() => alertBanner.remove(), 500);
            }
        }, dismissTime);
    }
    
    // Get alert color based on priority
    getAlertColor(priority) {
        const colors = {
            'high': 'linear-gradient(135deg, #dc2626, #991b1b)',      // Red
            'medium': 'linear-gradient(135deg, #ea580c, #c2410c)',    // Orange
            'low': 'linear-gradient(135deg, #f8f9fa, #e9ecef)'        // White/Light gray
        };
        return colors[priority] || colors['medium'];
    }
}

// Initialize transcription monitor when page loads
console.log('📢 Transcription Monitor Service loaded');
