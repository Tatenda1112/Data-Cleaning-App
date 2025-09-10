#!/usr/bin/env python3
"""
Startup script for DatViz backend
"""
import subprocess
import sys
import os

def main():
    print("Starting DatViz Backend...")
    print("Installing dependencies...")
    
    # Install requirements
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
    
    print("Starting FastAPI server...")
    print("Backend will be available at: http://localhost:8000")
    print("API docs at: http://localhost:8000/docs")
    print("Press Ctrl+C to stop")
    
    # Start the server
    subprocess.run([sys.executable, "-m", "uvicorn", "backend.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"])

if __name__ == "__main__":
    main()
