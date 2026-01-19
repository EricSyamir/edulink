# ⚡ Quick Deploy Guide (5 Minutes)

## 🎯 Simplest Free Hosting Setup

### Prerequisites
- GitHub account (already have it!)
- 10 minutes of your time

---

## Step 1: Database Setup (2 minutes)

### Option A: PlanetScale (MySQL) - Recommended

1. Go to https://planetscale.com → Sign up (free)
2. Click **Create database** → Name: `edulink_db`
3. Click **Create password** → Copy the connection string
4. **Done!** ✅

### Option B: Supabase (PostgreSQL) - Alternative

1. Go to https://supabase.com → Sign up (free)
2. Create new project → Wait for setup
3. Go to **Settings** → **Database** → Copy connection string
4. **Done!** ✅

---

## Step 2: Deploy Backend (2 minutes)

### Using Render.com

1. Go to https://render.com → Sign up with GitHub
2. Click **New** → **Web Service**
3. Connect repository: `EricSyamir/edulink`
4. Settings:
   - **Name**: `edulink-api`
   - **Root Directory**: `backend`
   - **Python Version**: `3.12.7` (IMPORTANT: Set this manually in Render dashboard → Settings → Python Version)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `chmod +x start.sh && ./start.sh` (or manually set: `cd /opt/render/project/src/backend && export PYTHONPATH=/opt/render/project/src/backend:$PYTHONPATH && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`)
5. Add Environment Variables:
   ```env
   # Supabase PostgreSQL - Use Transaction Pooler (IPv4) for Render compatibility
   # Go to Supabase → Settings → Database → Connection String → Transaction mode
   # IMPORTANT: Use port 6543 (Transaction pooler), NOT 5432 (Direct connection)
   DATABASE_URL=postgresql+psycopg2://postgres.stkxcgpvzjpkblihoshz:Edulink1010#@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
   
   SESSION_SECRET_KEY=Edulink1010#
   # CORS: Use your ACTUAL Vercel frontend URL (you'll get this after deploying frontend)
   # For now, use a placeholder - you MUST update this after Step 3!
   CORS_ORIGINS=https://edulink-my.vercel.app
   # CRITICAL: Set DEBUG=False for production (required for cross-origin cookies)
   DEBUG=False
   ```
   
   **IMPORTANT**: 
   - Use the **Transaction pooler** (port 6543), NOT the direct connection (port 5432)
   - The pooler uses IPv4 which is compatible with Render's network
   - Direct connection uses IPv6 which Render doesn't support
   - **CORS_ORIGINS**: Update this with your **actual** Vercel URL after deploying frontend (Step 3)
   - **DEBUG=False**: Required in production for cross-origin cookie support (SameSite=None)
6. Click **Create** → Wait ~5 minutes
7. Copy your backend URL (e.g., `https://edulink-api.onrender.com`)

### How to generate `SESSION_SECRET_KEY`

Use **one** of these methods (any long random string is fine):

1. **Python (recommended)** – run this once in a terminal:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```
   Copy the printed value into `SESSION_SECRET_KEY`.

2. **Node.js**:
   ```bash
   node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"
   ```

3. **Online generator** (last resort):
   - Use a trusted password/secret generator such as [1Password password generator](https://1password.com/password-generator)
   - Generate a **32+ character** random string and paste it into `SESSION_SECRET_KEY`.

### Initialize Database & Create Admin Account

**Option 1: Using API Endpoint (Easiest)**

1. Once your backend is deployed, visit:
   ```
   https://your-backend-url.onrender.com/api/setup/init-database
   ```
2. Or use curl:
   ```bash
   curl -X POST https://your-backend-url.onrender.com/api/setup/init-database
   ```
3. This will:
   - Create all database tables
   - Create admin account: `admin@edulink.com` / `admin123`
4. **Done!** ✅

**Option 2: Using Render Shell**

1. In Render dashboard → Your service → **Shell**
2. Run:
   ```bash
   python scripts/init_cloud_db.py
   ```
3. **Done!** ✅

---

## Step 3: Deploy Frontend (1 minute)

### Using Vercel

1. Go to https://vercel.com → Sign up with GitHub
2. Click **Add New Project**
3. Import: `EricSyamir/edulink`
4. Settings:
   - **Root Directory**: `frontend`
   - **Framework**: Vite
5. Add Environment Variable (CRITICAL - app won't work without this!):
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```
   **Replace with your actual Render backend URL** (e.g., `https://edulink-api.onrender.com`)
   
   ⚠️ **If you forget this, the frontend will show a white page!**
   
6. Click **Deploy** → Wait ~2 minutes
7. Copy your frontend URL (e.g., `https://edulink-my.vercel.app`)

**⚠️ CRITICAL: Update CORS in Render!**

After getting your Vercel URL, you **MUST** update CORS in Render:
1. Go to Render → Your backend service → **Environment** tab
2. Update `CORS_ORIGINS` to your **exact** Vercel URL:
   ```
   CORS_ORIGINS=https://edulink-my.vercel.app
   ```
   (Replace with your actual Vercel URL - check it matches exactly!)
3. Click **Save Changes** → Wait for redeploy (~2 minutes)
4. **Without this, you'll get CORS errors and login won't work!**

**Troubleshooting White Page:**
- Open browser console (F12) and check for errors
- Verify `VITE_API_URL` is set correctly in Vercel
- Check that the backend URL is accessible (try opening it in browser)
- Look for CORS errors in console

### Update CORS (CRITICAL - Fix CORS Errors!)

**If you see CORS errors in the browser console, follow these steps:**

1. Go to Render → Your backend service (`edulink-api`)
2. Click **Environment** tab
3. Find the `CORS_ORIGINS` variable
4. Update it to include your **exact** Vercel frontend URL:
   ```
   CORS_ORIGINS=https://edulink-my.vercel.app
   ```
   **Important:** 
   - Use your **actual** Vercel URL (check your Vercel dashboard)
   - No trailing slash
   - If you have multiple origins, separate with commas: `https://edulink-my.vercel.app,https://edulink.vercel.app`
5. Click **Save Changes** → Render will auto-redeploy (~2 minutes)
6. Wait for deployment to complete, then refresh your frontend

**Common CORS Error:**
```
Access to XMLHttpRequest blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present
```
**Solution:** Make sure `CORS_ORIGINS` exactly matches your Vercel URL (including `https://`)

---

## Step 4: Test Your App! 🎉

1. Visit your Vercel URL
2. Login with:
   - Email: `admin@edulink.com`
   - Password: `admin123`
3. **Change the password immediately!**

---

## 🆓 Free Tier Limits

| Service | Free Limits |
|---------|------------|
| Render | 750 hours/month |
| Vercel | Unlimited |
| PlanetScale | 1GB storage |
| **Total Cost** | **$0/month** |

---

## 🐛 Troubleshooting

### Backend won't start?
- Check Render logs
- Verify `DATABASE_URL` is correct
- Ensure all env vars are set

### CORS errors?
- Update `CORS_ORIGINS` in Render
- Make sure URL has no trailing slash

### Database errors?
- Verify connection string format
- Check database is accessible
- Run `init_cloud_db.py` script

### 401 Unauthorized errors / Login not working?
- **Check `DEBUG=False`** is set in Render environment variables (required for cross-origin cookies)
- Verify `CORS_ORIGINS` includes your exact Vercel URL
- Clear browser cookies and try again
- Check browser console for cookie-related errors
- Ensure both frontend and backend are using HTTPS (required for SameSite=None cookies)
- Try logging in again after clearing cookies

---

## 📚 Full Documentation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions and alternatives.

---

## ✅ You're Done!

Your app is now live at:
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-api.onrender.com
- **API Docs**: https://your-api.onrender.com/api/docs

Share it with your users! 🚀
