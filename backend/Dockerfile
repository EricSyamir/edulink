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

# Pre-download InsightFace buffalo_l model during build
# This downloads the model to ~/.insightface/models/buffalo_l and includes it in the image
RUN python -c "import os; os.makedirs('/root/.insightface/models', exist_ok=True); from insightface.app import FaceAnalysis; print('Downloading buffalo_l model...'); fa = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider']); fa.prepare(ctx_id=0, det_size=(640, 640)); print('Model downloaded successfully')"

# Copy application code
COPY . .

# Set Python path
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8000

# Run application
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
