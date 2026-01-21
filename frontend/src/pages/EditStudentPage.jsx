import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Webcam from 'react-webcam'
import { studentApi } from '../services/api'
import { 
  ArrowLeft, 
  Camera, 
  RotateCcw, 
  Save, 
  Loader2,
  User,
  Hash,
  School,
  GraduationCap,
  CheckCircle2,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function EditStudentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const webcamRef = useRef(null)
  
  // Fetch student details
  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentApi.get(id),
  })
  
  // Form state
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    class_name: '',
    form: '',
  })
  
  // Face capture state
  const [showCamera, setShowCamera] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [facingMode, setFacingMode] = useState('user')
  const [updateFace, setUpdateFace] = useState(false)
  
  // Validation errors
  const [errors, setErrors] = useState({})
  
  // Populate form with existing data
  useEffect(() => {
    if (student) {
      setFormData({
        student_id: student.student_id || '',
        name: student.name || '',
        class_name: student.class_name || '',
        form: student.form?.toString() || '',
      })
    }
  }, [student])
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data) => studentApi.update(id, data),
    onSuccess: (data) => {
      toast.success(`Student ${data.name} updated successfully!`)
      queryClient.invalidateQueries(['students'])
      queryClient.invalidateQueries(['student', id])
      navigate(`/students/${id}`)
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update student')
    },
  })
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }
  
  // Validate form
  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.student_id.trim()) {
      newErrors.student_id = 'Student ID is required'
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    if (!formData.class_name.trim()) {
      newErrors.class_name = 'Class is required'
    }
    if (!formData.form) {
      newErrors.form = 'Form is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Capture photo
  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      setCapturedImage(imageSrc)
      setShowCamera(false)
      setUpdateFace(true)
    }
  }, [])
  
  // Remove captured photo
  const removePhoto = () => {
    setCapturedImage(null)
    setUpdateFace(false)
  }
  
  // Toggle camera facing mode
  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    const updateData = {
      ...formData,
      form: parseInt(formData.form),
    }
    
    // Only include face_image if we're updating it
    if (updateFace && capturedImage) {
      updateData.face_image = capturedImage
    }
    
    updateMutation.mutate(updateData)
  }
  
  if (studentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }
  
  if (!student) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-xl font-semibold text-surface-900">Student not found</h2>
        <p className="text-surface-500 mt-2">The requested student does not exist.</p>
        <Link to="/students" className="btn-primary mt-4 inline-flex">
          <ArrowLeft className="w-5 h-5" />
          Back to Students
        </Link>
      </div>
    )
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Back button */}
      <Link 
        to={`/students/${id}`}
        className="inline-flex items-center gap-2 text-surface-600 hover:text-surface-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Student
      </Link>
      
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-surface-900">Edit Student</h1>
        <p className="text-surface-500 mt-1">
          Update student information and face registration
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-lg text-surface-900">Basic Information</h2>
          
          {/* Student ID */}
          <div>
            <label htmlFor="student_id" className="block text-sm font-medium text-surface-700 mb-2">
              Student ID *
            </label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                id="student_id"
                name="student_id"
                type="text"
                value={formData.student_id}
                onChange={handleChange}
                placeholder="e.g., 2024001"
                className={clsx('input pl-12', errors.student_id && 'border-red-500 focus:ring-red-500')}
              />
            </div>
            {errors.student_id && (
              <p className="text-red-500 text-sm mt-1">{errors.student_id}</p>
            )}
          </div>
          
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-surface-700 mb-2">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Ahmad bin Abdullah"
                className={clsx('input pl-12', errors.name && 'border-red-500 focus:ring-red-500')}
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>
          
          {/* Class */}
          <div>
            <label htmlFor="class_name" className="block text-sm font-medium text-surface-700 mb-2">
              Class *
            </label>
            <div className="relative">
              <School className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                id="class_name"
                name="class_name"
                type="text"
                value={formData.class_name}
                onChange={handleChange}
                placeholder="e.g., 1 Amanah"
                className={clsx('input pl-12', errors.class_name && 'border-red-500 focus:ring-red-500')}
              />
            </div>
            {errors.class_name && (
              <p className="text-red-500 text-sm mt-1">{errors.class_name}</p>
            )}
          </div>
          
          {/* Form */}
          <div>
            <label htmlFor="form" className="block text-sm font-medium text-surface-700 mb-2">
              Form *
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <select
                id="form"
                name="form"
                value={formData.form}
                onChange={handleChange}
                className={clsx('input pl-12', errors.form && 'border-red-500 focus:ring-red-500')}
              >
                <option value="">Select form</option>
                {[1, 2, 3, 4, 5].map(form => (
                  <option key={form} value={form}>Form {form}</option>
                ))}
              </select>
            </div>
            {errors.form && (
              <p className="text-red-500 text-sm mt-1">{errors.form}</p>
            )}
          </div>
        </div>
        
        {/* Face Registration Card */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-lg text-surface-900">Face Registration</h2>
              <p className="text-sm text-surface-500">
                {student.has_face_embedding 
                  ? 'Face is already registered. Capture new photo to update.' 
                  : 'Optional - Capture student\'s face for identification'}
              </p>
            </div>
            {(capturedImage || student.has_face_embedding) && (
              <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                {capturedImage ? 'New face captured' : 'Face registered'}
              </span>
            )}
          </div>
          
          {showCamera ? (
            <div className="space-y-4">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-surface-900 relative">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  screenshotQuality={0.8}
                  videoConstraints={{
                    facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 960 },
                  }}
                  className="w-full h-full object-cover"
                />
                
                {/* Face guide overlay */}
                <div className="absolute inset-0 camera-overlay pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-52 border-2 border-white/50 rounded-[40%]" />
                </div>
                
                {/* Camera switch */}
                <button
                  type="button"
                  onClick={toggleCamera}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCamera(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="btn-primary flex-1"
                >
                  <Camera className="w-5 h-5" />
                  Capture
                </button>
              </div>
            </div>
          ) : capturedImage ? (
            <div className="space-y-4">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-surface-100 relative">
                <img
                  src={capturedImage}
                  alt="Captured face"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="btn-secondary w-full"
              >
                <RotateCcw className="w-5 h-5" />
                Retake Photo
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-surface-300 hover:border-primary-400 transition-colors flex flex-col items-center justify-center gap-3 text-surface-500 hover:text-primary-600"
            >
              <Camera className="w-12 h-12" />
              <span className="font-medium">
                {student.has_face_embedding ? 'Click to update face photo' : 'Click to capture face photo'}
              </span>
            </button>
          )}
        </div>
        
        {/* Submit Button */}
        <div className="flex gap-4">
          <Link to={`/students/${id}`} className="btn-secondary flex-1">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="btn-primary flex-1"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
