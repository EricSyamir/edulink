#!/bin/bash
# Startup script for Render deployment
# Ensures correct Python path and starts the application

cd /opt/render/project/src/backend
export PYTHONPATH=/opt/render/project/src/backend:$PYTHONPATH
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
