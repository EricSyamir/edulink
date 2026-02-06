# EduLink AI Translator

A standalone web application for instant translation with voice support. Built with React, Vite, and Tailwind CSS, styled to match the EduLink frontend.

## Features

- 🌍 **Multi-language Support** - Translate between Malay, English, Mandarin, and Tamil
- 🎤 **Voice Input** - Use your microphone to speak and translate
- 🔊 **Text-to-Speech** - Listen to translations in the target language
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🎨 **Modern UI** - Beautiful interface matching EduLink's design system

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling with custom EduLink theme
- **Axios** - HTTP client
- **React Hot Toast** - Toast notifications
- **Lucide React** - Icon library
- **Web Speech API** - Voice recognition and text-to-speech

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Translation backend API (see backend setup)

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set `VITE_API_URL` to your translation backend URL:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

4. **Build for production:**
   ```bash
   npm run build
   ```

   The built files will be in the `dist/` directory.

## Deployment to Fly.io

### Prerequisites

1. Install [Fly CLI](https://fly.io/docs/getting-started/installing-flyctl/)
2. Sign up for a [Fly.io account](https://fly.io/app/sign-up)
3. Login: `fly auth login`

### Deploy Steps

1. **Initialize Fly.io app (if not already done):**
   ```bash
   fly launch
   ```
   
   When prompted:
   - Choose an app name (or use the one in `fly.toml`)
   - Select a region (e.g., `sin` for Singapore)
   - Don't deploy yet (we'll do that after configuration)

2. **Set environment variables:**
   ```bash
   fly secrets set VITE_API_URL=https://your-backend.fly.dev
   ```
   
   Replace `https://your-backend.fly.dev` with your actual translation backend URL.

3. **Deploy:**
   ```bash
   fly deploy
   ```

4. **Set up subdomain (optional):**
   
   To use a subdomain like `translate.yourdomain.com`:
   
   ```bash
   # Add a CNAME record in your DNS:
   # translate.yourdomain.com -> edulink-translation.fly.dev
   
   # Then configure Fly.io to handle the domain:
   fly certs add translate.yourdomain.com
   ```

### Environment Variables

Set these in Fly.io using `fly secrets set`:

- `VITE_API_URL` - Your translation backend API URL (required)

**Note:** Since Vite environment variables are embedded at build time, you'll need to rebuild and redeploy if you change `VITE_API_URL`. For production, consider using a runtime configuration approach.

### Alternative: Runtime Configuration

If you need to change the API URL without rebuilding, you can use a runtime config approach:

1. Create a `public/config.js` file that gets loaded at runtime
2. Update the app to read from `window.APP_CONFIG.API_URL`
3. Set the config via environment variables in Fly.io

## Project Structure

```
translation-app/
├── src/
│   ├── components/
│   │   └── TranslationPage.jsx  # Main translation component
│   ├── App.jsx                   # Root component
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Global styles
├── public/                       # Static assets
├── index.html                    # HTML template
├── package.json                  # Dependencies
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # Tailwind configuration
├── Dockerfile                    # Docker build file
├── nginx.conf                    # Nginx configuration
├── fly.toml                      # Fly.io configuration
└── README.md                     # This file
```

## API Integration

The app expects a translation API endpoint at `${VITE_API_URL}/translation/` that accepts:

**Request:**
```json
{
  "text": "Hello, how are you?",
  "source_lang": "auto",
  "target_lang": "ms"
}
```

**Response:**
```json
{
  "translated_text": "Halo, apa khabar?",
  "original_text": "Hello, how are you?",
  "src_lang": "en",
  "tgt_lang": "ms"
}
```

## Browser Support

- Chrome/Edge (recommended) - Full support including voice input
- Firefox - Full support
- Safari - Limited voice input support
- Mobile browsers - Full support

## Troubleshooting

### Voice input not working
- Ensure you're using HTTPS (required for microphone access)
- Check browser permissions for microphone access
- Some browsers may require user interaction before accessing microphone

### Translation API errors
- Verify `VITE_API_URL` is set correctly
- Check CORS settings on your backend
- Ensure the backend is running and accessible

### Build errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

## License

Part of the EduLink project.
