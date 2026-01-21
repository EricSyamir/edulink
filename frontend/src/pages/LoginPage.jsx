import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Building2, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !password) return
    
    setIsLoading(true)
    
    const result = await login(email, password)
    
    if (result.success) {
      navigate('/dashboard')
    }
    
    setIsLoading(false)
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
            {/* School Logo Placeholder */}
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-2xl shadow-primary-500/30 mb-6 overflow-hidden">
              {/* Replace with actual school logo image */}
              <Building2 className="w-12 h-12 text-white" />
            </div>
            <h1 className="font-display text-4xl font-bold text-white mb-1">EduLink</h1>
            <p className="text-primary-300 font-semibold text-lg">BErCHAMPION</p>
            <p className="text-primary-200 text-sm mt-2">Student Discipline Tracking System</p>
          </div>
          
          {/* Login card */}
          <div className="card p-8 animate-slide-up">
            <h2 className="text-2xl font-display font-bold text-surface-900 mb-2">Welcome back</h2>
            <p className="text-surface-500 mb-6">Sign in to your account</p>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-surface-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teacher@school.edu"
                    className="input pl-12"
                    required
                  />
                </div>
              </div>
              
              {/* Password field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-surface-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input pl-12 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="btn-primary w-full py-3.5 text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
            
            {/* Demo credentials hint */}
            <div className="mt-6 p-4 rounded-xl bg-surface-50 border border-surface-200">
              <p className="text-sm text-surface-600">
                <span className="font-medium">Demo account:</span>
                <br />
                Email: admin@edulink.com
                <br />
                Password: admin123
              </p>
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
