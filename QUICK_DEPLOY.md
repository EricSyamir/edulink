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
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables:
   ```env
   # Supabase PostgreSQL (recommended for your setup)
   # Replace [YOUR-PASSWORD] with your actual Supabase database password
   DATABASE_URL=postgresql+psycopg2://postgres:Edulink1010#@db.stkxcgpvzjpkblihoshz.supabase.co:5432/postgres
   SESSION_SECRET_KEY=Edulink1010#
   CORS_ORIGINS=https://edulink.vercel.app
   ```
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

### Initialize Database

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
5. Add Environment Variable:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```
   (Use the backend URL from Step 2)
6. Click **Deploy** → Wait ~2 minutes
7. Copy your frontend URL (e.g., `https://edulink.vercel.app`)

### Update CORS

1. Go back to Render → Your backend service
2. Edit Environment Variables
3. Update `CORS_ORIGINS` with your Vercel URL
4. Save → Auto-redeploys

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
