#!/usr/bin/env python3
"""
Test script for offline audio transcription
"""
import os
from offline_transcription import OfflineAudioTranscriber

def test_offline_transcription():
    """Test the offline transcription system"""
    
    print("🎧 TESTING OFFLINE AUDIO TRANSCRIPTION")
    print("=" * 60)
    
    # Initialize transcriber
    try:
        transcriber = OfflineAudioTranscriber()
        print("✅ Offline transcriber initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize: {e}")
        return
    
    # Test with sample text (simulating transcription)
    test_cases = [
        "Attention everyone, important meeting in conference room A",
        "Emergency evacuation drill starting in 5 minutes", 
        "All passengers for flight 123 please proceed to gate B5",
        "Hey how are you doing today",  # Should be filtered as conversation
        "The weather is really nice outside"  # Should be filtered as conversation
    ]
    
    print("\n🔍 Testing announcement detection logic:")
    print("-" * 40)
    
    for i, text in enumerate(test_cases, 1):
        print(f"\nTest {i}: '{text}'")
        is_announcement = transcriber.is_announcement(text)
        announcement_type = transcriber.classify_announcement(text) if is_announcement else "N/A"
        
        status = "🔊 ANNOUNCEMENT" if is_announcement else "💬 CONVERSATION"
        print(f"Result: {status} (Type: {announcement_type})")
    
    print("\n" + "=" * 60)
    print("📋 HOW TO USE WITH REAL AUDIO FILES:")
    print("1. Save your audio file (WAV, MP3, etc.)")
    print("2. Run: python offline_transcription.py your_audio.wav")
    print("3. The system will transcribe and save to database just like live system")
    print("\n📝 Example:")
    print("python offline_transcription.py announcement.wav")
    print("python offline_transcription.py emergency_message.mp3")

if __name__ == "__main__":
    test_offline_transcription()