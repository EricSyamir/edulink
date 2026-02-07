FROM python:3.12.7-slim

WORKDIR /app

# Install system dependencies for PostgreSQL and image processing
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better Docker layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download face model during build (avoids download on every cold start)
RUN python -c "\
from insightface.app import FaceAnalysis; \
fa = FaceAnalysis(name='buffalo_sc', root='/app/.insightface', providers=['CPUExecutionProvider']); \
fa.prepare(ctx_id=0, det_size=(640, 640)) \
"

# Copy application code
COPY . .

# Set Python path
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8000

# Run application
# Use PORT environment variable if set (Fly.io sets this automatically from internal_port)
# Default to 8000 if PORT is not set
CMD sh -c "uvicorn app.main:app --host 0.0.0.0 --port \${PORT:-8000}"
