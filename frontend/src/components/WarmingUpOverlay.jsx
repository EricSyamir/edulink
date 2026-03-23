import { useState, useEffect } from 'react'
import { healthApi } from '../services/api'
import { Loader2, Server, Zap } from 'lucide-react'

const POLL_INTERVAL_MS = 3000

/**
 * Full-screen overlay shown when the backend is warming up (face model loading).
 * Polls /api/health and displays feedback until the server is ready.
 */
export default function WarmingUpOverlay() {
  const [status, setStatus] = useState(null) // null = not checked yet, 'loading' | 'ready' | 'disabled' | 'error' | 'unreachable'
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    const API_URL = import.meta.env.VITE_API_URL

    const check = async () => {
      if (!API_URL) return // Skip if no API configured (dev without backend)
      try {
        const data = await healthApi.get()
        if (cancelled) return
        const faceStatus = data.face_model || data.face_recognition || 'unknown'
        setStatus(faceStatus === 'loading' ? 'loading' : 'ready')
        setMessage(data.message || '')
      } catch (err) {
        if (cancelled) return
        // Network error or timeout - server might still be starting
        setStatus('unreachable')
        setMessage('Connecting to server...')
      }
    }

    check()
    const id = setInterval(check, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  // Only show overlay when we know the server is warming up
  if (!status || status === 'ready' || status === 'disabled' || status === 'error') {
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-900/95 backdrop-blur-sm">
      <div className="max-w-md mx-auto p-8 text-center text-white animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary-500/20 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary-400 animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Server is starting up
        </h2>
        <p className="text-surface-300 text-sm leading-relaxed mb-6">
          {status === 'loading'
            ? 'Loading face recognition model... This may take up to a minute on first visit after the server was idle.'
            : 'Connecting to the server. Please wait a moment.'}
        </p>
        <div className="flex items-center justify-center gap-2 text-surface-400 text-xs">
          <Server className="w-4 h-4" />
          <span>EduLink BErCHAMPION</span>
          <Zap className="w-4 h-4 ml-2" />
        </div>
      </div>
    </div>
  )
}
