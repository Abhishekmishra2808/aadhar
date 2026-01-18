# Quick Start - Running Locally

## Start Backend

```powershell
# Navigate to backend
cd D:\UIDAI\aadhar\analytics_backend

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Start server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will be available at: http://localhost:8000

## Start Frontend

```powershell
# In a new terminal
cd D:\UIDAI\aadhar\frontend

# Start dev server
npm run dev
```

Frontend will be available at: http://localhost:5173

## Or Use Deployed Backend

If you don't want to run the backend locally:

1. Deploy backend to Render (see DEPLOYMENT.md)
2. Update `frontend/.env.local`:
   ```env
   VITE_ANALYTICS_URL=https://your-backend-url.onrender.com
   ```
3. Restart frontend dev server

## Production URLs

- **Frontend (Vercel)**: Your Vercel deployment URL
- **Backend (Render)**: https://your-backend-name.onrender.com

Both are automatically deployed when you push to GitHub!
