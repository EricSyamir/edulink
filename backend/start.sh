#!/bin/bash
# Startup script for Render deployment
# Uses run.py which sets up Python path before importing the app

# Change to backend directory and ensure we're there
cd /opt/render/project/src/backend || exit 1

# Verify we're in the right place
pwd
ls -la

# Run the application
python run.py
