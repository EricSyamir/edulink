import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studentApi, disciplineApi } from '../services/api'
import { format } from 'date-fns'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Loader2,
  AlertCircle,
  AlertTriangle,
  Calendar,
  User,
  School,
  Camera,
  CameraOff,
  History,
  Printer
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { MisconductStats } from '../components/MisconductBadge'

export default function StudentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Fetch student details
  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentApi.get(id),
  })
  
  // Fetch discipline history
  const { data: disciplineHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['discipline-history', id],
    queryFn: () => disciplineApi.getStudentHistory(id),
  })
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => studentApi.delete(id),
    onSuccess: () => {
      toast.success('Student deleted successfully')
      queryClient.invalidateQueries(['students'])
      navigate('/students')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete student')
    },
  })
  
  // Print handler
  const handlePrint = () => {
    window.print()
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
  
  // Calculate stats from history
  const totalLight = disciplineHistory.filter(r => r.severity === 'light').length
  const totalMedium = disciplineHistory.filter(r => r.severity === 'medium').length
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthlyLight = disciplineHistory.filter(r => r.severity === 'light' && new Date(r.created_at) >= monthStart).length
  const monthlyMedium = disciplineHistory.filter(r => r.severity === 'medium' && new Date(r.created_at) >= monthStart).length
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back button */}
      <Link 
        to="/students" 
        className="inline-flex items-center gap-2 text-surface-600 hover:text-surface-900 transition-colors no-print"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Students
      </Link>
      
      {/* Student Profile Card */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-4xl backdrop-blur-sm">
              {student.name.charAt(0)}
            </div>
            
            {/* Info */}
            <div className="flex-1 text-white">
              <h1 className="font-display text-3xl font-bold">{student.name}</h1>
              <p className="text-primary-100 mt-1 text-lg">{student.student_id}</p>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-primary-100">
                <span className="flex items-center gap-1">
                  <School className="w-4 h-4" />
                  {student.class_name}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Form {student.form}
                </span>
                <span className="flex items-center gap-1">
                  {student.has_face_embedding ? (
                    <>
                      <Camera className="w-4 h-4" />
                      Face registered
                    </>
                  ) : (
                    <>
                      <CameraOff className="w-4 h-4" />
                      No face registered
                    </>
                  )}
                </span>
              </div>
            </div>
            
            {/* Total Misconducts */}
            <div className="bg-white rounded-2xl p-5 text-center">
              <p className="text-sm text-surface-500 font-medium">Total Misconducts</p>
              <p className={clsx(
                'text-4xl font-bold mt-1',
                (totalLight + totalMedium) === 0 ? 'text-emerald-600' :
                (totalLight + totalMedium) <= 3 ? 'text-amber-600' :
                'text-red-600'
              )}>
                {totalLight + totalMedium}
              </p>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="p-4 bg-surface-50 flex flex-wrap gap-3 justify-end border-t border-surface-200 no-print">
          <button
            onClick={handlePrint}
            className="btn-secondary"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
          <Link
            to={`/students/${id}/edit`}
            className="btn-secondary"
          >
            <Edit className="w-4 h-4" />
            Edit Student
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-ghost text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
            <AlertCircle className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-surface-900">{totalLight}</p>
          <p className="text-sm text-surface-500">Light Misconducts</p>
        </div>
        
        <div className="card p-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-surface-900">{monthlyLight}</p>
          <p className="text-sm text-surface-500">Monthly Light</p>
        </div>
        
        <div className="card p-5">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-surface-900">{totalMedium}</p>
          <p className="text-sm text-surface-500">Medium Misconducts</p>
        </div>
        
        <div className="card p-5">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-surface-900">{monthlyMedium}</p>
          <p className="text-sm text-surface-500">Monthly Medium</p>
        </div>
      </div>
      
      {/* Discipline History */}
      <div className="card">
        <div className="p-4 lg:p-6 border-b border-surface-200">
          <h2 className="font-display text-xl font-semibold text-surface-900">
            Discipline History
          </h2>
        </div>
        
        {historyLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
          </div>
        ) : disciplineHistory.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-12 h-12 text-surface-300 mx-auto" />
            <p className="mt-2 text-surface-500">No discipline records yet</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {disciplineHistory.map((record, index) => (
              <div 
                key={record.id}
                className="p-4 lg:px-6 flex items-start gap-4 animate-slide-up"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Icon */}
                <div className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                  record.severity === 'light' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-orange-100 text-orange-600'
                )}>
                  {record.severity === 'light' ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={clsx(
                      'font-semibold capitalize',
                      record.severity === 'light' ? 'text-blue-600' : 'text-orange-600'
                    )}>
                      {record.severity} Misconduct
                    </span>
                  </div>
                  <p className="text-surface-700 mt-1 font-medium">{record.misconduct_type}</p>
                  {record.notes && (
                    <p className="text-surface-600 mt-1 text-sm">{record.notes}</p>
                  )}
                  <p className="text-sm text-surface-400 mt-1">
                    By {record.teacher_name} on {format(new Date(record.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 no-print">
          <div className="card p-6 max-w-md w-full animate-scale-in">
            <h3 className="text-xl font-semibold text-surface-900">Delete Student?</h3>
            <p className="text-surface-600 mt-2">
              Are you sure you want to delete <strong>{student.name}</strong>? 
              This will also delete all discipline records. This action cannot be undone.
            </p>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
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
