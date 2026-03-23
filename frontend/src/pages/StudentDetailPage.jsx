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
  Printer,
  Pencil,
  X,
  Save,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { MisconductStats } from '../components/MisconductBadge'

const LIGHT_TYPES = [
  "Defacing school area","Stepping on grass in prohibited areas","Not disposing of trash properly",
  "Late to school/class","Making noise in class","Not bringing books/completing homework/assignments",
  "Not paying attention during teacher's lesson","Being in canteen or other places during school hours (except recess)",
  "Not following laboratory/workshop/special room rules","Late moving to assembly/workshop/laboratory",
  "Leaving class without permission","Late to prayer room","Keeping mustache, beard and sideburns",
  "Long hair or resembling certain groups","Wearing jewelry/ornaments/makeup",
  "Not wearing school uniform neatly/complete","Dyeing hair",
  "Playing in class, corridor or prohibited areas","Using and taking out school equipment without permission",
  "Storing or using school gaming equipment without permission",
  "Using school entertainment or electronic devices without permission",
  "Eating or drinking in class/special rooms","Wandering during school hours",
  "Bringing and using mobile phones, MP3 and MP4","Riding or driving motorized vehicles in school area",
  "Bringing walkman/discman to class","Disturbing public order","Entering special rooms without permission",
  "Ordering and buying food from outside without permission",
  "Other offenses interpreted by principal (light category)"
]
const MEDIUM_TYPES = [
  "Third occurrence of any light offense","Misusing school electrical equipment/power sources without permission",
  "Dishonesty, cheating, lying and copying during tests/examinations",
  "Absenteeism from any official school event",
  "Not respecting school/state/national anthems/flags/emblems",
  "Excessive ear piercing/multiple earrings on one ear/excessive jewelry (fashion)",
  "Vandalizing school property","Extreme hairstyles like punk/skinhead or colored",
  "Disturbing teacher during lesson","Other offenses interpreted by principal (medium category)"
]

function EditRecordModal({ record, onClose, onSaved }) {
  const [severity, setSeverity] = useState(record.severity)
  const [misconductType, setMisconductType] = useState(record.misconduct_type)
  const [notes, setNotes] = useState(record.notes || '')

  const availableTypes = severity === 'light' ? LIGHT_TYPES : MEDIUM_TYPES

  const updateMutation = useMutation({
    mutationFn: (data) => disciplineApi.update(record.id, data),
    onSuccess: () => {
      toast.success('Misconduct record updated')
      onSaved()
      onClose()
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update record')
    },
  })

  const handleSave = () => {
    if (!severity || !misconductType) return
    updateMutation.mutate({ severity, misconduct_type: misconductType, notes: notes.trim() || null })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card p-6 max-w-lg w-full animate-scale-in space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-surface-900">Edit Misconduct Record</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-100 transition-colors">
            <X className="w-5 h-5 text-surface-500" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-2">Severity *</label>
          <div className="grid grid-cols-2 gap-3">
            {['light', 'medium'].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => { setSeverity(s); setMisconductType('') }}
                className={clsx(
                  'p-3 rounded-xl border-2 transition-all capitalize flex items-center justify-center gap-2',
                  severity === s
                    ? s === 'light' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-surface-200 hover:border-surface-300 text-surface-600'
                )}
              >
                {s === 'light' ? <AlertCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-2">Type of Misconduct *</label>
          <select
            value={misconductType}
            onChange={(e) => setMisconductType(e.target.value)}
            className="input"
          >
            <option value="">Select type...</option>
            {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-2">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input min-h-[80px] resize-none"
            placeholder="Additional details..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!severity || !misconductType || updateMutation.isPending}
            className="btn-primary flex-1"
          >
            {updateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" />Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function StudentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [deletingRecordId, setDeletingRecordId] = useState(null)

  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentApi.get(id),
  })

  const { data: disciplineHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['discipline-history', id],
    queryFn: () => disciplineApi.getStudentHistory(id),
  })

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

  const deleteRecordMutation = useMutation({
    mutationFn: (recordId) => disciplineApi.delete(recordId),
    onSuccess: () => {
      toast.success('Misconduct record deleted')
      queryClient.invalidateQueries(['discipline-history', id])
      queryClient.invalidateQueries(['student', id])
      queryClient.invalidateQueries(['students'])
      setDeletingRecordId(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete record')
      setDeletingRecordId(null)
    },
  })

  const handlePrint = () => window.print()

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

  const totalLight = disciplineHistory.filter(r => r.severity === 'light').length
  const totalMedium = disciplineHistory.filter(r => r.severity === 'medium').length
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthlyLight = disciplineHistory.filter(r => r.severity === 'light' && new Date(r.created_at) >= monthStart).length
  const monthlyMedium = disciplineHistory.filter(r => r.severity === 'medium' && new Date(r.created_at) >= monthStart).length

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
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
            <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-4xl backdrop-blur-sm">
              {student.name.charAt(0)}
            </div>

            <div className="flex-1 text-white">
              <h1 className="font-display text-3xl font-bold">{student.name}</h1>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-primary-100">
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
                    <><Camera className="w-4 h-4" />Face registered</>
                  ) : (
                    <><CameraOff className="w-4 h-4" />No face registered</>
                  )}
                </span>
              </div>
            </div>

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

        <div className="p-4 bg-surface-50 flex flex-wrap gap-3 justify-end border-t border-surface-200 no-print">
          <button onClick={handlePrint} className="btn-secondary">
            <Printer className="w-4 h-4" />
            Print Report
          </button>
          <Link to={`/students/${id}/edit`} className="btn-secondary">
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
          <h2 className="font-display text-xl font-semibold text-surface-900">Discipline History</h2>
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
                className="p-4 lg:px-6 flex items-start gap-4 animate-slide-up group"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                  record.severity === 'light' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                )}>
                  {record.severity === 'light' ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>

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

                {/* Edit / Delete actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                  <button
                    onClick={() => setEditingRecord(record)}
                    className="p-2 rounded-lg hover:bg-blue-50 text-surface-400 hover:text-blue-600 transition-colors"
                    title="Edit record"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingRecordId(record.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-surface-400 hover:text-red-600 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Student Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 no-print">
          <div className="card p-6 max-w-md w-full animate-scale-in">
            <h3 className="text-xl font-semibold text-surface-900">Delete Student?</h3>
            <p className="text-surface-600 mt-2">
              Are you sure you want to delete <strong>{student.name}</strong>?
              This will also delete all discipline records. This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="btn-danger flex-1"
              >
                {deleteMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Record Confirmation Modal */}
      {deletingRecordId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 no-print">
          <div className="card p-6 max-w-md w-full animate-scale-in">
            <h3 className="text-xl font-semibold text-surface-900">Delete Misconduct Record?</h3>
            <p className="text-surface-600 mt-2">
              Are you sure you want to delete this misconduct record? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeletingRecordId(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={() => deleteRecordMutation.mutate(deletingRecordId)}
                disabled={deleteRecordMutation.isPending}
                className="btn-danger flex-1"
              >
                {deleteRecordMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Record Modal */}
      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSaved={() => {
            queryClient.invalidateQueries(['discipline-history', id])
            queryClient.invalidateQueries(['student', id])
            queryClient.invalidateQueries(['students'])
          }}
        />
      )}
    </div>
  )
}
