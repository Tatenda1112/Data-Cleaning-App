#!/usr/bin/env python3
"""
Test script to verify backend functionality
"""
import requests
import json

def test_backend():
    base_url = "http://localhost:8000"
    
    print("🧪 Testing DatViz Backend...")
    
    try:
        # Test if backend is running
        response = requests.get(f"{base_url}/docs", timeout=5)
        print("✅ Backend is running!")
        print(f"📚 API docs available at: {base_url}/docs")
        
        # Test registration endpoint
        test_user = {
            "username": "testuser",
            "email": "test@example.com",
            "full_name": "Test User",
            "password": "testpass123"
        }
        
        print("\n🔐 Testing user registration...")
        reg_response = requests.post(f"{base_url}/register", json=test_user)
        
        if reg_response.status_code == 200:
            print("✅ User registration works!")
            user_data = reg_response.json()
            print(f"   Created user: {user_data['username']}")
        else:
            print(f"❌ Registration failed: {reg_response.status_code}")
            print(f"   Error: {reg_response.text}")
        
        # Test login
        print("\n🔑 Testing user login...")
        login_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        login_response = requests.post(f"{base_url}/token", data=login_data)
        
        if login_response.status_code == 200:
            print("✅ User login works!")
            token_data = login_response.json()
            print(f"   Token received: {token_data['access_token'][:20]}...")
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"   Error: {login_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not running!")
        print("   Start it with: python start_backend.py")
    except Exception as e:
        print(f"❌ Error testing backend: {e}")

if __name__ == "__main__":
    test_backend()
