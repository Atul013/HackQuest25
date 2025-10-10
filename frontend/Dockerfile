# ML Model Dockerfile - Separate service for Whisper model
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    portaudio19-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download Whisper model
RUN python -c "import whisper; whisper.load_model('tiny')"

# Copy application code
COPY model.py .
COPY .env .

# Expose port
EXPOSE 8080

# Run the ML service
CMD ["python", "model.py"]
