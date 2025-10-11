    -- ========================================
    -- TEST DATA FOR TRANSCRIPT HISTORY FEATURE
    -- ========================================
    -- Run this AFTER adding venue_id column to transcriptions table
    -- This will insert 5-10 test transcripts for EACH venue

    -- ========================================
    -- COCHIN INTERNATIONAL AIRPORT
    -- 7 transcripts
    -- ========================================
    INSERT INTO transcriptions (transcription_text, venue_id, device_id, is_announcement, announcement_type, created_at)
    VALUES 
        ('Flight announcement: Air India flight AI123 to Mumbai is now boarding at Gate 5.', '08e988d8-6a75-422a-bfe0-0539231c87fb', 'live_audio_device', true, 'transport', NOW() - INTERVAL '2 minutes'),
        ('Security alert: Please do not leave your baggage unattended. Unattended baggage will be removed.', '08e988d8-6a75-422a-bfe0-0539231c87fb', 'live_audio_device', true, 'security', NOW() - INTERVAL '8 minutes'),
        ('Flight update: IndiGo flight 6E456 to Delhi has been delayed by 45 minutes due to weather conditions.', '08e988d8-6a75-422a-bfe0-0539231c87fb', 'live_audio_device', true, 'transport', NOW() - INTERVAL '12 minutes'),
        ('Passenger announcement: Mr. Rajesh Kumar, please proceed to Gate 12 immediately. Last call for boarding.', '08e988d8-6a75-422a-bfe0-0539231c87fb', 'live_audio_device', true, 'general', NOW() - INTERVAL '18 minutes'),
        ('Emergency announcement: Fire alarm test will be conducted in Terminal 1. Please do not panic.', '08e988d8-6a75-422a-bfe0-0539231c87fb', 'live_audio_device', true, 'emergency', NOW() - INTERVAL '25 minutes'),
        ('Notice: Free WiFi is available throughout the airport. Connect to CIAL-WiFi network.', '08e988d8-6a75-422a-bfe0-0539231c87fb', 'live_audio_device', true, 'general', NOW() - INTERVAL '35 minutes'),
        ('Flight announcement: Spicejet flight SG789 to Bangalore is now ready for boarding at Gate 8.', '08e988d8-6a75-422a-bfe0-0539231c87fb', 'live_audio_device', true, 'transport', NOW() - INTERVAL '42 minutes');

    -- ========================================
    -- ERNAKULAM JUNCTION RAILWAY STATION
    -- 8 transcripts
    -- ========================================
    INSERT INTO transcriptions (transcription_text, venue_id, device_id, is_announcement, announcement_type, created_at)
    VALUES 
        ('Platform announcement: Train number 12617 Mangala Express from Chennai to Mangalore will arrive on Platform 3.', '2bad79f3-32aa-499f-8de4-2fe07f1a334a', 'live_audio_device', true, 'transport', NOW() - INTERVAL '1 minute'),
        ('Attention passengers: Train number 16349 Rajya Rani Express has been rescheduled. New departure time is 14:30.', '2bad79f3-32aa-499f-8de4-2fe07f1a334a', 'live_audio_device', true, 'transport', NOW() - INTERVAL '5 minutes'),
        ('Lost and found announcement: A black backpack has been found on Platform 2. Please collect from Station Master office.', '2bad79f3-32aa-499f-8de4-2fe07f1a334a', 'live_audio_device', true, 'general', NOW() - INTERVAL '10 minutes'),
        ('Platform change: Train number 12625 Kerala Express will now depart from Platform 5 instead of Platform 7.', '2bad79f3-32aa-499f-8de4-2fe07f1a334a', 'live_audio_device', true, 'transport', NOW() - INTERVAL '15 minutes'),
        ('Security alert: Please report any suspicious activity or unattended luggage to railway police immediately.', '2bad79f3-32aa-499f-8de4-2fe07f1a334a', 'live_audio_device', true, 'security', NOW() - INTERVAL '22 minutes'),
        ('Train arrival: Trivandrum Mail arriving on Platform 1 in 5 minutes. Please stand behind the yellow line.', '2bad79f3-32aa-499f-8de4-2fe07f1a334a', 'live_audio_device', true, 'transport', NOW() - INTERVAL '28 minutes'),
        ('Maintenance notice: Platform 6 is temporarily closed for maintenance work. Expected reopening at 16:00 hours.', '2bad79f3-32aa-499f-8de4-2fe07f1a334a', 'live_audio_device', true, 'maintenance', NOW() - INTERVAL '35 minutes'),
        ('Emergency drill: Fire safety drill will be conducted today at 15:00. This is only a drill, please cooperate.', '2bad79f3-32aa-499f-8de4-2fe07f1a334a', 'live_audio_device', true, 'emergency', NOW() - INTERVAL '50 minutes');

    -- ========================================
    -- LULU MALL KOCHI
    -- 6 transcripts
    -- ========================================
    INSERT INTO transcriptions (transcription_text, venue_id, device_id, is_announcement, announcement_type, created_at)
    VALUES 
        ('Special offer: Flat 50% discount on all electronics at Digital World store, Ground Floor. Offer valid till 8 PM today.', '5d03ecd0-e24b-45c8-aa8e-ecf2a6c5a4c6', 'live_audio_device', true, 'general', NOW() - INTERVAL '3 minutes'),
        ('Lost child announcement: A 4-year-old girl wearing a pink dress is with mall security. Parents please come to Customer Care desk.', '5d03ecd0-e24b-45c8-aa8e-ecf2a6c5a4c6', 'live_audio_device', true, 'general', NOW() - INTERVAL '12 minutes'),
        ('Parking announcement: Red zone parking is almost full. Please use Blue zone or Green zone for parking.', '5d03ecd0-e24b-45c8-aa8e-ecf2a6c5a4c6', 'live_audio_device', true, 'general', NOW() - INTERVAL '20 minutes'),
        ('Food court announcement: New restaurant "Spice Garden" is now open on the 3rd floor with special inaugural discounts.', '5d03ecd0-e24b-45c8-aa8e-ecf2a6c5a4c6', 'live_audio_device', true, 'general', NOW() - INTERVAL '30 minutes'),
        ('Security notice: For your safety, please keep your belongings secure. CCTV surveillance is active throughout the mall.', '5d03ecd0-e24b-45c8-aa8e-ecf2a6c5a4c6', 'live_audio_device', true, 'security', NOW() - INTERVAL '40 minutes'),
        ('Mall hours: Lulu Mall will close at 10 PM tonight. Please complete your shopping and exit by 9:45 PM.', '5d03ecd0-e24b-45c8-aa8e-ecf2a6c5a4c6', 'live_audio_device', true, 'general', NOW() - INTERVAL '55 minutes');

    -- ========================================
    -- RAJAGIRI SCHOOL OF ENGINEERING & TECHNOLOGY
    -- 9 transcripts
    -- ========================================
    INSERT INTO transcriptions (transcription_text, venue_id, device_id, is_announcement, announcement_type, created_at)
    VALUES 
        ('Class notification: Computer Science students - Advanced AI lecture has been moved to Seminar Hall 3.', '96ba7dbc-1fe8-491d-99fe-01c04f18d847', 'live_audio_device', true, 'general', NOW() - INTERVAL '1 minute'),
        ('Library announcement: Central library will close early today at 6 PM for annual maintenance. Please return books before closing.', '96ba7dbc-1fe8-491d-99fe-01c04f18d847', 'live_audio_device', true, 'maintenance', NOW() - INTERVAL '7 minutes'),
        ('Event announcement: Tech fest registration is now open. Visit Student Activity Center or register online at rajagiri.edu.', '96ba7dbc-1fe8-491d-99fe-01c04f18d847', 'live_audio_device', true, 'general', NOW() - INTERVAL '14 minutes'),
        ('Transport update: College bus departure time has been changed to 5:30 PM due to traffic conditions on MG Road.', '96ba7dbc-1fe8-491d-99fe-01c04f18d847', 'live_audio_device', true, 'transport', NOW() - INTERVAL '20 minutes'),
        ('Emergency drill: Fire evacuation drill scheduled for 2 PM today. All students and staff must participate. Assembly point is main ground.', '96ba7dbc-1fe8-491d-99fe-01c04f18d847', 'live_audio_device', true, 'emergency', NOW() - INTERVAL '25 minutes'),
        ('Placement notice: IBM campus recruitment drive tomorrow. Eligible students report to Placement Cell by 9 AM with updated resumes.', '96ba7dbc-1fe8-491d-99fe-01c04f18d847', 'live_audio_device', true, 'general', NOW() - INTERVAL '33 minutes'),
        ('Cafeteria announcement: New menu items available including South Indian breakfast combos. Special discount for faculty today.', '96ba7dbc-1fe8-491d-99fe-01c04f18d847', 'live_audio_device', true, 'general', NOW() - INTERVAL '40 minutes'),
        ('Lab notification: Electronics lab will be closed from 3 PM to 5 PM for equipment calibration. Plan your practical sessions accordingly.', '96ba7dbc-1fe8-491d-99fe-01c04f18d847', 'live_audio_device', true, 'maintenance', NOW() - INTERVAL '48 minutes'),
        ('Sports announcement: Basketball tournament registration closes today. Finals will be held this Saturday at the sports complex.', '96ba7dbc-1fe8-491d-99fe-01c04f18d847', 'live_audio_device', true, 'general', NOW() - INTERVAL '60 minutes');

    -- ========================================
    -- VERIFY INSERTIONS
    -- ========================================

    -- Count transcripts per venue
    SELECT 
        v.name as venue_name,
        COUNT(t.id) as transcript_count
    FROM venues v
    LEFT JOIN transcriptions t ON v.id = t.venue_id
    WHERE t.device_id = 'live_audio_device'
    GROUP BY v.name, v.id
    ORDER BY v.name;

    -- View all test transcripts with venue names
    SELECT 
        v.name as venue_name,
        t.transcription_text,
        t.announcement_type,
        t.created_at,
        EXTRACT(EPOCH FROM (NOW() - t.created_at))/60 as minutes_ago
    FROM transcriptions t
    LEFT JOIN venues v ON t.venue_id = v.id
    WHERE t.device_id = 'live_audio_device'
    ORDER BY t.created_at DESC;

    -- ========================================
    -- VIEW TRANSCRIPTS BY VENUE
    -- ========================================

    -- Cochin International Airport
    SELECT transcription_text, announcement_type, created_at
    FROM transcriptions
    WHERE venue_id = '08e988d8-6a75-422a-bfe0-0539231c87fb'
    ORDER BY created_at DESC;

    -- Ernakulam Junction Railway Station
    SELECT transcription_text, announcement_type, created_at
    FROM transcriptions
    WHERE venue_id = '2bad79f3-32aa-499f-8de4-2fe07f1a334a'
    ORDER BY created_at DESC;

    -- Lulu Mall Kochi
    SELECT transcription_text, announcement_type, created_at
    FROM transcriptions
    WHERE venue_id = '5d03ecd0-e24b-45c8-aa8e-ecf2a6c5a4c6'
    ORDER BY created_at DESC;

    -- Rajagiri School of Engineering & Technology
    SELECT transcription_text, announcement_type, created_at
    FROM transcriptions
    WHERE venue_id = '96ba7dbc-1fe8-491d-99fe-01c04f18d847'
    ORDER BY created_at DESC;

    -- ========================================
    -- CLEANUP (if you want to remove test data)
    -- ========================================

    -- Remove ALL test transcripts
    -- DELETE FROM transcriptions WHERE device_id = 'live_audio_device';

    -- Or remove by specific venue:
    -- DELETE FROM transcriptions WHERE device_id = 'live_audio_device' AND venue_id = '08e988d8-6a75-422a-bfe0-0539231c87fb'; -- Airport
    -- DELETE FROM transcriptions WHERE device_id = 'live_audio_device' AND venue_id = '2bad79f3-32aa-499f-8de4-2fe07f1a334a'; -- Railway Station
    -- DELETE FROM transcriptions WHERE device_id = 'live_audio_device' AND venue_id = '5d03ecd0-e24b-45c8-aa8e-ecf2a6c5a4c6'; -- Lulu Mall
    -- DELETE FROM transcriptions WHERE device_id = 'live_audio_device' AND venue_id = '96ba7dbc-1fe8-491d-99fe-01c04f18d847'; -- Rajagiri
