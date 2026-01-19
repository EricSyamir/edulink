import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50 p-4">
          <div className="max-w-2xl w-full card p-8">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="w-8 h-8" />
              <h1 className="text-2xl font-bold">Something went wrong</h1>
            </div>
            
            <p className="text-surface-700 mb-4">
              The application encountered an error. Check the browser console for details.
            </p>
            
            {this.state.error && (
              <div className="bg-surface-100 rounded-lg p-4 mb-4 overflow-auto">
                <p className="font-mono text-sm text-red-600">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-surface-600">
                      Stack trace
                    </summary>
                    <pre className="mt-2 text-xs text-surface-500 overflow-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              <RefreshCw className="w-5 h-5" />
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
