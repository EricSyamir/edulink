import { AlertTriangle, ExternalLink } from 'lucide-react'

export default function ConfigError() {
  const apiUrl = import.meta.env.VITE_API_URL
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 p-4">
      <div className="max-w-2xl w-full card p-8">
        <div className="flex items-center gap-3 text-amber-600 mb-4">
          <AlertTriangle className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Configuration Required</h1>
        </div>
        
        <div className="space-y-4">
          <p className="text-surface-700">
            The frontend API URL is not configured. Please set the environment variable in Vercel.
          </p>
          
          <div className="bg-surface-100 rounded-lg p-4">
            <p className="text-sm font-medium text-surface-900 mb-2">Current Configuration:</p>
            <code className="text-sm text-surface-600">
              VITE_API_URL: {apiUrl || '(not set)'}
            </code>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">How to Fix:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>Go to your Vercel project dashboard</li>
              <li>Click on <strong>Settings</strong> → <strong>Environment Variables</strong></li>
              <li>Add a new variable:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li><strong>Key:</strong> <code>VITE_API_URL</code></li>
                  <li><strong>Value:</strong> Your Render backend URL (e.g., <code>https://edulink-api.onrender.com</code>)</li>
                </ul>
              </li>
              <li>Redeploy your frontend</li>
            </ol>
          </div>
          
          <div className="flex gap-3">
            <a
              href="https://vercel.com/docs/concepts/projects/environment-variables"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Vercel Docs
            </a>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
