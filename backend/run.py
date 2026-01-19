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
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Now we can safely import the app
from app.main import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
