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

# Pre-download InsightFace buffalo_l model during build with retries
# Install wget for more reliable downloads
RUN apt-get update && apt-get install -y wget unzip && rm -rf /var/lib/apt/lists/*

# Download buffalo_l model with retries and verify files
RUN mkdir -p /root/.insightface/models && \
    cd /root/.insightface/models && \
    wget --tries=5 --timeout=120 --retry-connrefused --continue https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip -O buffalo_l.zip && \
    unzip -q buffalo_l.zip && \
    rm buffalo_l.zip && \
    ls -la && \
    find . -name "*.onnx" -type f && \
    test -f buffalo_l/w600k_r50.onnx || test -f w600k_r50.onnx && \
    test -f buffalo_l/det_10g.onnx || test -f det_10g.onnx && \
    echo "Model downloaded and verified successfully"

# Copy application code
COPY . .

# Set Python path
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8000

# Run application
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
