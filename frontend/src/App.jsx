import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ScanPage from './pages/ScanPage'
import StudentDetailPage from './pages/StudentDetailPage'
import StudentsPage from './pages/StudentsPage'
import AddStudentPage from './pages/AddStudentPage'
import ConfigError from './components/ConfigError'

/**
 * Protected route wrapper - authentication disabled, always allows access
 */
function ProtectedRoute({ children }) {
  // Authentication disabled - always allow access
  return children
}

/**
 * Public route wrapper - authentication disabled, always allows access
 */
function PublicRoute({ children }) {
  // Authentication disabled - always allow access
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      
      {/* Protected routes with layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="scan" element={<ScanPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/add" element={<AddStudentPage />} />
        <Route path="students/:id" element={<StudentDetailPage />} />
      </Route>
      
      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  console.log('📱 App component rendering...')
  
  // Check if API URL is configured (only warn in production)
  const apiUrl = import.meta.env.VITE_API_URL
  const isProduction = import.meta.env.PROD
  
  // In production, show error if API URL is not set
  if (isProduction && !apiUrl) {
    console.error('❌ VITE_API_URL is not set in production!')
    return <ConfigError />
  }
  
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
