import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Mail, Search, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

// Logo display component with fallback
function LogoDisplay() {
  const [shieldError, setShieldError] = useState(false)
  const [circleError, setCircleError] = useState(false)
  
  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      {/* SMK Bercham Shield Logo */}
      <div className="w-24 h-24 rounded-2xl bg-white shadow-2xl shadow-primary-500/30 overflow-hidden p-2 flex items-center justify-center">
        {!shieldError ? (
          <img 
            src="/logo-shield.png" 
            alt="SMK Bercham Shield Logo"
            className="w-full h-full object-contain"
            onError={() => setShieldError(true)}
          />
        ) : (
          <Building2 className="w-12 h-12 text-primary-600" />
        )}
      </div>
      {/* Circular Logo with Book and Star */}
      <div className="w-24 h-24 rounded-full bg-white shadow-2xl shadow-primary-500/30 overflow-hidden p-2 flex items-center justify-center">
        {!circleError ? (
          <img 
            src="/logo-circle.png" 
            alt="SMK Bercham Circular Logo"
            className="w-full h-full object-contain"
            onError={() => setCircleError(true)}
          />
        ) : (
          <Building2 className="w-12 h-12 text-primary-600" />
        )}
      </div>
    </div>
  )
}

export default function FindEmailPage() {
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [foundEmail, setFoundEmail] = useState(null)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!fullName || fullName.trim().length < 3) {
      toast.error('Please enter your full name (at least 3 characters)')
      return
    }
    
    setIsLoading(true)
    setFoundEmail(null)
    
    try {
      const response = await api.get('/api/teachers/find-by-name', {
        params: { name: fullName.trim() }
      })
      
      if (response.data && response.data.email) {
        setFoundEmail(response.data.email)
        toast.success('Email found!')
      } else {
        toast.error('No teacher found with that name. Please check your spelling.')
      }
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to search for teacher'
      toast.error(message)
      setFoundEmail(null)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/5 rounded-full blur-3xl" />
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo and title */}
          <div className="text-center mb-8 animate-fade-in">
            {/* School Logos */}
            <LogoDisplay />
            <h1 className="font-display text-4xl font-bold text-white mb-1">EduLink</h1>
            <p className="text-primary-300 font-semibold text-lg">BErCHAMPION</p>
            <p className="text-primary-200 text-sm mt-2">SMK Bercham - Find Your Email</p>
          </div>
          
          {/* Find email card */}
          <div className="card p-8 animate-slide-up">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-surface-600 hover:text-primary-600 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Login</span>
            </Link>
            
            <h2 className="text-2xl font-display font-bold text-surface-900 mb-2">Find Your Email</h2>
            <p className="text-surface-500 mb-6">
              Enter your full name to retrieve your login email address
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name field */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-surface-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name as registered"
                    className="input pl-12"
                    required
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-surface-400 mt-1">
                  Enter your name exactly as it appears in the system
                </p>
              </div>
              
              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading || !fullName.trim()}
                className="btn-primary w-full py-3.5 text-base"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Find My Email
                  </>
                )}
              </button>
            </form>
            
            {/* Result display */}
            {foundEmail && (
              <div className="mt-6 p-5 rounded-xl bg-green-50 border-2 border-green-200 animate-fade-in">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900 mb-2">Email Found!</h3>
                    <div className="bg-white rounded-lg p-4 border border-green-200 mb-3">
                      <p className="text-sm text-surface-600 mb-1">Your login email:</p>
                      <p className="text-lg font-mono font-semibold text-green-700 break-all">
                        {foundEmail}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <span className="font-semibold">Default Password:</span> admin123
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Please change your password after first login
                      </p>
                    </div>
                    <Link
                      to="/login"
                      className="mt-4 inline-block w-full text-center btn-primary py-2.5"
                    >
                      Go to Login
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            {/* Info box */}
            <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Note:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Enter your full name exactly as registered</li>
                    <li>Default password is: <strong>admin123</strong></li>
                    <li>Change your password after first login</li>
                    <li>If you can't find your email, contact administrator</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="relative z-10 text-center py-4 text-primary-300 text-sm">
        © 2024 EduLink BErCHAMPION. All rights reserved.
      </footer>
    </div>
  )
}
