import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { teacherApi } from '../services/api'
import { 
  User,
  Lock,
  Mail,
  Hash,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function ProfilePage() {
  const { teacher: currentTeacher } = useAuth()
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  
  // Fetch current teacher info
  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teacher', 'me'],
    queryFn: () => teacherApi.me(),
    onSuccess: (data) => {
      setFormData({
        name: data.name || '',
        password: '',
        confirmPassword: '',
      })
    },
  })
  
  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: (data) => teacherApi.update('me', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teacher', 'me'])
      queryClient.invalidateQueries(['auth', 'me'])
      toast.success('Profile updated successfully!')
      setFormData({
        ...formData,
        password: '',
        confirmPassword: '',
      })
      setErrors({})
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Failed to update profile'
      toast.error(message)
    },
  })
  
  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    
    if (formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters'
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    const updateData = {
      name: formData.name.trim(),
    }
    
    // Only include password if it's being changed
    if (formData.password) {
      updateData.password = formData.password
    }
    
    updateMutation.mutate(updateData)
  }
  
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-surface-200 rounded w-48 mb-8"></div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="space-y-4">
              <div className="h-4 bg-surface-200 rounded w-3/4"></div>
              <div className="h-10 bg-surface-200 rounded"></div>
              <div className="h-4 bg-surface-200 rounded w-1/2"></div>
              <div className="h-10 bg-surface-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-surface-900 flex items-center gap-3">
          <User className="w-8 h-8 text-primary-600" />
          My Profile
        </h1>
        <p className="text-surface-500 mt-2">Update your profile information and password</p>
      </div>
      
      {/* Profile Form */}
      <div className="bg-white rounded-xl shadow-sm border border-surface-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Teacher ID (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">
              <Hash className="w-4 h-4 inline mr-1" />
              Teacher ID
            </label>
            <input
              type="text"
              value={teacher?.teacher_id || ''}
              disabled
              className="w-full px-4 py-2.5 border border-surface-300 rounded-lg bg-surface-50 text-surface-500 cursor-not-allowed"
            />
            <p className="text-xs text-surface-400 mt-1">Contact administrator to change</p>
          </div>
          
          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email
            </label>
            <input
              type="email"
              value={teacher?.email || ''}
              disabled
              className="w-full px-4 py-2.5 border border-surface-300 rounded-lg bg-surface-50 text-surface-500 cursor-not-allowed"
            />
            <p className="text-xs text-surface-400 mt-1">Contact administrator to change</p>
          </div>
          
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={clsx(
                "w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors",
                errors.name
                  ? "border-red-300 bg-red-50"
                  : "border-surface-300 bg-white"
              )}
              placeholder="Enter your full name"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.name}
              </p>
            )}
          </div>
          
          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">
              <Lock className="w-4 h-4 inline mr-1" />
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={clsx(
                  "w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors pr-12",
                  errors.password
                    ? "border-red-300 bg-red-50"
                    : "border-surface-300 bg-white"
                )}
                placeholder="Leave blank to keep current password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.password}
              </p>
            )}
            <p className="text-xs text-surface-400 mt-1">Minimum 6 characters</p>
          </div>
          
          {/* Confirm Password */}
          {formData.password && (
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={clsx(
                    "w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors pr-12",
                    errors.confirmPassword
                      ? "border-red-300 bg-red-50"
                      : "border-surface-300 bg-white"
                  )}
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          )}
          
          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-200">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {updateMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Note:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>You can update your name and password</li>
              <li>To change your email or teacher ID, please contact an administrator</li>
              <li>After changing your password, you'll need to log in again</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
