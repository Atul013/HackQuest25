import whisper
import os
import librosa
import numpy as np

# Load Whisper model
model = whisper.load_model("base")  # You can use "small", "medium", "large"

audio_dir = "./audio"
output_file = "transcriptions.txt"

def detect_siren(audio_path):
    """
    Simple siren detector using frequency energy (1-3 kHz band)
    """
    y, sr = librosa.load(audio_path, sr=None)
    S = np.abs(librosa.stft(y))
    freqs = librosa.fft_frequencies(sr=sr)

    # Focus on 1-3 kHz range (typical siren frequencies)
    mask = (freqs >= 1000) & (freqs <= 3000)
    siren_band = S[mask, :]

    # Compute average energy and variance over time
    mean_energy = np.mean(siren_band)
    var_energy = np.var(np.mean(siren_band, axis=0))

    # Heuristic threshold for siren detection
    return mean_energy > 0 and var_energy > 1

with open(output_file, "w", encoding="utf-8") as out_f:
    for filename in os.listdir(audio_dir):
        if filename.endswith(".wav"):
            audio_path = os.path.join(audio_dir, filename)
            print(f"Transcribing {audio_path}...")

            # --- Whisper transcription (existing) ---
            result = model.transcribe(audio_path)
            text = result["text"].strip()
            out_f.write(f"{filename}: {text}\n")
            print(f"Transcription: {text}")

            # --- Siren detection ---
            if detect_siren(audio_path):
                print("Siren detected")
                out_f.write("Siren detected\n")

print("All transcriptions and siren detections saved to transcriptions.txt")
