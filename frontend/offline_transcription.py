#!/usr/bin/env python3
"""
Offline Audio Transcription System
Processes audio files the same way as the live system
"""
import whisper
import os
import re
import numpy as np
from datetime import datetime
from supabase import create_client, Client
import logging
from typing import Optional
from dotenv import load_dotenv
import wave
import tempfile

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('offline_transcription.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class OfflineAudioTranscriber:
    def __init__(self):
        # Load environment variables
        load_dotenv()
        
        # Supabase configuration
        self.supabase_url = os.getenv('SUPABASE_URL', 'your_supabase_url_here')
        self.supabase_key = os.getenv('SUPABASE_ANON_KEY', 'your_supabase_anon_key_here')
        
        try:
            self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            raise
        
        # Configuration options (same as live system)
        self.test_mode = True  # Accept all transcriptions for development
        self.cleanup_after_minutes = 10
        
        # Load Whisper model
        logger.info("Loading Whisper model...")
        self.model = whisper.load_model("base")
        logger.info("Whisper model loaded successfully")
        
        # Announcement patterns (same as live system)
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
        """Same announcement detection logic as live system"""
        
        # TEST MODE - Accept all non-empty transcriptions for testing
        if hasattr(self, 'test_mode') and self.test_mode:
            if text and len(text.strip()) > 0:
                logger.info(f"TEST MODE: Accepting all transcriptions - '{text}'")
                return True
        
        text_lower = text.lower()
        
        # Immediate conversation indicators (very strong signals)
        immediate_conversation = [
            r'\b(i think|i feel|i believe|maybe|perhaps)\b',
            r'\b(can you|could you|would you|will you|do you)\b',
            r'\b(i like|i love|i hate|i prefer|i want|i need)\b',
            r'\b(let\'s|we should|should we|why don\'t we)\b',
            r'\b(i heard|someone said|i wonder)\b',
        ]
        
        # Check for immediate conversation indicators first
        for pattern in immediate_conversation:
            if re.search(pattern, text_lower):
                logger.info(f"Immediate conversation detected: {pattern}")
                return False
        
        # Strong announcement indicators
        strong_announcement = [
            r'\b(attention|ladies and gentlemen|code (red|blue|green))\b',
            r'\b(all (passengers|students|staff|visitors|everyone))\b',
            r'\b(please note|for your information)\b',
            r'\b(final call|now boarding|last call)\b',
            r'\b(emergency|evacuation|drill)\b'
        ]
        
        strong_announcement_score = 0
        for pattern in strong_announcement:
            if re.search(pattern, text_lower):
                strong_announcement_score += 1
                logger.info(f"Strong announcement indicator: {pattern}")
        
        if strong_announcement_score > 0:
            logger.info("Strong announcement detected")
            return True
        
        # Check for regular announcement patterns
        announcement_score = 0
        matched_patterns = []
        for pattern in self.announcement_patterns:
            if re.search(pattern, text_lower):
                announcement_score += 1
                matched_patterns.append(pattern)
        
        # Length requirements - relaxed for testing
        words = text.split()
        word_count = len(words)
        
        if word_count < 3:  # Minimum 3 words
            logger.info(f"Too short for announcement: {word_count} words")
            return False
        
        # Decision logic (relaxed thresholds)
        if len(matched_patterns) >= 1:  # If any announcement pattern matches
            logger.info(f"Announcement detected: pattern match {matched_patterns}")
            return True
        else:
            logger.info(f"Conversation detected: patterns {len(matched_patterns)}")
            return False

    def classify_announcement(self, text: str) -> str:
        """Classify the type of announcement (same as live system)"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['boarding', 'gate', 'departure', 'arrival', 'flight']):
            return 'travel'
        elif any(word in text_lower for word in ['meeting', 'session', 'conference', 'break']):
            return 'meeting'
        elif any(word in text_lower for word in ['emergency', 'evacuation', 'safety', 'alert']):
            return 'emergency'
        else:
            return 'general'

    def save_announcement_to_supabase(self, text: str, timestamp: datetime, duration: float, source_file: str) -> bool:
        """Save announcement transcription to Supabase (same as live system but with source file)"""
        max_retries = 3
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                data = {
                    'transcription_text': text,
                    'created_at': timestamp.isoformat(),
                    'device_id': f'offline_file_{os.path.basename(source_file)}',
                    'audio_duration': duration,
                    'is_announcement': True,
                    'announcement_type': self.classify_announcement(text)
                }
                
                result = self.supabase.table('transcriptions').insert(data).execute()
                logger.info(f"SUCCESS: Announcement saved to database (attempt {attempt + 1}): {text[:80]}...")
                return True
                
            except Exception as e:
                logger.warning(f"FAILED: Attempt {attempt + 1} failed to save to Supabase: {e}")
                if attempt < max_retries - 1:
                    logger.info(f"Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    retry_delay *= 2
                else:
                    logger.error(f"Failed to save announcement after {max_retries} attempts")
                    return False
        
        return False

    def get_audio_duration(self, audio_file: str) -> float:
        """Get duration of audio file"""
        try:
            with wave.open(audio_file, 'rb') as wf:
                frames = wf.getnframes()
                rate = wf.getframerate()
                duration = frames / float(rate)
                return duration
        except Exception as e:
            logger.warning(f"Could not get audio duration: {e}")
            return 0.0

    def transcribe_audio_file(self, audio_file_path: str) -> Optional[str]:
        """
        Process an audio file the same way as the live system
        
        Args:
            audio_file_path: Path to the audio file to transcribe
            
        Returns:
            Transcription text if successful, None otherwise
        """
        
        if not os.path.exists(audio_file_path):
            logger.error(f"Audio file not found: {audio_file_path}")
            return None
        
        logger.info(f"Processing audio file: {audio_file_path}")
        
        try:
            # Get audio duration
            duration = self.get_audio_duration(audio_file_path)
            logger.info(f"Audio duration: {duration:.1f} seconds")
            
            # Transcribe using Whisper (same as live system)
            logger.info("Transcribing audio with Whisper...")
            result = self.model.transcribe(audio_file_path)
            transcription = result['text'].strip()
            
            if not transcription:
                logger.info("Empty transcription, skipping...")
                return None
                
            logger.info(f"Transcription: '{transcription}'")
            
            # Check if this is an announcement (same logic as live system)
            logger.info("Checking if this is an announcement...")
            if self.is_announcement(transcription):
                logger.info("ANNOUNCEMENT DETECTED! Saving to database...")
                
                # Save to database with timestamp
                timestamp = datetime.now()
                success = self.save_announcement_to_supabase(
                    transcription, timestamp, duration, audio_file_path
                )
                
                if success:
                    logger.info(f"✅ ANNOUNCEMENT PROCESSED AND SAVED: {transcription}")
                    print(f"\n🔊 ANNOUNCEMENT DETECTED: {transcription}")
                    print(f"📁 Source: {os.path.basename(audio_file_path)}")
                    print(f"⏱️ Duration: {duration:.1f}s")
                    print(f"🏷️ Type: {self.classify_announcement(transcription)}")
                    print(f"💾 Saved to database successfully!\n")
                    return transcription
                else:
                    logger.warning("Failed to save announcement to database")
                    return transcription
            else:
                logger.info(f"Not an announcement - ignoring: {transcription[:50]}...")
                print(f"\n💬 CONVERSATION DETECTED (ignored): {transcription}")
                print(f"📁 Source: {os.path.basename(audio_file_path)}\n")
                return transcription
                
        except Exception as e:
            logger.error(f"Error processing audio file: {e}")
            return None

def main():
    """Main function for offline audio processing"""
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python offline_transcription.py <audio_file_path>")
        print("Example: python offline_transcription.py recording.wav")
        return
    
    audio_file = sys.argv[1]
    
    print("🎧 OFFLINE AUDIO TRANSCRIPTION SYSTEM")
    print("=" * 50)
    print(f"Processing: {audio_file}")
    print("=" * 50)
    
    try:
        transcriber = OfflineAudioTranscriber()
        result = transcriber.transcribe_audio_file(audio_file)
        
        if result:
            print("✅ Processing completed successfully!")
        else:
            print("❌ Processing failed or no transcription generated.")
            
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        print(f"❌ Fatal error: {e}")

if __name__ == "__main__":
    main()