-- Create transcriptions table for live announcement detection
-- Run this in your Supabase SQL editor (FIXED VERSION)

CREATE TABLE IF NOT EXISTS transcriptions (
    id BIGSERIAL PRIMARY KEY,
    transcription_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    device_id VARCHAR(255) DEFAULT 'live_audio_device',
    audio_duration DECIMAL(5,2) DEFAULT 5.0,
    is_announcement BOOLEAN DEFAULT true,
    announcement_type VARCHAR(50) DEFAULT 'general',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at ON transcriptions(created_at);
CREATE INDEX IF NOT EXISTS idx_transcriptions_device_id ON transcriptions(device_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_is_announcement ON transcriptions(is_announcement);
CREATE INDEX IF NOT EXISTS idx_transcriptions_announcement_type ON transcriptions(announcement_type);

-- Enable Row Level Security (RLS) if needed
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "Allow all operations on transcriptions" ON transcriptions;
CREATE POLICY "Allow all operations on transcriptions" ON transcriptions
    FOR ALL USING (true);

-- Function to automatically delete old transcriptions (alternative cleanup method)
CREATE OR REPLACE FUNCTION cleanup_old_transcriptions()
RETURNS void AS $$
BEGIN
    DELETE FROM transcriptions 
    WHERE created_at < NOW() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS update_transcriptions_updated_at ON transcriptions;
CREATE TRIGGER update_transcriptions_updated_at 
    BEFORE UPDATE ON transcriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Schedule automatic cleanup every minute (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-transcriptions', '* * * * *', 'SELECT cleanup_old_transcriptions();');

COMMENT ON TABLE transcriptions IS 'Stores real-time audio transcriptions with automatic cleanup after 10 minutes';
COMMENT ON COLUMN transcriptions.transcription_text IS 'The transcribed text from audio';
COMMENT ON COLUMN transcriptions.created_at IS 'Timestamp when the transcription was created';
COMMENT ON COLUMN transcriptions.device_id IS 'Identifier for the device/source of audio';
COMMENT ON COLUMN transcriptions.audio_duration IS 'Duration of the audio chunk in seconds';