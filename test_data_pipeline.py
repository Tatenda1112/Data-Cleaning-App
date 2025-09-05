#!/usr/bin/env python3
"""
Test script for the data processing pipeline
"""

import requests
import json

def test_backend():
    base_url = "http://localhost:8000"
    
    print("Testing DatViz Backend...")
    print("=" * 50)
    
    # Test 1: Check if backend is running
    try:
        response = requests.get(f"{base_url}/docs")
        if response.status_code == 200:
            print("✅ Backend is running")
        else:
            print(f"❌ Backend returned status {response.status_code}")
            return
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not running. Please start it with: python start_backend.py")
        return
    
    # Test 2: Get available checks
    try:
        response = requests.get(f"{base_url}/config/available-checks")
        if response.status_code == 200:
            checks = response.json()
            print(f"✅ Available checks: {len(checks)} checks loaded")
            for check in checks[:3]:  # Show first 3 checks
                print(f"   - {check['name']}: {check['description']}")
        else:
            print(f"❌ Failed to get available checks: {response.status_code}")
    except Exception as e:
        print(f"❌ Error getting available checks: {e}")
    
    # Test 3: Get default config
    try:
        response = requests.get(f"{base_url}/config/default")
        if response.status_code == 200:
            config = response.json()
            print(f"✅ Default config loaded with {len(config)} settings")
        else:
            print(f"❌ Failed to get default config: {response.status_code}")
    except Exception as e:
        print(f"❌ Error getting default config: {e}")
    
    print("\n" + "=" * 50)
    print("Backend test completed!")
    print("\nNext steps:")
    print("1. Start the frontend: cd frontend_app && npm start")
    print("2. Open http://localhost:3000 in your browser")
    print("3. Upload a data file and configure checks")

if __name__ == "__main__":
    test_backend()
