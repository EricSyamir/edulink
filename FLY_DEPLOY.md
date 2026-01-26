# 🚀 Fly.io Deployment Guide

Fly.io offers **1GB RAM for $1.94/month** - perfect for running face recognition models!

## Why Fly.io?

- ✅ **1GB RAM** (vs 512MB on Render free tier)
- ✅ **Cheaper** than upgrading Render ($1.94/month vs $7+/month)
- ✅ **Better performance** - more memory = faster face recognition
- ✅ **Easy deployment** - similar to Render

---

## Step 1: Install Fly CLI (2 minutes)

### Windows (PowerShell):
```powershell
# Download and install Fly CLI
iwr https://fly.io/install.ps1 -useb | iex
```

### Mac/Linux:
```bash
curl -L https://fly.io/install.sh | sh
```

### Verify Installation:
```bash
fly version
```

---

## Step 2: Sign Up & Login (1 minute)

1. Go to https://fly.io → Sign up (free account)
2. Login via CLI:
   ```bash
   fly auth login
   ```
   This will open your browser to authenticate.

---

## Step 3: Create Fly.io App (1 minute)

Navigate to your backend directory:
```bash
cd backend
```

Initialize Fly.io app:
```bash
fly launch
```

**When prompted:**
- **App name**: `edulink-api` (or choose your own)
- **Region**: Choose closest to you (e.g., `iad` for US East, `sin` for Singapore)
- **PostgreSQL**: **No** (we're using Supabase)
- **Redis**: **No**
- **Deploy now**: **No** (we'll configure first)

---

## Step 4: Configure fly.toml

A `fly.toml` file was created. Update it:

```toml
app = "edulink-api"
primary_region = "iad"  # Change to your region

[build]
  dockerfile = "Dockerfile"

[env]
  PYTHON_VERSION = "3.12.7"
  PYTHONPATH = "/app"

[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[vm]]
  memory_mb = 1024  # 1GB RAM - enough for face recognition!
  cpu_kind = "shared"
  cpus = 1
```

---

## Step 5: Create Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.12.7-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Step 6: Set Environment Variables

Set secrets in Fly.io:

```bash
fly secrets set DATABASE_URL="postgresql+psycopg2://postgres.stkxcgpvzjpkblihoshz:YOUR_PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"

fly secrets set SESSION_SECRET_KEY="your-super-secret-key-here"

fly secrets set CORS_ORIGINS="https://edulink-my.vercel.app"

fly secrets set DEBUG="False"

fly secrets set FACE_MODEL_NAME="buffalo_sc"

fly secrets set FACE_RECOGNITION_ENABLED="True"
```

**Generate SESSION_SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Step 7: Deploy!

```bash
fly deploy
```

This will:
1. Build Docker image
2. Upload to Fly.io
3. Deploy your app
4. Show you the URL (e.g., `https://edulink-api.fly.dev`)

---

## Step 8: Initialize Database

Once deployed, initialize the database:

```bash
curl -X POST https://edulink-api.fly.dev/api/setup/init-database
```

Or visit in browser:
```
https://edulink-api.fly.dev/api/setup/init-database
```

---

## Step 9: Update Frontend

Update Vercel environment variable:

1. Go to Vercel → Your project → Settings → Environment Variables
2. Update `VITE_API_URL` to your Fly.io URL:
   ```
   VITE_API_URL=https://edulink-api.fly.dev
   ```
3. Redeploy frontend

---

## Step 10: Update CORS (if needed)

If you get CORS errors, update CORS_ORIGINS:

```bash
fly secrets set CORS_ORIGINS="https://edulink-my.vercel.app"
```

Then restart:
```bash
fly apps restart edulink-api
```

---

## Useful Fly.io Commands

```bash
# View logs
fly logs

# Check app status
fly status

# SSH into your app
fly ssh console

# View secrets
fly secrets list

# Scale up/down
fly scale count 1

# Restart app
fly apps restart edulink-api
```

---

## Cost Breakdown

| Service | Plan | Cost |
|---------|------|------|
| Fly.io | 1GB RAM | $1.94/month |
| Vercel | Free tier | $0/month |
| Supabase | Free tier | $0/month |
| **Total** | | **$1.94/month** |

vs Render upgrade: **$7+/month** 💰

---

## Troubleshooting

### App won't start?
```bash
fly logs  # Check logs
fly status  # Check status
```

### Out of memory?
- Already set to 1GB (1024MB) - should be enough!
- If still issues, scale up: `fly scale vm shared-cpu-2x --memory 2048`

### Database connection issues?
- Verify `DATABASE_URL` is correct
- Use Supabase Transaction pooler (port 6543)

### CORS errors?
- Check `CORS_ORIGINS` matches your Vercel URL exactly
- Restart app: `fly apps restart edulink-api`

---

## Migration from Render

1. **Keep Render running** until Fly.io is confirmed working
2. Deploy to Fly.io (follow steps above)
3. Test everything works
4. Update frontend `VITE_API_URL` to Fly.io
5. Delete Render service (optional)

---

## ✅ You're Done!

Your app is now running on Fly.io with:
- ✅ 1GB RAM (enough for face recognition)
- ✅ Better performance
- ✅ Lower cost than Render upgrade
- ✅ Same features, better reliability

**Your URLs:**
- Backend: `https://edulink-api.fly.dev`
- Frontend: `https://edulink-my.vercel.app`
- API Docs: `https://edulink-api.fly.dev/api/docs`
