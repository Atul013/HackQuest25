#!/usr/bin/env python3
"""
Advanced test script for announcement detection with comprehensive dataset
This includes edge cases, ambiguous cases, and real-world scenarios
"""

import re
import json
from typing import Dict, List, Tuple

class AdvancedAnnouncementTester:
    def __init__(self):
        # Enhanced announcement patterns
        self.announcement_patterns = [
            # Direct announcement words
            r'\b(attention|announcement|notice|important|alert|urgent|bulletin)\b',
            r'\b(please note|kindly note|for your information|fyi|be advised)\b',
            
            # Group addressing
            r'\b(all passengers|all students|all staff|all users|everyone|ladies and gentlemen)\b',
            r'\b(dear passengers|dear students|dear customers|valued customers)\b',
            
            # Transportation/venue specific
            r'\b(boarding|departure|arrival|gate|platform|floor|room|terminal|bay)\b',
            r'\b(now boarding|final call|last call|delayed|cancelled|rescheduled)\b',
            r'\b(track|concourse|level|section|area|zone|wing)\b',
            
            # Meeting/event related
            r'\b(meeting|event|session|break|lunch|closing|opening|ceremony)\b',
            r'\b(conference|seminar|workshop|presentation|briefing)\b',
            
            # Safety/emergency
            r'\b(reminder|warning|caution|safety|emergency|evacuation|drill)\b',
            r'\b(code red|code blue|lockdown|all clear)\b',
            
            # Time-sensitive announcements
            r'\b(starting|beginning|commencing|concluding|ending|resuming)\b',
            r'\b(scheduled|postponed|moved|relocated|transferred)\b',
            
            # Service announcements
            r'\b(service|facility|available|unavailable|closed|open)\b',
            r'\b(maintenance|cleaning|inspection|testing)\b'
        ]
        
        # Conversational indicators (things that suggest casual conversation)
        self.conversation_indicators = [
            r'\b(i think|i feel|i believe|in my opinion|personally)\b',
            r'\b(how are you|what\'s up|hey|hi|hello|bye|goodbye)\b',
            r'\b(can you|could you|would you|will you)\b',
            r'\b(i like|i love|i hate|i prefer)\b',
            r'\b(maybe|perhaps|probably|possibly)\b',
            r'\b(oh|ah|um|uh|well|so|anyway)\b'
        ]
        
    def enhanced_is_announcement(self, text: str) -> Dict:
        """Enhanced announcement detection with detailed scoring"""
        text_lower = text.lower()
        result = {
            'is_announcement': False,
            'confidence': 0.0,
            'pattern_matches': [],
            'conversation_indicators': 0,
            'formal_score': 0,
            'time_score': 0,
            'location_score': 0,
            'structure_score': 0,
            'total_score': 0
        }
        
        # 1. Check for direct announcement patterns
        pattern_score = 0
        for pattern in self.announcement_patterns:
            if re.search(pattern, text_lower):
                pattern_score += 2  # High weight for direct patterns
                result['pattern_matches'].append(pattern)
        
        # 2. Check for conversational indicators (negative score)
        conversation_score = 0
        for pattern in self.conversation_indicators:
            if re.search(pattern, text_lower):
                conversation_score += 1
        result['conversation_indicators'] = conversation_score
        
        # 3. Length and structure analysis
        words = text.split()
        word_count = len(words)
        
        # Too short is likely not an announcement
        if word_count < 5:
            result['structure_score'] = -2
        elif word_count < 8:
            result['structure_score'] = -1
        elif word_count >= 10:
            result['structure_score'] = 1
        
        # 4. Formal language indicators (enhanced)
        formal_indicators = [
            'please', 'kindly', 'thank you', 'ladies and gentlemen',
            'we would like to', 'we are pleased to', 'we regret to',
            'due to', 'as a result of', 'in order to', 'effective immediately',
            'passengers are', 'customers are', 'students are', 'staff are'
        ]
        formal_count = sum(1 for indicator in formal_indicators if indicator in text_lower)
        result['formal_score'] = formal_count
        
        # 5. Time-related indicators (enhanced)
        time_indicators = [
            'minutes', 'hours', 'o\'clock', 'am', 'pm', 'schedule', 'time',
            'today', 'tomorrow', 'yesterday', 'now', 'soon', 'shortly',
            'immediately', 'currently', 'presently', 'at this time',
            'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
        ]
        time_count = sum(1 for indicator in time_indicators if indicator in text_lower)
        result['time_score'] = time_count
        
        # 6. Location/direction indicators (enhanced)
        location_indicators = [
            'to', 'from', 'at', 'in', 'gate', 'platform', 'room', 'floor', 'building',
            'terminal', 'departure', 'arrival', 'lounge', 'hall', 'auditorium',
            'classroom', 'office', 'lobby', 'entrance', 'exit', 'left', 'right',
            'north', 'south', 'east', 'west', 'upstairs', 'downstairs'
        ]
        location_count = sum(1 for indicator in location_indicators if indicator in text_lower)
        result['location_score'] = location_count
        
        # 7. Sentence structure analysis
        structure_bonus = 0
        # Announcements often start with attention-grabbing words
        first_words = text_lower[:20].split()
        if first_words and first_words[0] in ['attention', 'notice', 'announcement', 'important', 'please', 'all', 'ladies', 'dear']:
            structure_bonus += 2
        
        # Announcements often contain imperative or declarative statements
        if any(phrase in text_lower for phrase in ['please', 'will', 'are', 'is', 'has been', 'have been']):
            structure_bonus += 1
        
        # Calculate total score
        total_score = (
            pattern_score +
            result['formal_score'] * 1.5 +
            result['time_score'] * 1.0 +
            result['location_score'] * 0.8 +
            result['structure_score'] +
            structure_bonus -
            conversation_score * 2  # Penalty for conversational indicators
        )
        
        result['total_score'] = total_score
        
        # Determine if it's an announcement based on score
        if pattern_score > 0:  # Direct pattern match is strong indicator
            result['is_announcement'] = True
            result['confidence'] = min(0.9, 0.6 + (total_score * 0.1))
        elif total_score >= 4:  # High score without direct pattern
            result['is_announcement'] = True
            result['confidence'] = min(0.8, 0.4 + (total_score * 0.1))
        elif total_score >= 2 and conversation_score == 0:  # Medium score, no conversation indicators
            result['is_announcement'] = True
            result['confidence'] = min(0.7, 0.3 + (total_score * 0.1))
        else:
            result['is_announcement'] = False
            result['confidence'] = max(0.1, 0.5 - abs(total_score) * 0.1)
        
        return result
    
    def classify_announcement(self, text: str) -> str:
        """Enhanced announcement classification"""
        text_lower = text.lower()
        
        # Travel/Transportation
        if any(word in text_lower for word in ['boarding', 'gate', 'departure', 'arrival', 'flight', 'train', 'bus', 'platform', 'track', 'terminal']):
            return 'travel'
        
        # Meeting/Conference
        elif any(word in text_lower for word in ['meeting', 'session', 'conference', 'seminar', 'workshop', 'presentation', 'briefing', 'break', 'lunch']):
            return 'meeting'
        
        # Emergency/Safety
        elif any(word in text_lower for word in ['emergency', 'evacuation', 'safety', 'alert', 'drill', 'code red', 'code blue', 'lockdown']):
            return 'emergency'
        
        # Service/Facility
        elif any(word in text_lower for word in ['service', 'facility', 'maintenance', 'cleaning', 'closed', 'open', 'available', 'unavailable']):
            return 'service'
        
        # General/Information
        elif any(word in text_lower for word in ['reminder', 'notice', 'information', 'update', 'change', 'schedule']):
            return 'general'
        
        else:
            return 'other'

def create_comprehensive_test_dataset() -> List[Tuple[str, bool, str]]:
    """Create a comprehensive test dataset with diverse examples"""
    
    # Format: (text, is_announcement, description)
    test_cases = [
        # === CLEAR ANNOUNCEMENTS ===
        ("Attention all passengers, flight 123 is now boarding at gate 5", True, "Clear travel announcement"),
        ("Please note that the meeting will start in 5 minutes in conference room A", True, "Meeting announcement"),
        ("Important announcement: the building will be closed for maintenance tomorrow", True, "Service announcement"),
        ("All students please gather in the main hall for the assembly at 3 PM", True, "Educational announcement"),
        ("Final call for passengers on flight 456 to New York, please proceed to gate 12", True, "Travel final call"),
        ("For your information, lunch break will be extended by 15 minutes today", True, "General announcement"),
        ("Ladies and gentlemen, we are experiencing a slight delay due to technical issues", True, "Service delay announcement"),
        ("Reminder: all staff meeting at 3 PM in the boardroom", True, "Meeting reminder"),
        
        # === BORDERLINE ANNOUNCEMENTS ===
        ("The elevator on the third floor is currently out of service", True, "Service notification"),
        ("Please keep your belongings with you at all times", True, "Safety reminder"),
        ("The cafeteria will be serving lunch until 2 PM today", True, "Service information"),
        ("Due to weather conditions, all outdoor events have been postponed", True, "Event announcement"),
        ("We would like to remind everyone that smoking is prohibited in this building", True, "Policy reminder"),
        ("The library will be closing in 15 minutes, please complete your work", True, "Closing announcement"),
        ("Please note that parking is available in the west lot only", True, "Parking announcement"),
        ("All visitors must sign in at the front desk before entering", True, "Policy announcement"),
        
        # === CHALLENGING CASES (should be announcements) ===
        ("The next train to downtown will arrive on platform 2 in 5 minutes", True, "Transit information"),
        ("Please stand clear of the closing doors", True, "Safety instruction"),
        ("This is your captain speaking, we are beginning our descent into Los Angeles", True, "Captain announcement"),
        ("Code blue, code blue, medical emergency on the second floor", True, "Emergency announcement"),
        ("The fire drill will commence in 2 minutes, please exit via the nearest stairwell", True, "Emergency drill"),
        ("Passengers traveling to Chicago, your flight has been moved to gate 15", True, "Gate change"),
        ("The swimming pool will be closed for cleaning from 2 to 4 PM", True, "Facility closure"),
        ("Please have your tickets ready for inspection", True, "Instruction announcement"),
        
        # === CLEAR CONVERSATIONS ===
        ("How are you doing today?", False, "Casual greeting"),
        ("I think we should go to lunch now", False, "Personal suggestion"),
        ("Can you help me with this problem?", False, "Personal request"),
        ("The weather is really nice today, isn't it?", False, "Weather small talk"),
        ("What time is it right now?", False, "Time inquiry"),
        ("I like this song that's playing", False, "Personal preference"),
        ("Hello there, how can I help you?", False, "Customer service greeting"),
        ("Thanks for your help with that project", False, "Personal thanks"),
        
        # === CHALLENGING CONVERSATIONS (should NOT be announcements) ===
        ("I think the meeting starts at 3 PM", False, "Personal opinion about meeting"),
        ("Maybe we should go to the gate now", False, "Personal suggestion"),
        ("Do you know if the cafeteria is still open?", False, "Personal inquiry"),
        ("I heard there might be a delay", False, "Casual information sharing"),
        ("Could you please help me find the restroom?", False, "Personal request for directions"),
        ("I wonder if the elevator is working", False, "Personal wondering"),
        ("What do you think about the lunch break extension?", False, "Personal question"),
        ("I believe the parking lot is full", False, "Personal belief"),
        
        # === TRICKY CASES ===
        ("Let's go to lunch in the cafeteria", False, "Group suggestion (not announcement)"),
        ("I think there's an announcement about the meeting", False, "Talking ABOUT announcements"),
        ("The fire alarm is really loud, isn't it?", False, "Personal observation"),
        ("I need to catch the 3 PM train", False, "Personal schedule"),
        ("My flight was delayed by 2 hours", False, "Personal travel update"),
        ("The conference room is really nice", False, "Personal opinion"),
        ("Someone said the elevator is broken", False, "Casual information relay"),
        ("I wonder when the next announcement will be", False, "Personal wondering"),
        
        # === BUSINESS/FORMAL CONVERSATIONS (challenging) ===
        ("We need to schedule a meeting for next week", False, "Business planning"),
        ("The quarterly report is due tomorrow", False, "Work reminder between colleagues"),
        ("Could you please send me the presentation slides?", False, "Work request"),
        ("I'll be in conference room B if you need me", False, "Personal location update"),
        ("The client meeting went really well today", False, "Work conversation"),
        ("We should probably leave for the airport soon", False, "Personal travel planning"),
        ("The new office policy seems reasonable", False, "Opinion about policy"),
        ("I forgot to mention the deadline change", False, "Personal forgetfulness"),
    ]
    
    return test_cases

def run_comprehensive_test():
    """Run comprehensive testing with detailed analysis"""
    
    tester = AdvancedAnnouncementTester()
    test_cases = create_comprehensive_test_dataset()
    
    print("🧪 Comprehensive Announcement Detection Test")
    print("=" * 80)
    print(f"Testing {len(test_cases)} diverse cases...\n")
    
    results = []
    correct_predictions = 0
    
    for i, (text, expected, description) in enumerate(test_cases, 1):
        result = tester.enhanced_is_announcement(text)
        detected = result['is_announcement']
        is_correct = detected == expected
        
        status = "✅ CORRECT" if is_correct else "❌ WRONG"
        confidence = result['confidence']
        
        print(f"Test {i:2d}: {status} (confidence: {confidence:.1f})")
        print(f"   Text: '{text}'")
        print(f"   Type: {description}")
        print(f"   Expected: {'Announcement' if expected else 'Conversation'}")
        print(f"   Detected: {'Announcement' if detected else 'Conversation'}")
        
        if result['pattern_matches']:
            print(f"   Patterns: {', '.join(result['pattern_matches'][:2])}")
        
        print(f"   Score: {result['total_score']:.1f} (formal:{result['formal_score']}, time:{result['time_score']}, location:{result['location_score']}, conv_penalty:{result['conversation_indicators']})")
        
        if detected:
            announcement_type = tester.classify_announcement(text)
            print(f"   Classification: {announcement_type}")
        
        print()
        
        if is_correct:
            correct_predictions += 1
        
        results.append({
            'text': text,
            'expected': expected,
            'detected': detected,
            'correct': is_correct,
            'confidence': confidence,
            'description': description,
            'score': result['total_score']
        })
    
    # Overall statistics
    accuracy = (correct_predictions / len(test_cases)) * 100
    
    print("=" * 80)
    print(f"📊 OVERALL RESULTS:")
    print(f"   Total tests: {len(test_cases)}")
    print(f"   Correct predictions: {correct_predictions}")
    print(f"   Accuracy: {accuracy:.1f}%")
    
    # Analyze errors
    errors = [r for r in results if not r['correct']]
    if errors:
        print(f"\n❌ ERROR ANALYSIS ({len(errors)} errors):")
        for error in errors:
            print(f"   • {error['description']}")
            print(f"     Text: '{error['text'][:60]}...'")
            print(f"     Expected: {'Ann' if error['expected'] else 'Conv'}, Got: {'Ann' if error['detected'] else 'Conv'}, Score: {error['score']:.1f}")
    
    # Performance by category
    categories = {}
    for result in results:
        desc = result['description']
        category = desc.split()[0] if desc else 'Other'
        if category not in categories:
            categories[category] = {'total': 0, 'correct': 0}
        categories[category]['total'] += 1
        if result['correct']:
            categories[category]['correct'] += 1
    
    print(f"\n📈 PERFORMANCE BY CATEGORY:")
    for category, stats in sorted(categories.items()):
        cat_accuracy = (stats['correct'] / stats['total']) * 100
        print(f"   {category:<20}: {stats['correct']:2d}/{stats['total']:2d} ({cat_accuracy:5.1f}%)")
    
    return accuracy, results

if __name__ == "__main__":
    try:
        accuracy, results = run_comprehensive_test()
        
        if accuracy >= 95:
            print("\n🎉 EXCELLENT! Detection accuracy is very high.")
        elif accuracy >= 90:
            print("\n👍 GOOD! Detection accuracy is solid.")
        elif accuracy >= 85:
            print("\n⚠️  FAIR. Detection accuracy could be improved.")
        else:
            print("\n🔧 NEEDS WORK. Detection accuracy needs significant improvement.")
            
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user.")
    except Exception as e:
        print(f"\nError during testing: {e}")
        import traceback
        traceback.print_exc()