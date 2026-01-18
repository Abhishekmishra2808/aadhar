# 🚀 Quick Deployment Checklist

## Option 1: Deploy Backend to Render (Recommended)

### ✅ Step 1: Deploy Backend
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Settings:
   - **Root Directory**: `analytics_backend`
   - **Build**: `pip install -r requirements.txt`
   - **Start**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance**: Free or Starter
5. Click "Create Web Service"
6. Wait 3-5 minutes ⏱️
7. Copy your backend URL: `https://xxx.onrender.com`

### ✅ Step 2: Update Frontend Config
1. Edit `frontend/.env.production`:
   ```env
   VITE_ANALYTICS_URL=https://your-backend-url.onrender.com
   ```
2. Commit and push to GitHub
3. Vercel will auto-redeploy ✨

### ✅ Step 3: Test
Visit your Vercel frontend and upload a file!

---

## Option 2: Run Backend Locally

### Start Backend
```powershell
cd D:\UIDAI\aadhar\analytics_backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Start Frontend
```powershell
cd D:\UIDAI\aadhar\frontend
npm run dev
```

Visit http://localhost:5173

---

## Current Status

❌ **Backend**: Not running locally (connection refused)  
✅ **Frontend**: Deployed on Vercel  

**Next Step**: Deploy backend to Render OR start it locally!

---

## Troubleshooting

**"Failed to fetch"**  
→ Backend not running. Start locally OR deploy to Render

**"CORS error"**  
→ Already fixed! Backend allows all origins

**"Cold start delay"**  
→ Render free tier spins down. First request takes 30-60s

**Large file timeout**  
→ Upgrade to Render Starter plan ($7/mo)

---

## URLs Reference

**Local Development:**
- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs

**Production:**
- Backend: https://your-backend.onrender.com
- Frontend: https://your-app.vercel.app
- API Docs: https://your-backend.onrender.com/docs
