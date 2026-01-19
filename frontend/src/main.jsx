import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

// Log environment info for debugging
console.log('🚀 Edulink Frontend Starting...')
console.log('Environment:', {
  NODE_ENV: import.meta.env.MODE,
  API_URL: import.meta.env.VITE_API_URL || 'NOT SET - using relative paths',
  BASE_URL: window.location.origin,
})

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Check if root element exists
const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('❌ Root element not found! Check index.html')
  document.body.innerHTML = '<div style="padding: 20px; color: red;">Error: Root element not found. Check browser console.</div>'
} else {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <App />
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#18181b',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '12px 16px',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </QueryClientProvider>
        </ErrorBoundary>
      </React.StrictMode>,
    )
    console.log('✅ React app rendered successfully')
  } catch (error) {
    console.error('❌ Failed to render React app:', error)
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif;">
        <h1 style="color: red;">Failed to Load Application</h1>
        <p>Error: ${error.message}</p>
        <p>Check browser console for details.</p>
      </div>
    `
  }
}
