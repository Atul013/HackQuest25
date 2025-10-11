#!/usr/bin/env python3
"""
Test script to insert sample transcription data for WiFi alert testing
"""

import os
import sys
from datetime import datetime
from supabase import create_client, Client

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def main():
    print("🧪 Testing Database Insert for WiFi Alerts")
    
    # Supabase configuration
    SUPABASE_URL = 'https://akblmbpxxotmebzghczj.supabase.co'
    SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrYmxtYnB4eG90bWViemdoY3pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNzQxMDUsImV4cCI6MjA3NTY1MDEwNX0.6d8XmmmoSh0hY8OWoymIEX7UnQU6qpgyQsyIe7_KHtI'
    
    try:
        # Initialize Supabase client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        print("✅ Supabase client initialized")
        
        # Test announcement messages
        test_announcements = [
            {
                "transcription_text": "Attention all visitors: Fire drill will commence in 5 minutes. Please prepare to evacuate the building in an orderly fashion.",
                "is_announcement": True,
                "device_id": "wifi_test_device",
                "created_at": datetime.now().isoformat()
            },
            {
                "transcription_text": "Important announcement: The conference session will begin in 10 minutes in the main auditorium. Please take your seats.",
                "is_announcement": True,
                "device_id": "wifi_test_device",
                "created_at": datetime.now().isoformat()
            },
            {
                "transcription_text": "Emergency alert: Severe weather warning in effect. Please move to designated safe areas immediately.",
                "is_announcement": True,
                "device_id": "wifi_test_device", 
                "created_at": datetime.now().isoformat()
            }
        ]
        
        # Insert test data
        for i, announcement in enumerate(test_announcements, 1):
            try:
                result = supabase.table('transcriptions').insert(announcement).execute()
                if result.data:
                    print(f"✅ Test announcement {i} inserted successfully: ID {result.data[0]['id']}")
                else:
                    print(f"❌ Failed to insert test announcement {i}")
            except Exception as e:
                print(f"❌ Error inserting announcement {i}: {e}")
        
        print("\n🎯 Test data inserted! Now check the WiFi login page for alerts.")
        print("📱 Open browser console and run: testSupabaseConnection()")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    main()