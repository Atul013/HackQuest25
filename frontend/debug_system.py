#!/usr/bin/env python3
"""
Debug script to test the transcription system step by step
"""
import whisper
import pyaudio
import wave
import tempfile
import os
import time
import numpy as np
from supabase import create_client
from dotenv import load_dotenv

def test_microphone():
    """Test if microphone is working"""
    print("🎤 Testing microphone...")
    audio = pyaudio.PyAudio()
    
    try:
        # Test audio device
        stream = audio.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=16000,
            input=True,
            frames_per_buffer=2048
        )
        
        print("   Recording 3 seconds of audio...")
        frames = []
        for i in range(0, int(16000 / 2048 * 3)):
            data = stream.read(2048)
            frames.append(data)
        
        stream.stop_stream()
        stream.close()
        
        # Check if we got audio data
        audio_data = b''.join(frames)
        if len(audio_data) > 0:
            print("✅ Microphone working - audio data captured")
            return True
        else:
            print("❌ No audio data captured")
            return False
            
    except Exception as e:
        print(f"❌ Microphone test failed: {e}")
        return False
    finally:
        audio.terminate()

def test_whisper():
    """Test if Whisper is working"""
    print("🗣️ Testing Whisper...")
    try:
        model = whisper.load_model("base")
        print("✅ Whisper model loaded successfully")
        return model
    except Exception as e:
        print(f"❌ Whisper test failed: {e}")
        return None

def test_database():
    """Test if database connection works"""
    print("💾 Testing database...")
    try:
        load_dotenv()
        client = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_ANON_KEY'))
        
        # Try to insert a test record
        test_data = {
            'transcription_text': 'TEST: This is a debug test announcement',
            'device_id': 'debug_test',
            'audio_duration': 3.0,
            'is_announcement': True,
            'announcement_type': 'test'
        }
        
        result = client.table('transcriptions').insert(test_data).execute()
        print("✅ Database connection working - test record inserted")
        
        # Check if record was actually saved
        check_result = client.table('transcriptions').select('*').order('created_at', desc=True).limit(1).execute()
        if check_result.data and len(check_result.data) > 0:
            latest_record = check_result.data[0]
            print(f"   Latest record: {latest_record.get('transcription_text')}")
            return True
        else:
            print("❌ Record not found after insertion")
            return False
            
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False

def record_and_transcribe_test():
    """Record audio and test transcription"""
    print("🔄 Testing full pipeline...")
    
    # Test microphone
    if not test_microphone():
        return False
    
    # Test Whisper
    model = test_whisper()
    if not model:
        return False
    
    # Test database
    if not test_database():
        return False
    
    print("\n🎙️ Recording 5 seconds of audio for transcription test...")
    print("   Please speak clearly: 'Attention everyone, this is a test announcement'")
    
    audio = pyaudio.PyAudio()
    
    try:
        # Record audio
        stream = audio.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=16000,
            input=True,
            frames_per_buffer=2048
        )
        
        frames = []
        for i in range(0, int(16000 / 2048 * 5)):  # 5 seconds
            data = stream.read(2048)
            frames.append(data)
        
        stream.stop_stream()
        stream.close()
        
        # Save to temp file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
        wf = wave.open(temp_file.name, 'wb')
        wf.setnchannels(1)
        wf.setsampwidth(audio.get_sample_size(pyaudio.paInt16))
        wf.setframerate(16000)
        wf.writeframes(b''.join(frames))
        wf.close()
        
        print("   Audio recorded, transcribing...")
        
        # Transcribe
        result = model.transcribe(temp_file.name)
        transcription = result['text'].strip()
        
        print(f"   Transcription: '{transcription}'")
        
        if transcription:
            print("✅ Full pipeline working!")
            
            # Test saving to database
            load_dotenv()
            client = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_ANON_KEY'))
            
            live_data = {
                'transcription_text': transcription,
                'device_id': 'live_test_device',
                'audio_duration': 5.0,
                'is_announcement': True,
                'announcement_type': 'test'
            }
            
            result = client.table('transcriptions').insert(live_data).execute()
            print("✅ Live transcription saved to database!")
            
            return True
        else:
            print("❌ Empty transcription")
            return False
            
    except Exception as e:
        print(f"❌ Full pipeline test failed: {e}")
        return False
    finally:
        audio.terminate()
        try:
            os.unlink(temp_file.name)
        except:
            pass

if __name__ == "__main__":
    print("🔍 DEBUGGING LIVE AUDIO TRANSCRIPTION SYSTEM")
    print("=" * 60)
    
    success = record_and_transcribe_test()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 ALL TESTS PASSED! System should be working.")
        print("   Check your Supabase Table Editor for the test records.")
    else:
        print("❌ TESTS FAILED! There's an issue with the system.")
    print("=" * 60)