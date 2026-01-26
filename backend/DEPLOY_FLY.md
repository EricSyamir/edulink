# 🚀 Quick Fly.io Deployment Steps

## ⚠️ Step 0: Add Payment Info (Required)

1. Go to: https://fly.io/dashboard/eric-syamir/billing
2. Add a credit card (required for paid plans)
3. **Don't worry** - you'll only be charged $1.94/month, and Fly.io has free credits to start!

---

## Step 1: Create App (After Adding Payment)

Run this command in the `backend` directory:

```bash
flyctl apps create edulink-api
```

---

## Step 2: Set Environment Variables

Replace `YOUR_PASSWORD` and `REPLACE_WITH_GENERATED_KEY` with actual values:

```bash
# Generate session secret key first:
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Then set secrets (replace values):
flyctl secrets set DATABASE_URL="postgresql+psycopg2://postgres.stkxcgpvzjpkblihoshz:YOUR_PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"

flyctl secrets set SESSION_SECRET_KEY="PASTE_GENERATED_KEY_HERE"

flyctl secrets set CORS_ORIGINS="https://edulink-my.vercel.app"

flyctl secrets set DEBUG="False"

flyctl secrets set FACE_MODEL_NAME="buffalo_sc"

flyctl secrets set FACE_RECOGNITION_ENABLED="True"
```

---

## Step 3: Deploy

```bash
flyctl deploy
```

This will:
- Build Docker image
- Upload to Fly.io
- Deploy your app
- Show you the URL

---

## Step 4: Initialize Database

```bash
curl -X POST https://edulink-api.fly.dev/api/setup/init-database
```

---

## Step 5: Update Frontend

1. Go to Vercel → Your project → Settings → Environment Variables
2. Update `VITE_API_URL` to: `https://edulink-api.fly.dev`
3. Redeploy frontend

---

## ✅ Done!

Your app is now running on Fly.io with 1GB RAM!
