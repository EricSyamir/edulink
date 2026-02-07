import axios from 'axios'

/**
 * Axios instance configured for the EduLink BErCHAMPION API
 */
const API_URL = import.meta.env.VITE_API_URL || ''

// Log API configuration for debugging
console.log('📡 API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  Using: API_URL || 'Empty - will use relative paths',
  CurrentOrigin: window.location.origin,
})

if (!API_URL) {
  console.warn('⚠️ VITE_API_URL is not set! API calls will use relative paths.')
  console.warn('Set VITE_API_URL in Vercel environment variables to your backend URL')
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds for face recognition
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // No cookies/sessions needed
})

// Request interceptor - add Authorization header from localStorage
api.interceptors.request.use(
  (config) => {
    // Get teacher ID from localStorage and add to Authorization header
    const teacherData = localStorage.getItem('edulink_teacher')
    if (teacherData) {
      try {
        const teacher = JSON.parse(teacherData)
        if (teacher.id) {
          config.headers.Authorization = String(teacher.id)
        }
      } catch (e) {
        // Invalid JSON, ignore
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data on unauthorized
      localStorage.removeItem('edulink_teacher')
      
      // Don't redirect if:
      // 1. We're already on the login page (prevents infinite redirect loop)
      // 2. The request was to /api/auth/me (this is expected to fail when not logged in)
      const isLoginPage = window.location.pathname === '/login'
      const isAuthCheck = error.config?.url?.includes('/api/auth/me')
      
      if (!isLoginPage && !isAuthCheck) {
        // Only redirect if we're not on login page and it's not an auth check
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ============================================
// Student API functions
// ============================================

export const studentApi = {
  /**
   * List all students with optional filters
   */
  list: async (params = {}) => {
    const response = await api.get('/api/students', { params })
    return response.data
  },
  
  /**
   * Get list of all classes
   */
  getClasses: async (form = null) => {
    const params = form ? { form } : {}
    const response = await api.get('/api/students/classes', { params })
    return response.data
  },
  
  /**
   * Get a single student by ID
   */
  get: async (id) => {
    const response = await api.get(`/api/students/${id}`)
    return response.data
  },
  
  /**
   * Create a new student
   */
  create: async (data) => {
    if (data.face_image) {
      const t0 = performance.now()
      console.log('[FACE] Creating student with face_image', {
        endpoint: 'POST /api/students',
        faceBase64Len: data.face_image?.length ?? 0,
        timestamp: new Date().toISOString(),
      })
      const response = await api.post('/api/students', data)
      console.log('[FACE] Create response', { durationMs: Math.round(performance.now() - t0), status: response.status })
      return response.data
    }
    const response = await api.post('/api/students', data)
    return response.data
  },
  
  /**
   * Update an existing student
   */
  update: async (id, data) => {
    if (data.face_image) {
      const t0 = performance.now()
      console.log('[FACE] Updating student with face_image', {
        endpoint: `PUT /api/students/${id}`,
        faceBase64Len: data.face_image?.length ?? 0,
        timestamp: new Date().toISOString(),
      })
      const response = await api.put(`/api/students/${id}`, data)
      console.log('[FACE] Update response', { durationMs: Math.round(performance.now() - t0), status: response.status })
      return response.data
    }
    const response = await api.put(`/api/students/${id}`, data)
    return response.data
  },
  
  /**
   * Delete a student
   */
  delete: async (id) => {
    await api.delete(`/api/students/${id}`)
  },
  
  /**
   * Identify a student by face image
   */
  identify: async (faceImage) => {
    const t0 = performance.now()
    console.log('[FACE] Identifying student', {
      endpoint: 'POST /api/students/identify',
      faceBase64Len: faceImage?.length ?? 0,
      timestamp: new Date().toISOString(),
    })
    const response = await api.post('/api/students/identify', { face_image: faceImage })
    console.log('[FACE] Identify response', {
      durationMs: Math.round(performance.now() - t0),
      status: response.status,
      matched: response.data?.matched,
    })
    return response.data
  },
  
  /**
   * Promote students from one form to another (Admin only)
   */
  promote: async (fromForm, toForm) => {
    const response = await api.post('/api/students/promote', { from_form: fromForm, to_form: toForm })
    return response.data
  },
  
  /**
   * Import students from CSV file (Admin only)
   */
  importCSV: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/api/students/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}

// ============================================
// Discipline API functions
// ============================================

export const disciplineApi = {
  /**
   * Get misconduct types
   */
  getTypes: async () => {
    const response = await api.get('/api/discipline-records/types')
    return response.data
  },
  
  /**
   * List discipline records with optional filters
   */
  list: async (params = {}) => {
    const response = await api.get('/api/discipline-records', { params })
    return response.data
  },
  
  /**
   * Get discipline history for a specific student
   */
  getStudentHistory: async (studentId, params = {}) => {
    const response = await api.get(`/api/discipline-records/student/${studentId}`, { params })
    return response.data
  },
  
  /**
   * Create a new discipline record (misconduct)
   */
  create: async (data) => {
    const response = await api.post('/api/discipline-records', data)
    return response.data
  },
  
  /**
   * Delete a discipline record
   */
  delete: async (id) => {
    await api.delete(`/api/discipline-records/${id}`)
  },
  
  /**
   * Get form statistics
   */
  getFormStats: async () => {
    const response = await api.get('/api/discipline-records/forms/stats')
    return response.data
  },
  
  /**
   * Get single form statistics
   */
  getSingleFormStats: async (form) => {
    const response = await api.get(`/api/discipline-records/forms/${form}/stats`)
    return response.data
  },
  
  /**
   * Get all classes statistics
   */
  getClassesStats: async (form = null) => {
    const params = form ? { form } : {}
    const response = await api.get('/api/discipline-records/classes/stats', { params })
    return response.data
  },
  
  /**
   * Get single class statistics
   */
  getSingleClassStats: async (className) => {
    const response = await api.get(`/api/discipline-records/classes/${encodeURIComponent(className)}/stats`)
    return response.data
  },
  
  /**
   * Get dashboard analytics
   */
  getAnalytics: async (days = 30) => {
    const response = await api.get('/api/discipline-records/analytics', { params: { days } })
    return response.data
  },
}

// ============================================
// Teacher API functions
// ============================================

export const teacherApi = {
  /**
   * List all teachers
   */
  list: async (params = {}) => {
    const response = await api.get('/api/teachers', { params })
    return response.data
  },
  
  /**
   * Get current teacher info
   */
  me: async () => {
    const response = await api.get('/api/teachers/me')
    return response.data
  },
  
  /**
   * Get a single teacher by ID
   */
  get: async (id) => {
    const response = await api.get(`/api/teachers/${id}`)
    return response.data
  },
  
  /**
   * Create a new teacher (Admin only)
   */
  create: async (data) => {
    const response = await api.post('/api/teachers', data)
    return response.data
  },
  
  /**
   * Update an existing teacher (Admin only)
   * Or update own profile if id is 'me'
   */
  update: async (id, data) => {
    const response = await api.put(`/api/teachers/${id}`, data)
    return response.data
  },
  
  /**
   * Delete a teacher (Admin only)
   */
  delete: async (id) => {
    await api.delete(`/api/teachers/${id}`)
  },
}
