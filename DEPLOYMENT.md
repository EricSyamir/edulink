# 🚀 Free Hosting Deployment Guide

This guide will help you deploy Edulink to free hosting platforms. We'll use:
- **Backend**: Render.com (Free tier)
- **Frontend**: Vercel (Free tier)
- **Database**: PlanetScale (Free MySQL) or Supabase (Free PostgreSQL)

---

## Option 1: Render + Vercel + PlanetScale (Recommended)

### Step 1: Set Up Database (PlanetScale)

1. Go to [PlanetScale.com](https://planetscale.com) and sign up for free
2. Create a new database called `edulink_db`
3. Go to **Settings** → **Passwords** → **Create password**
4. Copy the connection string (it will look like):
   ```
   mysql://username:password@host/database?sslaccept=strict
   ```
5. **Important**: Click **Connect** → **Connect with** → **Prisma** to get the connection string format

### Step 2: Deploy Backend (Render.com)

1. Go to [Render.com](https://render.com) and sign up (use GitHub)
2. Click **New** → **Web Service**
3. Connect your GitHub repository: `EricSyamir/edulink`
4. Configure:
   - **Name**: `edulink-api`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables:
   ```
   DATABASE_URL=mysql+pymysql://username:password@host/database?sslaccept=strict
   JWT_SECRET_KEY=your-super-secret-key-change-this
   JWT_ALGORITHM=HS256
   JWT_EXPIRATION_HOURS=24
   FACE_SIMILARITY_THRESHOLD=0.5
   FACE_MODEL_NAME=buffalo_l
   DEFAULT_REWARD_POINTS=10
   DEFAULT_PUNISHMENT_POINTS=-10
   INITIAL_STUDENT_POINTS=100
   DEBUG=False
   CORS_ORIGINS=https://your-frontend-url.vercel.app
   ```
6. Click **Create Web Service**
7. Wait for deployment (first build takes ~5-10 minutes)
8. Copy your backend URL (e.g., `https://edulink-api.onrender.com`)

### Step 3: Initialize Database

1. Once backend is deployed, run migrations:
   - Option A: Use Render Shell
     - Go to your service → **Shell**
     - Run: `python -m app.database` (if you create a migration script)
   
   - Option B: Use PlanetScale Dashboard
     - Go to PlanetScale → Your database → **Console**
     - Copy contents of `backend/migrations/create_tables.sql`
     - Paste and run in the SQL console

2. Seed initial admin user:
   - Use Render Shell or create a one-time script
   - Or manually insert via PlanetScale console:
   ```sql
   INSERT INTO teachers (teacher_id, name, email, password_hash) 
   VALUES ('T000001', 'Admin Teacher', 'admin@edulink.com', 
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.N0TUFgHXXXXXXX');
   ```

### Step 4: Deploy Frontend (Vercel)

1. Go to [Vercel.com](https://vercel.com) and sign up (use GitHub)
2. Click **Add New Project**
3. Import your repository: `EricSyamir/edulink`
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variable:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```
   (Replace with your actual Render backend URL)
6. Click **Deploy**
7. Wait for deployment (~2-3 minutes)
8. Copy your frontend URL (e.g., `https://edulink.vercel.app`)

### Step 5: Update CORS Settings

1. Go back to Render dashboard → Your backend service
2. Edit Environment Variables
3. Update `CORS_ORIGINS` to include your Vercel URL:
   ```
   CORS_ORIGINS=https://your-frontend-url.vercel.app
   ```
4. Save and redeploy

---

## Option 2: Railway.app (All-in-One)

Railway offers free tier with $5 credit monthly.

### Step 1: Deploy Backend

1. Go to [Railway.app](https://railway.app) and sign up
2. Click **New Project** → **Deploy from GitHub**
3. Select your repository
4. Add a **PostgreSQL** service (free tier available)
5. Add environment variables (same as Render)
6. Railway auto-detects Python and runs the app

### Step 2: Deploy Frontend

1. In same Railway project, click **New** → **GitHub Repo**
2. Select your repo again
3. Set root directory to `frontend`
4. Add environment variable: `VITE_API_URL` = your Railway backend URL
5. Railway auto-detects Vite and deploys

---

## Option 3: Fly.io (Free Tier)

### Backend Deployment

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Initialize: `cd backend && fly launch`
4. Follow prompts and deploy

### Frontend Deployment

1. Use Vercel or Netlify (same as Option 1)

---

## Database Migration Notes

### For PlanetScale (MySQL)

The existing SQL migrations work as-is. Just run them in PlanetScale console.

### For Supabase (PostgreSQL)

If you prefer PostgreSQL, you'll need to:

1. Sign up at [Supabase.com](https://supabase.com)
2. Create a new project
3. Get connection string from Settings → Database
4. Update `DATABASE_URL` in backend to PostgreSQL format:
   ```
   postgresql://user:password@host:5432/database
   ```
5. Convert SQL migrations (Supabase uses PostgreSQL):
   - Change `AUTO_INCREMENT` → `SERIAL`
   - Change `TIMESTAMP` → `TIMESTAMPTZ`
   - Remove MySQL-specific syntax

---

## Important Notes

### Free Tier Limitations

**Render.com:**
- Free tier spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- 750 hours/month free

**Vercel:**
- Unlimited deployments
- 100GB bandwidth/month
- Perfect for frontend hosting

**PlanetScale:**
- 1 database free
- 1GB storage
- 1 billion rows/month

### Performance Tips

1. **Keep Backend Alive**: Use a cron job service like [cron-job.org](https://cron-job.org) to ping your Render URL every 10 minutes
2. **Database Connection Pooling**: Already configured in `database.py`
3. **Face Model Loading**: First face recognition request will be slower (~5-10 seconds) as model downloads

### Security Checklist

- ✅ Change `JWT_SECRET_KEY` to a strong random string
- ✅ Use HTTPS (automatic on Render/Vercel)
- ✅ Set `DEBUG=False` in production
- ✅ Restrict `CORS_ORIGINS` to your frontend URL only
- ✅ Use strong database passwords

---

## Troubleshooting

### Backend won't start

- Check logs in Render dashboard
- Verify all environment variables are set
- Ensure `requirements.txt` is correct

### Database connection errors

- Verify `DATABASE_URL` format is correct
- Check database is accessible from Render IP
- Ensure SSL is enabled (PlanetScale requires it)

### CORS errors

- Verify `CORS_ORIGINS` includes your frontend URL
- Check URL has no trailing slash
- Ensure backend is deployed and accessible

### Face recognition not working

- First request downloads model (~100MB) - be patient
- Check Render logs for InsightFace errors
- Verify model name is `buffalo_l`

---

## Quick Deploy Commands

### Render (via CLI)

```bash
# Install Render CLI
npm install -g render-cli

# Login
render login

# Deploy
cd backend
render deploy
```

### Vercel (via CLI)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy frontend
cd frontend
vercel --prod
```

---

## Cost Summary

| Service | Cost | Limits |
|---------|------|--------|
| Render.com | Free | 750 hrs/month |
| Vercel | Free | Unlimited |
| PlanetScale | Free | 1GB storage |
| **Total** | **$0/month** | Perfect for small apps |

---

## Next Steps After Deployment

1. ✅ Test login with admin account
2. ✅ Register a test student with face
3. ✅ Test face identification
4. ✅ Create discipline records
5. ✅ Share your app URL with users!

---

## Support

If you encounter issues:
1. Check Render/Vercel deployment logs
2. Verify environment variables
3. Test API endpoints using `/api/docs`
4. Check database connection in PlanetScale dashboard

Good luck with your deployment! 🚀
