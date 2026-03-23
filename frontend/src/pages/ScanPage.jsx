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
  User,
  Search,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import MisconductBadge from '../components/MisconductBadge'
import { resizeImageForFaceDetection } from '../utils/imageResize'

// ─────────────────────────────────────────────────────────────────────────────
// Shared misconduct form (used in both scan & search tabs)
// ─────────────────────────────────────────────────────────────────────────────
function MisconductForm({ identifiedStudent, onRecord, isPending }) {
  const [severity, setSeverity] = useState('')
  const [misconductType, setMisconductType] = useState('')
  const [notes, setNotes] = useState('')

  const { data: misconductTypes } = useQuery({
    queryKey: ['misconduct-types'],
    queryFn: () => disciplineApi.getTypes(),
    staleTime: Infinity,
  })

  useEffect(() => { setMisconductType('') }, [severity])

  const availableTypes = severity === 'light'
    ? (misconductTypes?.light || [])
    : severity === 'medium'
    ? (misconductTypes?.medium || [])
    : []

  const handleSubmit = () => {
    if (!identifiedStudent || !severity || !misconductType) return
    onRecord({
      student_id: identifiedStudent.id,
      severity,
      misconduct_type: misconductType,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <div className="p-6 space-y-4">
      <h4 className="font-semibold text-surface-900">Record Misconduct</h4>

      {/* Severity */}
      <div>
        <label className="block text-sm font-medium text-surface-700 mb-2">Misconduct Severity *</label>
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
            <AlertCircle className="w-5 h-5" />Light
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
            <AlertTriangle className="w-5 h-5" />Medium
          </button>
        </div>
      </div>

      {/* Type */}
      {severity && (
        <div className="animate-fade-in">
          <label className="block text-sm font-medium text-surface-700 mb-2">Type of Misconduct *</label>
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
          <label className="block text-sm font-medium text-surface-700 mb-2">Additional Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter any additional details..."
            className="input min-h-[80px] resize-none"
          />
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!severity || !misconductType || isPending}
        className={clsx(
          'w-full py-4 text-lg rounded-xl font-medium transition-all',
          severity === 'light'
            ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-300'
            : severity === 'medium'
            ? 'bg-orange-600 hover:bg-orange-700 text-white disabled:bg-orange-300'
            : 'bg-surface-200 text-surface-400 cursor-not-allowed'
        )}
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />Recording...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            {severity === 'light' ? <AlertCircle className="w-6 h-6" /> : severity === 'medium' ? <AlertTriangle className="w-6 h-6" /> : null}
            Record Misconduct
          </span>
        )}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Student info card shown after identification
// ─────────────────────────────────────────────────────────────────────────────
function StudentCard({ student, matchConfidence }) {
  return (
    <div className="p-6 border-b border-surface-200">
      <div className="flex items-center gap-2 text-emerald-600 mb-4">
        <CheckCircle2 className="w-5 h-5" />
        <span className="font-medium">Student Identified</span>
        {matchConfidence !== undefined && matchConfidence !== null && (
          <span className="text-sm text-surface-500">
            ({(matchConfidence * 100).toFixed(1)}% match)
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-2xl">
          {student.name.charAt(0)}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-surface-900">{student.name}</h3>
          <p className="text-surface-500">{student.class_name} • Form {student.form}</p>
        </div>
        <MisconductBadge
          light={student.misconduct_stats?.light_total || 0}
          medium={student.misconduct_stats?.medium_total || 0}
          size="lg"
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAN TAB
// ─────────────────────────────────────────────────────────────────────────────
function ScanTab() {
  const navigate = useNavigate()
  const webcamRef = useRef(null)
  const queryClient = useQueryClient()

  const [capturedImage, setCapturedImage] = useState(null)
  const [identifiedStudent, setIdentifiedStudent] = useState(null)
  const [matchConfidence, setMatchConfidence] = useState(null)
  const [facingMode, setFacingMode] = useState('user')

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

  const disciplineMutation = useMutation({
    mutationFn: disciplineApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['students'])
      queryClient.invalidateQueries(['analytics'])
      queryClient.invalidateQueries(['student', String(identifiedStudent.id)])
      toast.success(`Misconduct recorded: ${data.misconduct_type}`, { duration: 2000 })
      setTimeout(() => navigate(`/students/${identifiedStudent.id}`), 500)
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to record misconduct')
    },
  })

  const captureImage = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      setIdentifiedStudent(null)
      setMatchConfidence(null)
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

  const resetCapture = () => {
    setCapturedImage(null)
    setIdentifiedStudent(null)
    setMatchConfidence(null)
  }

  return (
    <div className="space-y-6">
      {/* Camera */}
      <div className="card overflow-hidden">
        <div className="aspect-[4/3] relative bg-surface-900">
          {!capturedImage ? (
            <>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.7}
                videoConstraints={{ facingMode, width: { ideal: 640 }, height: { ideal: 640 } }}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 camera-overlay pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-60 border-2 border-white/50 rounded-[40%] animate-pulse-soft" />
              </div>
              <button
                onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                className="absolute top-4 right-4 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </>
          ) : (
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
          )}
          {identifyMutation.isPending && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-center text-white">
                <Loader2 className="w-12 h-12 animate-spin mx-auto" />
                <p className="mt-3 font-medium">Identifying student...</p>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-surface-50">
          {!capturedImage ? (
            <button onClick={captureImage} className="btn-primary w-full py-4 text-lg">
              <Camera className="w-6 h-6" />Capture Photo
            </button>
          ) : (
            <button onClick={resetCapture} className="btn-secondary w-full py-4 text-lg">
              <RotateCcw className="w-6 h-6" />Take New Photo
            </button>
          )}
        </div>
      </div>

      {/* Result */}
      {capturedImage && (
        <div className="card animate-slide-up">
          {identifyMutation.isPending ? (
            <div className="p-6 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
              <p className="mt-2 text-surface-500">Processing face...</p>
            </div>
          ) : identifiedStudent ? (
            <>
              <StudentCard student={identifiedStudent} matchConfidence={matchConfidence} />
              <MisconductForm
                identifiedStudent={identifiedStudent}
                onRecord={(data) => disciplineMutation.mutate(data)}
                isPending={disciplineMutation.isPending}
              />
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
              <button onClick={resetCapture} className="btn-primary mt-4">Try Again</button>
            </div>
          ) : null}
        </div>
      )}

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

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH TAB
// ─────────────────────────────────────────────────────────────────────────────
function SearchTab() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: searchResults = [], isFetching } = useQuery({
    queryKey: ['students-search', debouncedQuery],
    queryFn: () => studentApi.list({ search: debouncedQuery, limit: 20 }),
    enabled: debouncedQuery.trim().length >= 2,
  })

  const disciplineMutation = useMutation({
    mutationFn: disciplineApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['students'])
      queryClient.invalidateQueries(['analytics'])
      queryClient.invalidateQueries(['student', String(selectedStudent.id)])
      toast.success(`Misconduct recorded: ${data.misconduct_type}`, { duration: 2000 })
      setTimeout(() => navigate(`/students/${selectedStudent.id}`), 500)
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to record misconduct')
    },
  })

  return (
    <div className="space-y-6">
      {/* Search box */}
      <div className="card p-6">
        <label className="block text-sm font-medium text-surface-700 mb-2">
          Search Student by Name
        </label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSelectedStudent(null) }}
            placeholder="Type at least 2 characters..."
            className="input pl-12"
            autoFocus
          />
          {isFetching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 animate-spin" />
          )}
        </div>

        {/* Search results */}
        {debouncedQuery.trim().length >= 2 && !selectedStudent && (
          <div className="mt-3 divide-y divide-surface-100 border border-surface-200 rounded-xl overflow-hidden">
            {searchResults.length === 0 && !isFetching ? (
              <div className="p-4 text-center text-surface-500 text-sm">
                No students found for "{debouncedQuery}"
              </div>
            ) : (
              searchResults.map((student) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-surface-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {student.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-900 truncate">{student.name}</p>
                    <p className="text-sm text-surface-500">{student.class_name} • Form {student.form}</p>
                  </div>
                  <MisconductBadge
                    light={student.misconduct_stats?.light_total || 0}
                    medium={student.misconduct_stats?.medium_total || 0}
                  />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected student + misconduct form */}
      {selectedStudent && (
        <div className="card animate-slide-up">
          <div className="p-4 bg-surface-50 border-b border-surface-200 flex items-center justify-between">
            <span className="text-sm text-surface-500">Selected student</span>
            <button
              onClick={() => setSelectedStudent(null)}
              className="text-sm text-primary-600 hover:underline"
            >
              Change
            </button>
          </div>
          <StudentCard student={selectedStudent} />
          <MisconductForm
            identifiedStudent={selectedStudent}
            onRecord={(data) => disciplineMutation.mutate(data)}
            isPending={disciplineMutation.isPending}
          />
        </div>
      )}

      {!selectedStudent && debouncedQuery.trim().length < 2 && (
        <div className="card p-6 bg-primary-50/50 border-primary-200">
          <h3 className="font-medium text-primary-900 mb-2">How to search</h3>
          <ol className="text-sm text-primary-700 space-y-1">
            <li>1. Type the student's name in the search box</li>
            <li>2. Select the correct student from the results</li>
            <li>3. Choose misconduct severity and type</li>
            <li>4. Record the misconduct</li>
          </ol>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function ScanPage() {
  const [activeTab, setActiveTab] = useState('scan')

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-surface-900">Record Misconduct</h1>
        <p className="text-surface-500 mt-1">Identify a student via face scan or name search</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 rounded-xl">
        <button
          onClick={() => setActiveTab('scan')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm transition-all',
            activeTab === 'scan'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-surface-500 hover:text-surface-700'
          )}
        >
          <Camera className="w-4 h-4" />
          Scan Face
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm transition-all',
            activeTab === 'search'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-surface-500 hover:text-surface-700'
          )}
        >
          <Search className="w-4 h-4" />
          Search by Name
        </button>
      </div>

      {activeTab === 'scan' ? <ScanTab /> : <SearchTab />}
    </div>
  )
}
