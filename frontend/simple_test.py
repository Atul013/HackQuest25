#!/usr/bin/env python3
"""
Simple test script for announcement detection logic only
This tests just the text-based announcement detection without audio processing
"""

import re

class SimpleAnnouncementTester:
    def __init__(self):
        # Announcement keywords/patterns
        self.announcement_patterns = [
            r'\b(attention|announcement|notice|important|alert|urgent)\b',
            r'\b(please note|kindly note|for your information|fyi)\b',
            r'\b(all passengers|all students|all staff|all users|everyone)\b',
            r'\b(boarding|departure|arrival|gate|platform|floor|room)\b',
            r'\b(reminder|warning|caution|safety|emergency)\b',
            r'\b(now boarding|final call|last call|delayed|cancelled)\b',
            r'\b(meeting|event|session|break|lunch|closing)\b'
        ]
        
    def is_announcement(self, text: str) -> bool:
        """Determine if the transcribed text is likely an announcement"""
        text_lower = text.lower()
        
        # Check for announcement patterns
        for pattern in self.announcement_patterns:
            if re.search(pattern, text_lower):
                print(f"   Matched pattern: {pattern}")
                return True
        
        # Additional heuristics for announcements:
        
        # 1. Length check - announcements are usually longer than casual conversation
        if len(text.split()) < 5:
            print(f"   Too short: {len(text.split())} words")
            return False
            
        # 2. Formal language indicators
        formal_indicators = ['please', 'kindly', 'thank you', 'ladies and gentlemen']
        formal_count = sum(1 for indicator in formal_indicators if indicator in text_lower)
        
        # 3. Time-related announcements
        time_indicators = ['minutes', 'hours', 'o\'clock', 'am', 'pm', 'schedule', 'time']
        time_count = sum(1 for indicator in time_indicators if indicator in text_lower)
        
        # 4. Location/direction indicators
        location_indicators = ['to', 'from', 'at', 'in', 'gate', 'platform', 'room', 'floor', 'building']
        location_count = sum(1 for indicator in location_indicators if indicator in text_lower)
        
        # Score-based decision
        score = formal_count * 2 + time_count + location_count
        print(f"   Score: {score} (formal:{formal_count}, time:{time_count}, location:{location_count})")
        
        if score >= 3:
            return True
            
        return False
    
    def classify_announcement(self, text: str) -> str:
        """Classify the type of announcement"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['boarding', 'gate', 'departure', 'arrival', 'flight']):
            return 'travel'
        elif any(word in text_lower for word in ['meeting', 'session', 'conference', 'break']):
            return 'meeting'
        elif any(word in text_lower for word in ['emergency', 'evacuation', 'safety', 'alert']):
            return 'emergency'
        elif any(word in text_lower for word in ['reminder', 'notice', 'information']):
            return 'general'
        else:
            return 'other'

def test_announcement_detection():
    """Test the announcement detection with sample texts"""
    
    tester = SimpleAnnouncementTester()
    
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
        result = tester.is_announcement(text)
        is_correct = result == expected
        
        status = "✅ CORRECT" if is_correct else "❌ WRONG"
        announcement_type = tester.classify_announcement(text) if result else "N/A"
        
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

if __name__ == "__main__":
    try:
        test_announcement_detection()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user.")
    except Exception as e:
        print(f"\nError during testing: {e}")