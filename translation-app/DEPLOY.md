# Deployment Guide - Translation App to Fly.io

This guide will help you deploy the EduLink Translation App to Fly.io on a subdomain.

## Prerequisites

1. **Fly.io Account**: Sign up at [fly.io](https://fly.io/app/sign-up)
2. **Fly CLI**: Install from [fly.io/docs/getting-started/installing-flyctl/](https://fly.io/docs/getting-started/installing-flyctl/)
3. **Translation Backend**: Your translation API should be deployed and accessible

## Step 1: Login to Fly.io

```bash
fly auth login
```

## Step 2: Navigate to Translation App Directory

```bash
cd translation-app
```

## Step 3: Initialize Fly.io App

```bash
fly launch
```

When prompted:
- **App name**: Choose a name (e.g., `edulink-translation`) or press Enter to use the default from `fly.toml`
- **Region**: Choose a region close to your users (e.g., `sin` for Singapore)
- **Postgres/Redis**: Say "no" (we don't need a database)
- **Deploy now**: Say "no" (we'll deploy after setting secrets)

## Step 4: Set Environment Variables

Set your translation backend API URL:

```bash
fly secrets set VITE_API_URL=https://your-backend.fly.dev
```

**Important**: Replace `https://your-backend.fly.dev` with your actual translation backend URL.

**Note**: Since Vite embeds environment variables at build time, you need to rebuild if you change this. See "Runtime Configuration" section below for an alternative approach.

## Step 5: Deploy

```bash
fly deploy
```

This will:
1. Build the Docker image
2. Push it to Fly.io
3. Deploy the app

## Step 6: Set Up Subdomain

### Option A: Using Fly.io's Default Domain

Your app will be available at: `https://edulink-translation.fly.dev`

### Option B: Custom Subdomain

1. **Add your domain to Fly.io:**
   ```bash
   fly certs add translate.yourdomain.com
   ```

2. **Update DNS:**
   Add a CNAME record in your DNS provider:
   ```
   translate.yourdomain.com -> edulink-translation.fly.dev
   ```

3. **Wait for SSL certificate** (usually takes a few minutes):
   ```bash
   fly certs show translate.yourdomain.com
   ```

## Step 7: Verify Deployment

1. Visit your app URL (either `https://edulink-translation.fly.dev` or your custom subdomain)
2. Test the translation functionality
3. Check logs if needed:
   ```bash
   fly logs
   ```

## Updating the App

To update the app after making changes:

```bash
# Make your code changes
# Then deploy:
fly deploy
```

## Changing API URL

If you need to change the API URL:

```bash
# Set new URL
fly secrets set VITE_API_URL=https://new-backend-url.com

# Redeploy (this rebuilds with the new URL)
fly deploy
```

## Runtime Configuration (Alternative Approach)

If you need to change the API URL without rebuilding, you can use a runtime configuration approach:

1. **Create `public/config.js`:**
   ```javascript
   window.APP_CONFIG = {
     API_URL: 'https://your-backend.fly.dev'
   };
   ```

2. **Update `index.html` to load config:**
   ```html
   <script src="/config.js"></script>
   ```

3. **Update `TranslationPage.jsx` to use runtime config:**
   ```javascript
   const API_URL = window.APP_CONFIG?.API_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000';
   ```

4. **Set config via Fly.io secrets and create config.js at runtime** (requires a custom entrypoint script)

## Monitoring

- **View logs**: `fly logs`
- **Check app status**: `fly status`
- **View metrics**: `fly metrics`
- **SSH into app**: `fly ssh console`

## Troubleshooting

### Build fails
- Check Dockerfile syntax
- Verify all files are present
- Check `fly logs` for build errors

### App doesn't load
- Check `fly status` to see if app is running
- Check `fly logs` for runtime errors
- Verify environment variables are set: `fly secrets list`

### CORS errors
- Ensure your backend allows requests from your Fly.io domain
- Check backend CORS configuration

### API connection fails
- Verify `VITE_API_URL` is set correctly: `fly secrets list`
- Test backend URL directly
- Check backend logs

## Scaling

The app is configured for minimal resources (256MB RAM). To scale:

```bash
# Scale vertically (more RAM/CPU)
fly scale vm shared-cpu-2x --memory 512

# Scale horizontally (more instances)
fly scale count 2
```

## Cost Estimation

- **Free tier**: 3 shared-cpu-1x VMs with 256MB RAM
- **Paid**: ~$1.94/month per 256MB VM (shared CPU)

For a simple static site, the free tier should be sufficient.

## Additional Resources

- [Fly.io Documentation](https://fly.io/docs/)
- [Fly.io Pricing](https://fly.io/docs/about/pricing/)
- [Docker Documentation](https://docs.docker.com/)
