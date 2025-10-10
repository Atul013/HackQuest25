#!/usr/bin/env python3
"""
Test script for announcement detection
This script allows you to test the announcement detection logic without recording audio
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from model import LiveAudioTranscriber

def test_announcement_detection():
    """Test the announcement detection with sample texts"""
    
    transcriber = LiveAudioTranscriber()
    
    # Test cases: (text, expected_result)
    test_cases = [
        # Should be detected as announcements
        ("Attention all passengers, flight 123 is now boarding at gate 5", True),
        ("Please note that the meeting will start in 5 minutes in conference room A", True),
        ("Important announcement: the building will be closed for maintenance", True),
        ("All students please gather in the main hall for the assembly", True),
        ("Final call for passengers on flight 456 to New York", True),
        ("For your information, lunch break will be extended by 15 minutes", True),
        ("Ladies and gentlemen, we are experiencing a slight delay", True),
        ("Reminder: all staff meeting at 3 PM in the boardroom", True),
        
        # Should NOT be detected as announcements (regular conversation)
        ("How are you doing today?", False),
        ("I think we should go to lunch", False),
        ("Can you help me with this?", False),
        ("The weather is nice today", False),
        ("What time is it?", False),
        ("I like this song", False),
        ("Hello there", False),
        ("Thanks for your help", False),
    ]
    
    print("🧪 Testing Announcement Detection Logic\n")
    print("=" * 60)
    
    correct_predictions = 0
    total_tests = len(test_cases)
    
    for i, (text, expected) in enumerate(test_cases, 1):
        result = transcriber.is_announcement(text)
        is_correct = result == expected
        
        status = "✅ CORRECT" if is_correct else "❌ WRONG"
        announcement_type = transcriber.classify_announcement(text) if result else "N/A"
        
        print(f"Test {i:2d}: {status}")
        print(f"   Text: '{text}'")
        print(f"   Expected: {'Announcement' if expected else 'Regular conversation'}")
        print(f"   Detected: {'Announcement' if result else 'Regular conversation'}")
        if result:
            print(f"   Type: {announcement_type}")
        print()
        
        if is_correct:
            correct_predictions += 1
    
    accuracy = (correct_predictions / total_tests) * 100
    
    print("=" * 60)
    print(f"📊 RESULTS:")
    print(f"   Correct predictions: {correct_predictions}/{total_tests}")
    print(f"   Accuracy: {accuracy:.1f}%")
    
    if accuracy >= 85:
        print("   🎉 Great! The detection logic is working well.")
    elif accuracy >= 70:
        print("   👍 Good accuracy, but could be improved.")
    else:
        print("   ⚠️  Low accuracy, consider adjusting the detection logic.")

def test_classification():
    """Test announcement type classification"""
    
    transcriber = LiveAudioTranscriber()
    
    test_texts = [
        ("Flight 123 is now boarding at gate 5", "travel"),
        ("Meeting starts in conference room A", "meeting"),
        ("Emergency evacuation required", "emergency"),
        ("Reminder to submit your reports", "general"),
        ("The cafeteria menu for today", "other"),
    ]
    
    print("\n🏷️  Testing Announcement Classification\n")
    print("=" * 60)
    
    for text, expected_type in test_texts:
        detected_type = transcriber.classify_announcement(text)
        status = "✅" if detected_type == expected_type else "❌"
        
        print(f"{status} Text: '{text}'")
        print(f"   Expected: {expected_type}")
        print(f"   Detected: {detected_type}")
        print()

if __name__ == "__main__":
    try:
        test_announcement_detection()
        test_classification()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user.")
    except Exception as e:
        print(f"\nError during testing: {e}")