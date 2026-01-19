import axios from 'axios'

/**
 * Axios instance configured for the Edulink API
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 30000, // 30 seconds for face recognition
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('edulink_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data on unauthorized
      localStorage.removeItem('edulink_token')
      localStorage.removeItem('edulink_teacher')
      window.location.href = '/login'
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
    const response = await api.post('/api/students', data)
    return response.data
  },
  
  /**
   * Update an existing student
   */
  update: async (id, data) => {
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
    const response = await api.post('/api/students/identify', { face_image: faceImage })
    return response.data
  },
}

// ============================================
// Discipline API functions
// ============================================

export const disciplineApi = {
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
   * Create a new discipline record (reward or punishment)
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
   * Get a single teacher by ID
   */
  get: async (id) => {
    const response = await api.get(`/api/teachers/${id}`)
    return response.data
  },
  
  /**
   * Create a new teacher
   */
  create: async (data) => {
    const response = await api.post('/api/teachers', data)
    return response.data
  },
  
  /**
   * Update an existing teacher
   */
  update: async (id, data) => {
    const response = await api.put(`/api/teachers/${id}`, data)
    return response.data
  },
  
  /**
   * Delete a teacher
   */
  delete: async (id) => {
    await api.delete(`/api/teachers/${id}`)
  },
}
