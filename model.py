import whisper

import whisper
import os

# Load the Whisper  model
model = whisper.load_model("base")  # You can try "small", "medium", "large" for better accuracy

audio_dir = "./train/train/19-198-0003.wav"
output_file = "transcriptions.txt"

with open(output_file, "w", encoding="utf-8") as out_f:
    for filename in os.listdir(audio_dir):
        if filename.endswith(".wav"):
            audio_path = os.path.join(audio_dir, filename)
            print(f"Transcribing {audio_path}...")
            result = model.transcribe(audio_path)
            out_f.write(f"{filename}: {result['text']}\n")
            print(f"Transcription: {result['text']}")

print("All transcriptions saved to transcriptions.txt")
    