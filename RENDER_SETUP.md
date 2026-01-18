# 🚀 Render Backend Setup Guide

## Issue: CORS Error

**Error**: `No 'Access-Control-Allow-Origin' header is present`

### Solution Steps:

## 1. Check Backend Status

Visit your backend health endpoint:
```
https://aadhar-t8uc.onrender.com/api/health
```

**Expected Response:**
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

**If it returns an error or doesn't load:**
→ Your service is probably sleeping (Render free tier) or failed to start

## 2. Wake Up Render Service

Render free tier services spin down after 15 minutes. They take 30-60 seconds to wake up.

1. Open your Render dashboard: https://dashboard.render.com
2. Go to your service: `aadhar-t8uc`
3. Check the **Logs** tab for any errors
4. If service is down, click **Manual Deploy** → **Deploy latest commit**

## 3. Verify Environment Variables on Render

Go to your service → **Environment** tab and add these variables:

### Required:
```env
PYTHONUNBUFFERED=1
API_HOST=0.0.0.0
DEBUG=false
```

### For HuggingFace (Free LLM Option):
```env
LLM_PROVIDER=huggingface
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxx
HUGGINGFACE_MODEL=meta-llama/Meta-Llama-3-8B-Instruct
```

### Optional (for paid LLM):
```env
OPENAI_API_KEY=sk-xxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxx
```

### File Upload Limits:
```env
MAX_UPLOAD_SIZE_MB=50
ALLOWED_EXTENSIONS=csv,json,xlsx
```

## 4. Get HuggingFace API Key (FREE!)

### Step-by-Step:

1. **Sign up**: https://huggingface.co/join
2. **Go to Settings**: https://huggingface.co/settings/tokens
3. **Create New Token**:
   - Name: `Aadhaar Pulse Backend`
   - Type: **Read** (free tier)
   - Click **Generate token**
4. **Copy the token**: `hf_xxxxxxxxxxxxxxxxxxxxxx`
5. **Add to Render**: 
   - Go to your Render service → Environment
   - Add: `HUGGINGFACE_API_KEY=hf_xxxxxx`
   - Add: `LLM_PROVIDER=huggingface`

### Recommended Models (Free Tier):

**Best for Analysis (Recommended):**
```env
HUGGINGFACE_MODEL=meta-llama/Meta-Llama-3-8B-Instruct
```

**Alternatives:**
- `mistralai/Mistral-7B-Instruct-v0.2` (Fast, good quality)
- `HuggingFaceH4/zephyr-7b-beta` (Lightweight)
- `google/flan-t5-xxl` (Very fast, shorter responses)

### HuggingFace Rate Limits (Free Tier):
- ✅ Unlimited API calls
- ✅ 1000 requests/hour per model
- ⚠️ Slower inference (~2-5 seconds per request)
- ⚠️ No guaranteed uptime (models can be busy)

## 5. Redeploy Backend

After adding environment variables:

1. Go to Render Dashboard
2. Click **Manual Deploy** → **Deploy latest commit**
3. Wait 3-5 minutes for deployment
4. Check logs for any errors

## 6. Test Backend

```bash
# Test health endpoint
curl https://aadhar-t8uc.onrender.com/api/health

# Test with authentication (if configured)
curl -H "Authorization: Bearer YOUR_TOKEN" https://aadhar-t8uc.onrender.com/api/health
```

## 7. Update Frontend Environment

Make sure `frontend/.env.production` has:
```env
VITE_ANALYTICS_URL=https://aadhar-t8uc.onrender.com
```

Then redeploy Vercel or push to GitHub.

## Troubleshooting

### Issue: Service keeps spinning down
**Solution**: 
- Upgrade to paid plan ($7/month) for always-on service
- Or use external monitor (e.g., UptimeRobot) to ping every 14 minutes

### Issue: CORS still blocked
**Fixes**:
1. Check backend logs in Render dashboard
2. Verify service is actually running (not sleeping)
3. Make sure CORS middleware is loaded (check startup logs)
4. Try clearing browser cache and hard refresh

### Issue: 502 Bad Gateway
**Cause**: Service failed to start or crashed
**Fix**: 
1. Check Render logs
2. Verify `requirements.txt` has all dependencies
3. Check for Python version conflicts
4. Ensure `PORT` environment variable is used correctly

### Issue: File upload timeout
**Cause**: Free tier has limited resources
**Solutions**:
- Reduce file size (<5MB for testing)
- Upgrade to Starter plan ($7/month)
- Use local backend for large files

### Issue: LLM requests fail
**Cause**: No API key configured
**Fix**: Add HuggingFace API key to environment variables

### Issue: LLM is too slow
**Cause**: HuggingFace free tier can be slow
**Solutions**:
- Use smaller model: `google/flan-t5-large`
- Upgrade to OpenAI ($0.01 per request)
- Disable LLM: `run_llm=false` in analysis requests

## Quick Fix for Immediate Testing

If you need to test RIGHT NOW:

1. **Start backend locally**:
   ```powershell
   cd D:\UIDAI\aadhar\analytics_backend
   .\venv\Scripts\Activate.ps1
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Update frontend to use local backend**:
   Edit `frontend\.env.local`:
   ```env
   VITE_ANALYTICS_URL=http://localhost:8000
   ```

3. **Run frontend**:
   ```powershell
   cd D:\UIDAI\aadhar\frontend
   npm run dev
   ```

This bypasses all deployment issues temporarily!

## HuggingFace vs OpenAI Comparison

| Feature | HuggingFace (Free) | OpenAI (Paid) |
|---------|-------------------|---------------|
| Cost | **Free** | ~$0.01-0.03/request |
| Speed | 2-5 seconds | <1 second |
| Quality | Good | Excellent |
| Rate Limit | 1000/hour | Much higher |
| Setup | Easy (just API key) | Need payment |

**Recommendation**: Start with HuggingFace for development, upgrade to OpenAI for production.

## Next Steps

1. ✅ Get HuggingFace API key
2. ✅ Add to Render environment variables
3. ✅ Redeploy service
4. ✅ Test health endpoint
5. ✅ Try file upload from Vercel frontend

Need help? Check Render logs first!
