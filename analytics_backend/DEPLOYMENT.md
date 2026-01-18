# Render Deployment Guide for Aadhaar Pulse Backend

## Prerequisites
- Render account (https://render.com)
- GitHub repository with your code

## Step-by-Step Deployment

### 1. Prepare Backend for Deployment

The backend is already configured! Just make sure these files exist:
- `requirements.txt` ✅
- `app/main.py` ✅
- `app/config.py` ✅

### 2. Create Web Service on Render

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

**Basic Settings:**
- Name: `aadhar-pulse-backend` (or your choice)
- Region: Choose closest to your users
- Branch: `main`
- Root Directory: `analytics_backend`
- Runtime: `Python 3`

**Build & Deploy:**
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Instance Type:**
- Free tier (for testing) or Starter ($7/month for better performance)

### 3. Environment Variables

Add these in Render dashboard under "Environment":

```
# Required
PYTHONUNBUFFERED=1

# Optional - Add API keys if using LLM features
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
HUGGINGFACE_API_KEY=your_key_here

# Configuration (optional, has defaults)
MAX_UPLOAD_SIZE_MB=100
ALLOWED_EXTENSIONS=csv,json,xlsx,xls
```

### 4. Deploy

- Click "Create Web Service"
- Wait 3-5 minutes for deployment
- Your backend URL will be: `https://aadhar-pulse-backend.onrender.com`

### 5. Update Frontend Configuration

1. Edit `frontend/.env.production`:
```env
VITE_ANALYTICS_URL=https://your-actual-backend-url.onrender.com
```

2. Redeploy your Vercel frontend (it will pick up the new env variable)

### 6. Enable CORS (Already configured!)

The backend already has CORS enabled in `app/main.py` for all origins.

## Testing

Test your deployed backend:
```bash
curl https://your-backend-url.onrender.com/api/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "version": "1.0.0",
  "components": {
    "api": "operational",
    "analytics": "operational",
    "llm": "configured"
  }
}
```

## Important Notes

⚠️ **Free Tier Limitations:**
- Spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds (cold start)
- 512 MB RAM limit
- Consider paid tier for production use

💡 **Optimization Tips:**
- Use Starter plan ($7/mo) for better performance
- Large file uploads (>10MB) may timeout on free tier
- Consider background job processing for large datasets

## Troubleshooting

**Deployment fails:**
- Check Build Logs in Render dashboard
- Verify `requirements.txt` is correct
- Ensure Python version compatibility

**Frontend can't connect:**
- Verify CORS is enabled
- Check environment variable in Vercel
- Test backend URL directly with curl

**Slow performance:**
- Free tier spins down - upgrade to paid
- Optimize data processing (reduce row count for testing)
- Consider caching strategies
