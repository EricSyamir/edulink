FROM python:3.12-alpine

WORKDIR /app

# Install build dependencies needed for some Python packages
RUN apk add --no-cache gcc musl-dev libffi-dev

# Keep logs unbuffered
ENV PYTHONUNBUFFERED=1

# Copy and install deps first (better layer caching)
COPY requirements.txt /app/requirements.txt

# Install dependencies directly (skip upgrade to avoid PyPI connectivity issues)
RUN pip install --no-cache-dir --timeout=600 --retries=10 fastapi uvicorn deep-translator pydantic

# Copy backend code
COPY backend_server.py /app/backend_server.py

# Fly will route to this internal port
EXPOSE 8000

# Run FastAPI via uvicorn; Fly sets $PORT sometimes, but we default to 8000
CMD sh -c "uvicorn backend_server:app --host 0.0.0.0 --port ${PORT:-8000}"

