import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Webcam from 'react-webcam'
import { studentApi, disciplineApi } from '../services/api'
import { 
  Camera, 
  RotateCcw, 
  AlertCircle,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  User
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import MisconductBadge from '../components/MisconductBadge'
import { resizeImageForFaceDetection } from '../utils/imageResize'

export default function ScanPage() {
  const navigate = useNavigate()
  const webcamRef = useRef(null)
  const queryClient = useQueryClient()
  
  const [capturedImage, setCapturedImage] = useState(null)
  const [identifiedStudent, setIdentifiedStudent] = useState(null)
  const [matchConfidence, setMatchConfidence] = useState(null)
  const [severity, setSeverity] = useState('')
  const [misconductType, setMisconductType] = useState('')
  const [notes, setNotes] = useState('')
  const [facingMode, setFacingMode] = useState('user') // 'user' for front, 'environment' for back
  
  // Fetch misconduct types
  const { data: misconductTypes } = useQuery({
    queryKey: ['misconduct-types'],
    queryFn: () => disciplineApi.getTypes(),
    staleTime: Infinity, // These don't change
  })
  
  // Face identification mutation
  const identifyMutation = useMutation({
    mutationFn: studentApi.identify,
    onSuccess: (data) => {
      if (data.matched) {
        setIdentifiedStudent(data.student)
        setMatchConfidence(data.match_confidence)
        toast.success(`Student identified: ${data.student.name}`)
      } else {
        toast.error(data.message)
        setIdentifiedStudent(null)
        setMatchConfidence(null)
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to identify student')
      setIdentifiedStudent(null)
    },
  })
  
  // Discipline record mutation
  const disciplineMutation = useMutation({
    mutationFn: disciplineApi.create,
    onSuccess: (data) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries(['students'])
      queryClient.invalidateQueries(['analytics'])
      queryClient.invalidateQueries(['student', identifiedStudent.id])
      
      toast.success(
        `${data.severity === 'light' ? 'Light' : 'Medium'} misconduct recorded: ${data.misconduct_type}`,
        {
          duration: 2000,
        }
      )
      
      // Navigate to student profile page after a short delay
      setTimeout(() => {
        navigate(`/students/${identifiedStudent.id}`)
      }, 500)
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to record misconduct')
    },
  })
  
  // Reset misconduct type when severity changes
  useEffect(() => {
    setMisconductType('')
  }, [severity])
  
  // Capture image from webcam (resized for faster upload & face detection)
  const captureImage = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      setIdentifiedStudent(null)
      setMatchConfidence(null)
      setSeverity('')
      setMisconductType('')
      setNotes('')
      try {
        const resized = await resizeImageForFaceDetection(imageSrc, 640, 0.7)
        setCapturedImage(resized)
        identifyMutation.mutate(resized)
      } catch {
        setCapturedImage(imageSrc)
        identifyMutation.mutate(imageSrc)
      }
    }
  }, [identifyMutation])
  
  // Reset to camera view
  const resetCapture = () => {
    setCapturedImage(null)
    setIdentifiedStudent(null)
    setMatchConfidence(null)
    setSeverity('')
    setMisconductType('')
    setNotes('')
  }
  
  // Toggle camera facing mode
  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }
  
  // Handle misconduct recording
  const handleRecordMisconduct = () => {
    if (!identifiedStudent || !severity || !misconductType) return
    
    disciplineMutation.mutate({
      student_id: identifiedStudent.id,
      severity,
      misconduct_type: misconductType,
      notes: notes.trim() || undefined,
    })
  }
  
  // Get available misconduct types based on severity
  const availableTypes = severity === 'light' 
    ? (misconductTypes?.light || [])
    : severity === 'medium'
    ? (misconductTypes?.medium || [])
    : []
  
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-surface-900">Scan Student</h1>
        <p className="text-surface-500 mt-1">
          Capture a photo to identify student and record misconduct
        </p>
      </div>
      
      {/* Camera/Image View */}
      <div className="card overflow-hidden">
        <div className="aspect-[4/3] relative bg-surface-900">
          {!capturedImage ? (
            <>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.7}
                videoConstraints={{
                  facingMode,
                  width: { ideal: 640 },
                  height: { ideal: 640 },
                }}
                className="w-full h-full object-cover"
              />
              
              {/* Camera overlay */}
              <div className="absolute inset-0 camera-overlay pointer-events-none">
                {/* Face guide */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-60 border-2 border-white/50 rounded-[40%] animate-pulse-soft" />
              </div>
              
              {/* Camera switch button */}
              <button
                onClick={toggleCamera}
                className="absolute top-4 right-4 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </>
          ) : (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Loading overlay */}
          {identifyMutation.isPending && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-center text-white">
                <Loader2 className="w-12 h-12 animate-spin mx-auto" />
                <p className="mt-3 font-medium">Identifying student...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Capture/Reset buttons */}
        <div className="p-4 bg-surface-50">
          {!capturedImage ? (
            <button
              onClick={captureImage}
              className="btn-primary w-full py-4 text-lg"
            >
              <Camera className="w-6 h-6" />
              Capture Photo
            </button>
          ) : (
            <button
              onClick={resetCapture}
              className="btn-secondary w-full py-4 text-lg"
            >
              <RotateCcw className="w-6 h-6" />
              Take New Photo
            </button>
          )}
        </div>
      </div>
      
      {/* Identification Result */}
      {capturedImage && (
        <div className="card animate-slide-up">
          {identifyMutation.isPending ? (
            <div className="p-6 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
              <p className="mt-2 text-surface-500">Processing face...</p>
            </div>
          ) : identifiedStudent ? (
            <>
              {/* Student info */}
              <div className="p-6 border-b border-surface-200">
                <div className="flex items-center gap-2 text-emerald-600 mb-4">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Student Identified</span>
                  <span className="text-sm text-surface-500">
                    ({(matchConfidence * 100).toFixed(1)}% match)
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-2xl">
                    {identifiedStudent.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-surface-900">
                      {identifiedStudent.name}
                    </h3>
                    <p className="text-surface-500">
                      {identifiedStudent.student_id} • {identifiedStudent.class_name} • Form {identifiedStudent.form}
                    </p>
                  </div>
                  <MisconductBadge 
                    light={identifiedStudent.misconduct_stats?.light_total || 0}
                    medium={identifiedStudent.misconduct_stats?.medium_total || 0}
                    size="lg"
                  />
                </div>
              </div>
              
              {/* Misconduct recording */}
              <div className="p-6 space-y-4">
                <h4 className="font-semibold text-surface-900">Record Misconduct</h4>
                
                {/* Severity Selection */}
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">
                    Misconduct Severity *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSeverity('light')}
                      className={clsx(
                        'p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2',
                        severity === 'light'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-surface-200 hover:border-blue-300 text-surface-600'
                      )}
                    >
                      <AlertCircle className="w-5 h-5" />
                      Light
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeverity('medium')}
                      className={clsx(
                        'p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2',
                        severity === 'medium'
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-surface-200 hover:border-orange-300 text-surface-600'
                      )}
                    >
                      <AlertTriangle className="w-5 h-5" />
                      Medium
                    </button>
                  </div>
                </div>
                
                {/* Misconduct Type Selection */}
                {severity && (
                  <div className="animate-fade-in">
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      Type of Misconduct *
                    </label>
                    <select
                      value={misconductType}
                      onChange={(e) => setMisconductType(e.target.value)}
                      className="input"
                    >
                      <option value="">Select misconduct type...</option>
                      {availableTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Notes */}
                {severity && misconductType && (
                  <div className="animate-fade-in">
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      Additional Notes (optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Enter any additional details about the incident..."
                      className="input min-h-[80px] resize-none"
                    />
                  </div>
                )}
                
                {/* Submit Button */}
                <button
                  onClick={handleRecordMisconduct}
                  disabled={!severity || !misconductType || disciplineMutation.isPending}
                  className={clsx(
                    'w-full py-4 text-lg rounded-xl font-medium transition-all',
                    severity === 'light'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-300'
                      : severity === 'medium'
                      ? 'bg-orange-600 hover:bg-orange-700 text-white disabled:bg-orange-300'
                      : 'bg-surface-200 text-surface-400 cursor-not-allowed'
                  )}
                >
                  {disciplineMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Recording...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {severity === 'light' ? (
                        <AlertCircle className="w-6 h-6" />
                      ) : severity === 'medium' ? (
                        <AlertTriangle className="w-6 h-6" />
                      ) : null}
                      Record Misconduct
                    </span>
                  )}
                </button>
              </div>
            </>
          ) : identifyMutation.isError || identifyMutation.data?.matched === false ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900">Student Not Found</h3>
              <p className="text-surface-500 mt-1">
                {identifyMutation.data?.message || 'No matching student found in the database'}
              </p>
              <button onClick={resetCapture} className="btn-primary mt-4">
                Try Again
              </button>
            </div>
          ) : null}
        </div>
      )}
      
      {/* Instructions */}
      {!capturedImage && (
        <div className="card p-6 bg-primary-50/50 border-primary-200">
          <h3 className="font-medium text-primary-900 mb-2">How to scan</h3>
          <ol className="text-sm text-primary-700 space-y-1">
            <li>1. Position the student's face within the oval guide</li>
            <li>2. Ensure good lighting on the face</li>
            <li>3. Tap "Capture Photo" to identify the student</li>
            <li>4. Select misconduct severity and type</li>
            <li>5. Record the misconduct</li>
          </ol>
        </div>
      )}
    </div>
  )
}
