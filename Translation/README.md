# AI Translator Component

This directory contains the standalone frontend component for the AI Translation feature.

## Files

- `TranslationPage.jsx`: The main React component.

## Usage Guide

1. **Install Dependencies:**
   Make sure your React project has the following packages installed:
   ```bash
   npm install axios lucide-react react-hot-toast
   ```

## Backend Setup (Required)

The frontend needs a backend to perform the actual translation. I have provided a `backend_server.py` for you.

1. **Install Python Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Backend:**
   ```bash
   python backend_server.py
   ```
   The server will start at `http://localhost:8000`.

## Frontend Integration

1. **Copy Component:**
   - Copy `TranslationPage.jsx` into your project's `src/pages` directory.
   - Import and use it in your routing (e.g., `App.jsx`).

   ```jsx
   import TranslationPage from './pages/TranslationPage';
   
   // ... inside your routes
   <Route path="/translation" element={<TranslationPage />} />
   ```

3. **Configuration:**
   - The component tries to read the backend URL from `import.meta.env.VITE_API_URL`. 
   - Ensure your `.env` file has `VITE_API_URL=http://localhost:8000` (or your actual backend URL).
   - If not set, it defaults to `http://localhost:8000`.

## Features

- **Voice Input:** Uses the browser's Web Speech API.
- **Text Translation:** Sends requests to the `/translation/` endpoint.
- **Text-to-Speech:** Reads out the translated text using native browser synthesis.
