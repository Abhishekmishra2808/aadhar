#!/usr/bin/env python3
"""
Quick health check script for Aadhaar Pulse Backend
Tests if the backend is properly deployed and responding
"""

import requests
import sys
from datetime import datetime

BACKEND_URL = "https://aadhar-t8uc.onrender.com"

def check_health():
    """Check backend health endpoint"""
    print(f"🔍 Checking backend health: {BACKEND_URL}")
    print(f"⏰ Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    try:
        print("📡 Making request to /api/health...")
        response = requests.get(f"{BACKEND_URL}/api/health", timeout=60)
        
        print(f"✅ Status Code: {response.status_code}")
        print(f"✅ Response Time: {response.elapsed.total_seconds():.2f}s")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n📊 Backend Status:")
            print(f"   Status: {data.get('status')}")
            print(f"   Version: {data.get('version')}")
            print(f"   Timestamp: {data.get('timestamp')}")
            
            components = data.get('components', {})
            print(f"\n🔧 Components:")
            for name, status in components.items():
                icon = "✅" if status in ["operational", "configured"] else "❌"
                print(f"   {icon} {name}: {status}")
            
            print(f"\n✅ Backend is HEALTHY and ready!")
            return True
        else:
            print(f"\n❌ Backend returned error status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("\n⚠️  Request timed out (60s)")
        print("This usually means:")
        print("   - Service is waking up (Render free tier)")
        print("   - Try again in 30-60 seconds")
        print("   - Or check Render dashboard for errors")
        return False
        
    except requests.exceptions.ConnectionError:
        print("\n❌ Connection failed")
        print("This usually means:")
        print("   - Backend is not deployed")
        print("   - Service is stopped")
        print("   - URL is incorrect")
        print(f"\n👉 Check: https://dashboard.render.com")
        return False
        
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return False

def check_cors():
    """Check CORS headers"""
    print(f"\n\n🔒 Checking CORS configuration...")
    
    try:
        response = requests.options(
            f"{BACKEND_URL}/api/health",
            headers={
                "Origin": "https://aadhar-ten.vercel.app",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type"
            },
            timeout=30
        )
        
        cors_headers = {
            k: v for k, v in response.headers.items()
            if k.lower().startswith('access-control')
        }
        
        if cors_headers:
            print("✅ CORS headers present:")
            for header, value in cors_headers.items():
                print(f"   {header}: {value}")
            return True
        else:
            print("❌ No CORS headers found")
            print("   This might cause CORS errors in browser")
            return False
            
    except Exception as e:
        print(f"⚠️  Could not check CORS: {e}")
        return False

def main():
    """Run all checks"""
    print("=" * 60)
    print("🏥 Aadhaar Pulse Backend Health Check")
    print("=" * 60)
    
    health_ok = check_health()
    cors_ok = check_cors()
    
    print("\n" + "=" * 60)
    if health_ok and cors_ok:
        print("✅ All checks passed! Backend is ready.")
        print("\n📝 Next steps:")
        print("   1. Make sure frontend .env.production has correct URL")
        print("   2. Redeploy Vercel frontend (git push)")
        print("   3. Try uploading a file!")
        sys.exit(0)
    elif health_ok:
        print("⚠️  Backend is healthy but CORS might be an issue")
        print("\n📝 Next steps:")
        print("   1. Check Render logs for CORS errors")
        print("   2. Verify middleware is loaded on startup")
        print("   3. Try hard refresh in browser (Ctrl+Shift+R)")
        sys.exit(1)
    else:
        print("❌ Backend health check failed")
        print("\n📝 Troubleshooting:")
        print("   1. Check Render dashboard: https://dashboard.render.com")
        print("   2. Look at deployment logs for errors")
        print("   3. Verify environment variables are set")
        print("   4. Try manual deploy")
        print(f"\n📚 Full guide: See RENDER_SETUP.md")
        sys.exit(1)

if __name__ == "__main__":
    main()
