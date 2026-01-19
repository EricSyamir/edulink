#!/bin/bash
# Startup script for Render deployment
# Uses run.py which sets up Python path before importing the app

cd /opt/render/project/src/backend
python run.py
