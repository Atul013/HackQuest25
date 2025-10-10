import whisper
import pyaudio
import wave
import threading
import time
import os
import re
import numpy as np
# import webrtcvad  # Temporarily disabled due to Python 3.13 compatibility
from datetime import datetime, timedelta
from supabase import create_client, Client
import tempfile
import logging
from typing import Optional, List
from collections import deque
import struct

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('audio_transcription.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class LiveAudioTranscriber:
    def __init__(self):
        # Load environment variables
        from dotenv import load_dotenv
        load_dotenv()
        
        # Supabase configuration
        self.supabase_url = os.getenv('SUPABASE_URL', 'your_supabase_url_here')
        self.supabase_key = os.getenv('SUPABASE_ANON_KEY', 'your_supabase_anon_key_here')
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        
        # Audio configuration
        self.chunk = 1024  # Record in chunks of 1024 samples
        self.format = pyaudio.paInt16  # 16 bits per sample
        self.channels = 1  # Mono audio
        self.rate = 16000  # Sample rate (16kHz is good for Whisper)
        
        # Voice Activity Detection settings (simplified approach)
        # self.vad = webrtcvad.Vad(2)  # Temporarily disabled due to Python 3.13 compatibility
        self.frame_duration = 30  # VAD frame duration in ms (10, 20, or 30)
        self.silence_threshold = 3.0  # 3 seconds of silence to end recording
        self.min_speech_duration = 2.0  # Minimum 2 seconds of speech to process
        self.max_recording_duration = 30.0  # Maximum 30 seconds per recording
        self.volume_threshold = 500  # Simple volume-based voice activity detection
        
        # Audio buffer for VAD
        self.audio_buffer = deque()
        self.is_speaking = False
        self.silence_start = None
        self.speech_start = None
        
        # Initialize Whisper model
        logger.info("Loading Whisper model...")
        self.model = whisper.load_model("base")
        logger.info("Whisper model loaded successfully")
        
        # Audio interface
        self.audio = pyaudio.PyAudio()
        
        # Control flags
        self.is_running = False
        self.cleanup_thread = None
        
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
        """Final optimized announcement detection with highest accuracy"""
        text_lower = text.lower()
        
        # Immediate conversation indicators (very strong signals)
        immediate_conversation = [
            r'\b(i think|i feel|i believe|maybe|perhaps)\b',
            r'\b(can you|could you|would you|will you|do you)\b',
            r'\b(i like|i love|i hate|i prefer|i want|i need)\b',
            r'\b(let\'s|we should|should we|why don\'t we)\b',
            r'\b(i heard|someone said|i wonder)\b',
            r'\b(my |our |your )(flight|train|meeting|appointment)\b',
            r'\b(really (nice|good|bad|great|loud))\b',
            r'\bisn\'t it\b',
            r'\bright\?\b',
            r'\bwhat do you think\b',
            r'\bif you need me\b',
            r'\bwent (well|badly|great)\b'
        ]
        
        # Check for immediate conversation indicators first
        for pattern in immediate_conversation:
            if re.search(pattern, text_lower):
                logger.info(f"Immediate conversation detected: {pattern}")
                return False
        
        # Strong announcement indicators (override most other logic)
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
        
        # Length requirements for announcements
        words = text.split()
        word_count = len(words)
        
        if word_count < 6:  # Increased minimum length for better precision
            logger.info(f"Too short for announcement: {word_count} words")
            return False
        
        # Formal/public language indicators
        formal_indicators = [
            'please', 'kindly', 'we would like to', 'we are pleased to',
            'due to', 'as a result of', 'effective immediately',
            'will be', 'has been', 'have been', 'is now', 'are now'
        ]
        formal_count = sum(1 for indicator in formal_indicators if indicator in text_lower)
        
        # Public service language
        public_service = [
            'passengers', 'students', 'staff', 'visitors', 'customers',
            'will be closed', 'will be open', 'is currently', 'are currently',
            'please complete', 'please proceed', 'please stand',
            'must sign in', 'must have', 'required to'
        ]
        public_count = sum(1 for indicator in public_service if indicator in text_lower)
        
        # Time/location indicators for announcements
        time_indicators = ['minutes', 'hours', 'pm', 'am', 'today', 'tomorrow', 'now', 'currently']
        time_count = sum(1 for indicator in time_indicators if indicator in text_lower)
        
        location_indicators = ['gate', 'platform', 'room', 'floor', 'hall', 'building', 'area']
        location_count = sum(1 for indicator in location_indicators if indicator in text_lower)
        
        # Sentence structure analysis
        structure_score = 0
        
        # Announcements often start formally
        first_words = text_lower.split()[:2]
        if first_words:
            if first_words[0] in ['attention', 'please', 'all', 'the', 'passengers', 'students']:
                structure_score += 2
            elif first_words[0] in ['due', 'we', 'this']:
                structure_score += 1
        
        # Passive voice and formal constructions
        if any(phrase in text_lower for phrase in ['will be', 'has been', 'have been', 'is being', 'are being']):
            structure_score += 1
        
        # Calculate comprehensive score
        total_score = (
            announcement_score * 2 +
            formal_count * 1.5 +
            public_count * 2 +
            time_count * 0.8 +
            location_count * 1.0 +
            structure_score
        )
        
        # Decision thresholds with detailed logging
        if announcement_score >= 1 and total_score >= 4:
            logger.info(f"Announcement detected: pattern match + score {total_score}")
            return True
        elif formal_count >= 2 and public_count >= 1:
            logger.info(f"Announcement detected: formal language + public service")
            return True
        elif total_score >= 6:
            logger.info(f"Announcement detected: high total score {total_score}")
            return True
        else:
            logger.info(f"Conversation detected: score {total_score}, patterns {len(matched_patterns)}")
            return False
    
    # def convert_to_vad_format(self, audio_data: bytes) -> bytes:
    #     """Convert audio data to format suitable for VAD (16-bit PCM, specific sample rates)"""
    #     # WebRTC VAD requires specific sample rates: 8000, 16000, 32000, or 48000 Hz
    #     # Our rate is 16000 Hz which is supported
    #     
    #     # Convert bytes to numpy array
    #     audio_np = np.frombuffer(audio_data, dtype=np.int16)
    #     
    #     # Ensure the audio is in the right format
    #     frame_length = int(self.rate * self.frame_duration / 1000)  # Frame length in samples
    #     
    #     # Pad or trim to exact frame length if necessary
    #     if len(audio_np) != frame_length:
    #         if len(audio_np) < frame_length:
    #             audio_np = np.pad(audio_np, (0, frame_length - len(audio_np)))
    #         else:
    #             audio_np = audio_np[:frame_length]
    #     
    #     return audio_np.tobytes()
    
    def is_speech(self, audio_data: bytes) -> bool:
        """Use simple volume-based voice activity detection"""
        try:
            # Convert bytes to numpy array
            audio_np = np.frombuffer(audio_data, dtype=np.int16)
            
            # Calculate RMS (Root Mean Square) for volume level
            rms = np.sqrt(np.mean(audio_np.astype(np.float32) ** 2))
            
            # Return True if volume is above threshold
            return rms > self.volume_threshold
        except Exception as e:
            logger.warning(f"Volume-based VAD error, assuming speech: {e}")
            return True  # Default to assuming speech if VAD fails
        
    def setup_database_table(self):
        """Create the transcriptions table if it doesn't exist"""
        try:
            # This would be better handled through Supabase dashboard or migration
            # For now, we'll assume the table exists
            logger.info("Database table setup - assuming 'transcriptions' table exists")
            return True
        except Exception as e:
            logger.error(f"Database setup error: {e}")
            return False
    
    def save_announcement_to_supabase(self, text: str, timestamp: datetime, duration: float) -> bool:
        """Save announcement transcription with timestamp to Supabase"""
        try:
            announcement_type = self.classify_announcement(text)
            
            data = {
                'transcription_text': text,
                'created_at': timestamp.isoformat(),
                'device_id': 'live_audio_device',
                'audio_duration': duration,
                'is_announcement': True,
                'announcement_type': announcement_type
            }
            
            result = self.supabase.table('transcriptions').insert(data).execute()
            logger.info(f"Announcement saved to database: {text[:80]}...")
            
            # 🔥 NEW: Trigger haptic alerts via backend API
            self.trigger_haptic_alert(text, announcement_type)
            
            return True
            
        except Exception as e:
            logger.error(f"Error saving announcement to Supabase: {e}")
            return False
    
    def trigger_haptic_alert(self, text: str, announcement_type: str):
        """Send alert to backend API to trigger haptic alerts for subscribed users"""
        try:
            import requests
            
            # Determine severity based on announcement type
            if announcement_type == 'emergency':
                severity = 'critical'
                morse_code = 'SOS'
            elif announcement_type == 'travel' or any(word in text.lower() for word in ['urgent', 'immediate', 'attention']):
                severity = 'high'
                morse_code = 'HELP'
            else:
                severity = 'medium'
                morse_code = 'HELP'
            
            # Backend API endpoint
            backend_url = os.getenv('BACKEND_URL', 'http://localhost:3000')
            endpoint = f'{backend_url}/api/haptic-alerts/trigger'
            
            payload = {
                'venueId': '1',  # TODO: Get from user's current location/geofence
                'severity': severity,
                'message': text[:200],  # Limit message length
                'morseCode': morse_code
            }
            
            logger.info(f"🚨 Triggering {severity} alert: {morse_code}")
            
            # Send to backend (with timeout to not block ML processing)
            response = requests.post(endpoint, json=payload, timeout=3)
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ Alert triggered successfully: {result}")
            else:
                logger.warning(f"⚠️ Alert trigger failed: {response.status_code} - {response.text}")
                
        except requests.exceptions.Timeout:
            logger.warning("⚠️ Backend timeout - alert not sent (backend may not be running)")
        except requests.exceptions.ConnectionError:
            logger.warning("⚠️ Cannot connect to backend - alert not sent (is backend running?)")
        except Exception as e:
            logger.error(f"❌ Error triggering alert: {e}")
    
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
    
    def delete_old_transcriptions(self):
        """Delete transcriptions older than 10 minutes"""
        try:
            cutoff_time = (datetime.now() - timedelta(minutes=10)).isoformat()
            
            result = self.supabase.table('transcriptions')\
                .delete()\
                .lt('created_at', cutoff_time)\
                .execute()
            
            deleted_count = len(result.data) if result.data else 0
            if deleted_count > 0:
                logger.info(f"Deleted {deleted_count} old transcriptions")
            
        except Exception as e:
            logger.error(f"Error deleting old transcriptions: {e}")
    
    def cleanup_worker(self):
        """Background worker to clean up old transcriptions every minute"""
        while self.is_running:
            try:
                self.delete_old_transcriptions()
                time.sleep(60)  # Check every minute
            except Exception as e:
                logger.error(f"Cleanup worker error: {e}")
                time.sleep(60)
    
    def record_dynamic_audio_chunk(self) -> Optional[str]:
        """Record audio dynamically until silence gap of 3+ seconds is detected"""
        try:
            # Create temporary file for audio
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
            temp_filename = temp_file.name
            temp_file.close()
            
            # Start recording
            stream = self.audio.open(
                format=self.format,
                channels=self.channels,
                rate=self.rate,
                input=True,
                frames_per_buffer=self.chunk
            )
            
            logger.info("Listening for speech...")
            
            frames = []
            speech_detected = False
            silence_duration = 0.0
            speech_duration = 0.0
            recording_start = time.time()
            
            # Frame duration for VAD processing
            frame_duration_samples = int(self.rate * self.frame_duration / 1000)
            
            while self.is_running:
                # Read audio data
                data = stream.read(self.chunk, exception_on_overflow=False)
                
                # Check recording duration limits
                current_time = time.time()
                total_duration = current_time - recording_start
                
                if total_duration > self.max_recording_duration:
                    logger.info(f"Maximum recording duration ({self.max_recording_duration}s) reached")
                    break
                
                # Accumulate audio for VAD processing
                self.audio_buffer.extend(struct.unpack(f'{len(data)//2}h', data))
                
                # Process VAD when we have enough samples
                if len(self.audio_buffer) >= frame_duration_samples:
                    # Extract frame for VAD
                    vad_frame_data = list(self.audio_buffer)[:frame_duration_samples]
                    vad_frame_bytes = struct.pack(f'{len(vad_frame_data)}h', *vad_frame_data)
                    
                    # Remove processed samples from buffer
                    for _ in range(frame_duration_samples):
                        if self.audio_buffer:
                            self.audio_buffer.popleft()
                    
                    # Check if this frame contains speech
                    has_speech = self.is_speech(vad_frame_bytes)
                    
                    if has_speech:
                        if not speech_detected:
                            logger.info("Speech detected, starting recording...")
                            speech_detected = True
                            self.speech_start = current_time
                        
                        silence_duration = 0.0  # Reset silence counter
                        speech_duration = current_time - (self.speech_start or current_time)
                        
                        # Add this frame to recording
                        frames.append(data)
                        
                    else:
                        # No speech in this frame
                        if speech_detected:
                            silence_duration += self.frame_duration / 1000.0  # Convert ms to seconds
                            
                            # Still add to recording during short silences (to capture pauses in speech)
                            if silence_duration < self.silence_threshold:
                                frames.append(data)
                            else:
                                # Long silence detected, end recording
                                logger.info(f"Silence detected for {silence_duration:.1f}s, ending recording")
                                break
                        # If no speech detected yet, don't add to frames
                else:
                    # Not enough data for VAD yet, just continue accumulating
                    if speech_detected:
                        frames.append(data)
            
            stream.stop_stream()
            stream.close()
            
            # Check if we have enough speech to process
            if speech_duration < self.min_speech_duration:
                logger.info(f"Speech too short ({speech_duration:.1f}s), skipping...")
                os.unlink(temp_filename)
                return None
            
            if not frames:
                logger.info("No speech frames recorded")
                os.unlink(temp_filename)
                return None
            
            # Save audio to file
            wf = wave.open(temp_filename, 'wb')
            wf.setnchannels(self.channels)
            wf.setsampwidth(self.audio.get_sample_size(self.format))
            wf.setframerate(self.rate)
            wf.writeframes(b''.join(frames))
            wf.close()
            
            logger.info(f"Recorded {speech_duration:.1f}s of speech")
            return temp_filename
            
        except Exception as e:
            logger.error(f"Error recording audio: {e}")
            return None
    
    def transcribe_audio(self, audio_file: str) -> Optional[str]:
        """Transcribe audio file using Whisper"""
        try:
            logger.info("Transcribing audio...")
            result = self.model.transcribe(audio_file)
            transcription = result['text'].strip()
            
            # Only return non-empty transcriptions
            if transcription:
                logger.info(f"Transcription: {transcription}")
                return transcription
            else:
                logger.info("Empty transcription, skipping...")
                return None
                
        except Exception as e:
            logger.error(f"Error transcribing audio: {e}")
            return None
        finally:
            # Clean up temporary file
            try:
                if os.path.exists(audio_file):
                    os.unlink(audio_file)
            except Exception as cleanup_error:
                logger.warning(f"Failed to cleanup temp file: {cleanup_error}")
    
    def start_transcription(self):
        """Start the continuous announcement detection and transcription process"""
        logger.info("Starting live announcement detection...")
        
        # Setup database
        if not self.setup_database_table():
            logger.error("Failed to setup database, exiting...")
            return
        
        self.is_running = True
        
        # Start cleanup worker thread
        self.cleanup_thread = threading.Thread(target=self.cleanup_worker, daemon=True)
        self.cleanup_thread.start()
        
        try:
            while self.is_running:
                # Record audio dynamically until silence gap
                audio_file = self.record_dynamic_audio_chunk()
                if not audio_file:
                    continue
                
                # Transcribe audio
                transcription = self.transcribe_audio(audio_file)
                if not transcription:
                    continue
                
                # Check if this is an announcement
                if self.is_announcement(transcription):
                    # Save announcement to database with timestamp
                    timestamp = datetime.now()
                    
                    # Calculate approximate duration (rough estimate)
                    duration = len(transcription.split()) * 0.6  # Rough estimate: 0.6 seconds per word
                    
                    success = self.save_announcement_to_supabase(transcription, timestamp, duration)
                    
                    if success:
                        logger.info(f"✅ ANNOUNCEMENT DETECTED AND SAVED: {transcription}")
                        print(f"\n🔊 ANNOUNCEMENT: {transcription}\n")
                    else:
                        logger.warning("Failed to save announcement to database")
                else:
                    logger.info(f"Regular conversation ignored: {transcription[:50]}...")
                
                # Small delay before next recording cycle
                time.sleep(0.5)
                
        except KeyboardInterrupt:
            logger.info("Received interrupt signal, stopping...")
        except Exception as e:
            logger.error(f"Unexpected error in main loop: {e}")
        finally:
            self.stop_transcription()
    
    def stop_transcription(self):
        """Stop the transcription process"""
        logger.info("Stopping transcription...")
        self.is_running = False
        
        # Wait for cleanup thread to finish
        if self.cleanup_thread and self.cleanup_thread.is_alive():
            self.cleanup_thread.join(timeout=5)
        
        # Close audio interface
        self.audio.terminate()
        logger.info("Transcription stopped")

def main():
    """Main function to run the live audio transcriber"""
    transcriber = LiveAudioTranscriber()
    
    try:
        transcriber.start_transcription()
    except Exception as e:
        logger.error(f"Fatal error: {e}")
    finally:
        transcriber.stop_transcription()

if __name__ == "__main__":
    main()