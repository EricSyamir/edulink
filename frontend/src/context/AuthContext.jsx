import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

const TOKEN_KEY = 'edulink_token'
const TEACHER_KEY = 'edulink_teacher'

export function AuthProvider({ children }) {
  const [teacher, setTeacher] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()
  
  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY)
      const savedTeacher = localStorage.getItem(TEACHER_KEY)
      
      if (token && savedTeacher) {
        try {
          // Verify token is still valid
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          const response = await api.get('/api/auth/me')
          setTeacher(response.data)
        } catch (error) {
          // Token invalid, clear storage
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(TEACHER_KEY)
          delete api.defaults.headers.common['Authorization']
        }
      }
      
      setIsLoading(false)
    }
    
    initAuth()
  }, [])
  
  /**
   * Login with email and password
   */
  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password })
      const { access_token, teacher: teacherData } = response.data
      
      // Store token and teacher data
      localStorage.setItem(TOKEN_KEY, access_token)
      localStorage.setItem(TEACHER_KEY, JSON.stringify(teacherData))
      
      // Set default auth header
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      
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
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TEACHER_KEY)
    delete api.defaults.headers.common['Authorization']
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
