import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { studentApi, disciplineApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { 
  ShieldCheck, 
  Users, 
  GraduationCap, 
  ArrowUpRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  UserCog,
  Upload,
  FileSpreadsheet
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function AdminPage() {
  const { teacher } = useAuth()
  const queryClient = useQueryClient()
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const [promoteFromForm, setPromoteFromForm] = useState('')
  const [promoteToForm, setPromoteToForm] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importResult, setImportResult] = useState(null)
  
  // Check if user is admin
  if (!teacher?.is_admin) {
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
  
  // Fetch form statistics
  const { data: formStats = [] } = useQuery({
    queryKey: ['form-stats'],
    queryFn: () => disciplineApi.getFormStats(),
    staleTime: 60000,
  })
  
  // Promote mutation
  const promoteMutation = useMutation({
    mutationFn: ({ fromForm, toForm }) => studentApi.promote(fromForm, toForm),
    onSuccess: (data) => {
      toast.success(data.message)
      queryClient.invalidateQueries(['students'])
      queryClient.invalidateQueries(['form-stats'])
      setShowPromoteModal(false)
      setPromoteFromForm('')
      setPromoteToForm('')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to promote students')
    },
  })
  
  // Import CSV mutation
  const importMutation = useMutation({
    mutationFn: (file) => studentApi.importCSV(file),
    onSuccess: (data) => {
      setImportResult(data)
      queryClient.invalidateQueries(['students'])
      queryClient.invalidateQueries(['form-stats'])
      toast.success(`Import completed: ${data.created} created, ${data.updated} updated`)
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to import CSV')
      setImportResult(null)
    },
  })
  
  const handlePromote = () => {
    if (!promoteFromForm || !promoteToForm) return
    
    const from = parseInt(promoteFromForm)
    const to = parseInt(promoteToForm)
    
    if (from >= to) {
      toast.error('Target form must be higher than current form')
      return
    }
    
    if (to > 5) {
      toast.error('Cannot promote beyond Form 5')
      return
    }
    
    promoteMutation.mutate({ fromForm: from, toForm: to })
  }
  
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Please select a CSV file')
        return
      }
      setImportFile(file)
      setImportResult(null)
    }
  }
  
  const handleImport = () => {
    if (!importFile) {
      toast.error('Please select a CSV file')
      return
    }
    importMutation.mutate(importFile)
  }
  
  const handleCloseImportModal = () => {
    setShowImportModal(false)
    setImportFile(null)
    setImportResult(null)
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-surface-900">Admin Panel</h1>
            <p className="text-surface-500">Manage teachers and student promotions</p>
          </div>
        </div>
      </div>
      
      {/* Admin Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Manage Teachers */}
        <Link to="/admin/teachers" className="card p-6 hover:shadow-md hover:border-surface-300 transition-all group">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <UserCog className="w-6 h-6 text-primary-600" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-surface-400 group-hover:text-primary-500 transition-colors" />
          </div>
          <h3 className="text-lg font-semibold text-surface-900 mt-4">Manage Teachers</h3>
          <p className="text-surface-500 text-sm mt-1">Add, edit, or remove teacher accounts</p>
        </Link>
        
        {/* Promote Students */}
        <button 
          onClick={() => setShowPromoteModal(true)}
          className="card p-6 hover:shadow-md hover:border-surface-300 transition-all group text-left"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-emerald-600" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-surface-400 group-hover:text-emerald-500 transition-colors" />
          </div>
          <h3 className="text-lg font-semibold text-surface-900 mt-4">Promote Students</h3>
          <p className="text-surface-500 text-sm mt-1">Move all students from one form to another</p>
        </button>
        
        {/* Import Students */}
        <button 
          onClick={() => setShowImportModal(true)}
          className="card p-6 hover:shadow-md hover:border-surface-300 transition-all group text-left"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-surface-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <h3 className="text-lg font-semibold text-surface-900 mt-4">Import Students</h3>
          <p className="text-surface-500 text-sm mt-1">Import students from CSV file</p>
        </button>
      </div>
      
      {/* Form Overview */}
      <div className="card">
        <div className="p-4 lg:p-6 border-b border-surface-200">
          <h2 className="font-display text-xl font-semibold text-surface-900">
            Form Overview
          </h2>
        </div>
        
        <div className="divide-y divide-surface-100">
          {formStats.map((stat) => (
            <div key={stat.form} className="p-4 lg:px-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                  <span className="font-bold text-primary-600">{stat.form}</span>
                </div>
                <div>
                  <p className="font-medium text-surface-900">Form {stat.form}</p>
                  <p className="text-sm text-surface-500">{stat.total_students} students</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="font-semibold text-blue-600">{stat.light_misconducts}</p>
                  <p className="text-surface-400">Light</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-orange-600">{stat.medium_misconducts}</p>
                  <p className="text-surface-400">Medium</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Promote Modal */}
      {showPromoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-md w-full animate-scale-in">
            <h3 className="text-xl font-semibold text-surface-900">Promote Students</h3>
            <p className="text-surface-600 mt-2">
              Move all students from one form to another. This is typically done at the end of the school year.
            </p>
            
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">
                  From Form
                </label>
                <select
                  value={promoteFromForm}
                  onChange={(e) => setPromoteFromForm(e.target.value)}
                  className="input"
                >
                  <option value="">Select form...</option>
                  {[1, 2, 3, 4].map(form => (
                    <option key={form} value={form}>
                      Form {form} ({formStats.find(s => s.form === form)?.total_students || 0} students)
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">
                  To Form
                </label>
                <select
                  value={promoteToForm}
                  onChange={(e) => setPromoteToForm(e.target.value)}
                  className="input"
                  disabled={!promoteFromForm}
                >
                  <option value="">Select form...</option>
                  {[2, 3, 4, 5].filter(f => f > parseInt(promoteFromForm || 0)).map(form => (
                    <option key={form} value={form}>Form {form}</option>
                  ))}
                </select>
              </div>
              
              {promoteFromForm && promoteToForm && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">Confirm Promotion</p>
                      <p className="text-sm text-amber-700 mt-1">
                        This will move {formStats.find(s => s.form === parseInt(promoteFromForm))?.total_students || 0} students 
                        from Form {promoteFromForm} to Form {promoteToForm}.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPromoteModal(false)
                  setPromoteFromForm('')
                  setPromoteToForm('')
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handlePromote}
                disabled={!promoteFromForm || !promoteToForm || promoteMutation.isPending}
                className="btn-primary flex-1"
              >
                {promoteMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Promote
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-md w-full animate-scale-in">
            <h3 className="text-xl font-semibold text-surface-900">Import Students from CSV</h3>
            <p className="text-surface-600 mt-2">
              Upload a CSV file with columns: StudentID, StudentName, StudentForm, StudentClass
            </p>
            
            <div className="mt-6 space-y-4">
              {/* File Input */}
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">
                  Select CSV File
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={importMutation.isPending}
                    />
                    <div className="input flex items-center gap-3 cursor-pointer hover:border-primary-400">
                      <FileSpreadsheet className="w-5 h-5 text-surface-400" />
                      <span className="text-surface-600 flex-1">
                        {importFile ? importFile.name : 'Choose CSV file...'}
                      </span>
                    </div>
                  </label>
                </div>
                {importFile && (
                  <p className="text-sm text-surface-500 mt-2">
                    File selected: {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
              
              {/* CSV Format Info */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="font-medium text-blue-800 text-sm mb-2">CSV Format:</p>
                <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                  <li>Required columns: StudentID, StudentName, StudentForm, StudentClass</li>
                  <li>Optional column: Bil. (serial number)</li>
                  <li>First row should contain column headers</li>
                  <li>Form must be a number between 1 and 5</li>
                </ul>
              </div>
              
              {/* Import Result */}
              {importResult && (
                <div className={clsx(
                  "p-4 rounded-xl border",
                  importResult.total_errors > 0 
                    ? "bg-amber-50 border-amber-200" 
                    : "bg-emerald-50 border-emerald-200"
                )}>
                  <div className="flex items-start gap-3">
                    {importResult.total_errors > 0 ? (
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={clsx(
                        "font-medium",
                        importResult.total_errors > 0 ? "text-amber-800" : "text-emerald-800"
                      )}>
                        Import Summary
                      </p>
                      <div className="text-sm mt-2 space-y-1">
                        <p className={clsx(importResult.total_errors > 0 ? "text-amber-700" : "text-emerald-700")}>
                          Created: {importResult.created} | Updated: {importResult.updated} | Skipped: {importResult.skipped}
                        </p>
                        {importResult.errors && importResult.errors.length > 0 && (
                          <div className="mt-2">
                            <p className="text-amber-700 font-medium">Errors:</p>
                            <ul className="list-disc list-inside text-xs text-amber-600 mt-1">
                              {importResult.errors.map((error, idx) => (
                                <li key={idx}>{error}</li>
                              ))}
                            </ul>
                            {importResult.total_errors > importResult.errors.length && (
                              <p className="text-xs text-amber-600 mt-1">
                                ... and {importResult.total_errors - importResult.errors.length} more errors
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseImportModal}
                className="btn-secondary flex-1"
                disabled={importMutation.isPending}
              >
                {importResult ? 'Close' : 'Cancel'}
              </button>
              <button
                onClick={handleImport}
                disabled={!importFile || importMutation.isPending}
                className="btn-primary flex-1"
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Import
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
