#!/usr/bin/env python
"""
Entry point for running the Edulink API.
Sets up Python path before importing the application.
"""

import sys
import os
from pathlib import Path

# Add backend directory to Python path BEFORE any app imports
backend_dir = Path(__file__).parent.absolute()
backend_path = str(backend_dir)

# Debug: Print paths
print(f"Backend directory: {backend_path}")
print(f"Current sys.path: {sys.path[:3]}")

# Add to sys.path if not already there
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)
    print(f"Added {backend_path} to sys.path")

# Verify app directory exists
app_dir = backend_dir / "app"
if app_dir.exists():
    print(f"App directory exists: {app_dir}")
    # Check if __init__.py exists
    init_file = app_dir / "__init__.py"
    if init_file.exists():
        print(f"app/__init__.py exists")
    else:
        print(f"WARNING: app/__init__.py NOT found!")
else:
    print(f"ERROR: App directory NOT found at {app_dir}")

# Now we can safely import the app
from app.main import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
