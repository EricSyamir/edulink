import { useState, useRef, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Webcam from 'react-webcam'
import { studentApi, disciplineApi } from '../services/api'
import { 
  Camera, 
  RotateCcw, 
  Award, 
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  User,
  Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import PointsBadge from '../components/PointsBadge'

export default function ScanPage() {
  const webcamRef = useRef(null)
  const queryClient = useQueryClient()
  
  const [capturedImage, setCapturedImage] = useState(null)
  const [identifiedStudent, setIdentifiedStudent] = useState(null)
  const [matchConfidence, setMatchConfidence] = useState(null)
  const [reason, setReason] = useState('')
  const [facingMode, setFacingMode] = useState('user') // 'user' for front, 'environment' for back
  
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
      // Update local student state with new points
      setIdentifiedStudent(prev => ({
        ...prev,
        current_points: prev.current_points + data.points_change
      }))
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries(['students'])
      
      toast.success(
        data.type === 'reward' 
          ? `Reward added! +${data.points_change} points`
          : `Punishment recorded. ${data.points_change} points`
      )
      
      setReason('')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to record discipline')
    },
  })
  
  // Capture image from webcam
  const captureImage = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      setCapturedImage(imageSrc)
      setIdentifiedStudent(null)
      setMatchConfidence(null)
      
      // Automatically identify
      identifyMutation.mutate(imageSrc)
    }
  }, [identifyMutation])
  
  // Reset to camera view
  const resetCapture = () => {
    setCapturedImage(null)
    setIdentifiedStudent(null)
    setMatchConfidence(null)
    setReason('')
  }
  
  // Toggle camera facing mode
  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }
  
  // Handle reward/punishment
  const handleDiscipline = (type) => {
    if (!identifiedStudent) return
    
    disciplineMutation.mutate({
      student_id: identifiedStudent.id,
      type,
      reason: reason.trim() || undefined,
    })
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-surface-900">Scan Student</h1>
        <p className="text-surface-500 mt-1">
          Capture a photo to identify student and record discipline
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
                screenshotQuality={0.8}
                videoConstraints={{
                  facingMode,
                  width: { ideal: 1280 },
                  height: { ideal: 960 },
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
                      {identifiedStudent.student_id} • {identifiedStudent.class_name} • Standard {identifiedStudent.standard}
                    </p>
                  </div>
                  <PointsBadge points={identifiedStudent.current_points} size="lg" />
                </div>
              </div>
              
              {/* Discipline actions */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">
                    Reason (optional)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for reward or punishment..."
                    className="input min-h-[100px] resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleDiscipline('reward')}
                    disabled={disciplineMutation.isPending}
                    className="btn-success py-4 text-lg"
                  >
                    {disciplineMutation.isPending ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6" />
                        Reward +10
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleDiscipline('punishment')}
                    disabled={disciplineMutation.isPending}
                    className="btn-danger py-4 text-lg"
                  >
                    {disciplineMutation.isPending ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <AlertTriangle className="w-6 h-6" />
                        Punish −10
                      </>
                    )}
                  </button>
                </div>
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
            <li>4. Record reward or punishment as needed</li>
          </ol>
        </div>
      )}
    </div>
  )
}
