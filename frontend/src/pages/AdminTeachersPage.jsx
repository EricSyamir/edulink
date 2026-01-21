import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { teacherApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { 
  ArrowLeft,
  UserPlus, 
  Edit, 
  Trash2,
  Loader2,
  Users,
  ShieldCheck,
  Mail,
  Hash,
  User,
  Lock,
  Eye,
  EyeOff,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function AdminTeachersPage() {
  const { teacher: currentTeacher } = useAuth()
  const queryClient = useQueryClient()
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  
  // Form state
  const [formData, setFormData] = useState({
    teacher_id: '',
    name: '',
    email: '',
    password: '',
    is_admin: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  
  // Check if user is admin
  if (!currentTeacher?.is_admin) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <ShieldCheck className="w-16 h-16 text-surface-300 mx-auto" />
        <h2 className="text-xl font-semibold text-surface-900 mt-4">Access Denied</h2>
        <p className="text-surface-500 mt-2">You need admin privileges to access this page.</p>
        <Link to="/dashboard" className="btn-primary mt-4 inline-flex">
          Go to Dashboard
        </Link>
      </div>
    )
  }
  
  // Fetch teachers
  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teacherApi.list(),
  })
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: teacherApi.create,
    onSuccess: () => {
      toast.success('Teacher added successfully')
      queryClient.invalidateQueries(['teachers'])
      closeModal()
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create teacher')
    },
  })
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => teacherApi.update(id, data),
    onSuccess: () => {
      toast.success('Teacher updated successfully')
      queryClient.invalidateQueries(['teachers'])
      closeModal()
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update teacher')
    },
  })
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: teacherApi.delete,
    onSuccess: () => {
      toast.success('Teacher deleted successfully')
      queryClient.invalidateQueries(['teachers'])
      setShowDeleteConfirm(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete teacher')
    },
  })
  
  const openAddModal = () => {
    setFormData({
      teacher_id: '',
      name: '',
      email: '',
      password: '',
      is_admin: false,
    })
    setErrors({})
    setShowAddModal(true)
  }
  
  const openEditModal = (teacher) => {
    setFormData({
      teacher_id: teacher.teacher_id,
      name: teacher.name,
      email: teacher.email,
      password: '',
      is_admin: teacher.is_admin,
    })
    setErrors({})
    setEditingTeacher(teacher)
  }
  
  const closeModal = () => {
    setShowAddModal(false)
    setEditingTeacher(null)
    setFormData({
      teacher_id: '',
      name: '',
      email: '',
      password: '',
      is_admin: false,
    })
    setErrors({})
    setShowPassword(false)
  }
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }
  
  const validateForm = (isEdit = false) => {
    const newErrors = {}
    
    if (!formData.teacher_id.trim()) {
      newErrors.teacher_id = 'Teacher ID is required'
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    }
    if (!isEdit && !formData.password.trim()) {
      newErrors.password = 'Password is required'
    }
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    
    const isEdit = !!editingTeacher
    if (!validateForm(isEdit)) return
    
    if (isEdit) {
      const updateData = {
        teacher_id: formData.teacher_id,
        name: formData.name,
        email: formData.email,
        is_admin: formData.is_admin,
      }
      
      if (formData.password) {
        updateData.password = formData.password
      }
      
      updateMutation.mutate({ id: editingTeacher.id, data: updateData })
    } else {
      createMutation.mutate(formData)
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back button */}
      <Link 
        to="/admin" 
        className="inline-flex items-center gap-2 text-surface-600 hover:text-surface-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Admin
      </Link>
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-surface-900">Manage Teachers</h1>
          <p className="text-surface-500 mt-1">
            Add, edit, or remove teacher accounts
          </p>
        </div>
        
        <button onClick={openAddModal} className="btn-primary">
          <UserPlus className="w-5 h-5" />
          Add Teacher
        </button>
      </div>
      
      {/* Teachers List */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
            <p className="mt-2 text-surface-500">Loading teachers...</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-surface-300 mx-auto" />
            <p className="mt-2 text-surface-500">No teachers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-50 border-b border-surface-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-surface-600">Teacher</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-surface-600">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-surface-600">Role</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-surface-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          'w-10 h-10 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0',
                          teacher.is_admin 
                            ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                            : 'bg-gradient-to-br from-primary-400 to-primary-600'
                        )}>
                          {teacher.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-surface-900">{teacher.name}</p>
                          <p className="text-sm text-surface-500">{teacher.teacher_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-surface-700">{teacher.email}</td>
                    <td className="px-6 py-4">
                      {teacher.is_admin ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
                          <ShieldCheck className="w-3 h-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full bg-surface-100 text-surface-600 text-sm">
                          Teacher
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(teacher)}
                          className="p-2 rounded-lg hover:bg-surface-100 text-surface-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {teacher.id !== currentTeacher.id && (
                          <button
                            onClick={() => setShowDeleteConfirm(teacher)}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Add/Edit Modal */}
      {(showAddModal || editingTeacher) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-md w-full animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-surface-900">
                {editingTeacher ? 'Edit Teacher' : 'Add Teacher'}
              </h3>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-surface-100">
                <X className="w-5 h-5 text-surface-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Teacher ID */}
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">
                  Teacher ID *
                </label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    name="teacher_id"
                    type="text"
                    value={formData.teacher_id}
                    onChange={handleChange}
                    placeholder="e.g., T2024001"
                    className={clsx('input pl-12', errors.teacher_id && 'border-red-500')}
                  />
                </div>
                {errors.teacher_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.teacher_id}</p>
                )}
              </div>
              
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full name"
                    className={clsx('input pl-12', errors.name && 'border-red-500')}
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>
              
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@school.edu"
                    className={clsx('input pl-12', errors.email && 'border-red-500')}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
              
              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">
                  Password {editingTeacher ? '(leave blank to keep current)' : '*'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={clsx('input pl-12 pr-12', errors.password && 'border-red-500')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>
              
              {/* Admin checkbox */}
              <div className="flex items-center gap-3">
                <input
                  name="is_admin"
                  type="checkbox"
                  checked={formData.is_admin}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                <label className="text-sm font-medium text-surface-700">
                  Grant admin privileges
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : editingTeacher ? (
                    'Save Changes'
                  ) : (
                    'Add Teacher'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-md w-full animate-scale-in">
            <h3 className="text-xl font-semibold text-surface-900">Delete Teacher?</h3>
            <p className="text-surface-600 mt-2">
              Are you sure you want to delete <strong>{showDeleteConfirm.name}</strong>?
              This action cannot be undone.
            </p>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(showDeleteConfirm.id)}
                disabled={deleteMutation.isPending}
                className="btn-danger flex-1"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
