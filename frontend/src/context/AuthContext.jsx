import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

const TEACHER_KEY = 'edulink_teacher'

export function AuthProvider({ children }) {
  const [teacher, setTeacher] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()
  
  // Authentication disabled - always authenticated
  useEffect(() => {
    console.log('🔐 Authentication disabled - auto-logging in...')
    // Set a dummy teacher object to simulate being logged in
    setTeacher({
      id: 1,
      teacher_id: 'T000001',
      name: 'Public User',
      email: 'public@edulink.com'
    })
    setIsLoading(false)
    console.log('🔐 Auth initialization complete (no auth required)')
  }, [])
  
  /**
   * Login with email and password
   */
  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password })
      const { teacher: teacherData } = response.data
      
      // Store teacher data in localStorage for quick access (session is in cookie)
      localStorage.setItem(TEACHER_KEY, JSON.stringify(teacherData))
      
      setTeacher(teacherData)
      toast.success(`Welcome back, ${teacherData.name}!`)
      
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed. Please try again.'
      toast.error(message)
      return { success: false, error: message }
    }
  }, [])
  
  /**
   * Logout and clear all auth data
   */
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to clear server-side session
      await api.post('/api/auth/logout')
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error)
    }
    
    // Clear local storage
    localStorage.removeItem(TEACHER_KEY)
    setTeacher(null)
    
    // Clear all cached queries
    queryClient.clear()
    
    toast.success('Logged out successfully')
  }, [queryClient])
  
  const value = {
    teacher,
    isAuthenticated: !!teacher,
    isLoading,
    login,
    logout,
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
