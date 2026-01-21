import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { disciplineApi, studentApi } from '../services/api'
import { 
  GraduationCap, 
  ChevronRight, 
  Loader2,
  Users,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Printer,
  TrendingUp
} from 'lucide-react'
import clsx from 'clsx'

export default function FormsPage() {
  const navigate = useNavigate()
  const [selectedForm, setSelectedForm] = useState(null)
  
  // Fetch form statistics
  const { data: formStats = [], isLoading } = useQuery({
    queryKey: ['form-stats'],
    queryFn: () => disciplineApi.getFormStats(),
    staleTime: 60000, // Cache for 1 minute
  })
  
  // Fetch students for selected form
  const { data: formStudents = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['students', 'form', selectedForm],
    queryFn: () => studentApi.list({ form: selectedForm, limit: 100 }),
    enabled: !!selectedForm,
  })
  
  // Handle print
  const handlePrint = () => {
    window.print()
  }
  
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-surface-900">Forms Overview</h1>
          <p className="text-surface-500 mt-1">
            View misconduct statistics by form level
          </p>
        </div>
        
        <button onClick={handlePrint} className="btn-secondary no-print">
          <Printer className="w-5 h-5" />
          Print Report
        </button>
      </div>
      
      {/* Form Cards */}
      {isLoading ? (
        <div className="card p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
          <p className="mt-2 text-surface-500">Loading form statistics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {formStats.map((stat, index) => (
            <div
              key={stat.form}
              onClick={() => setSelectedForm(selectedForm === stat.form ? null : stat.form)}
              className={clsx(
                'card p-6 cursor-pointer transition-all animate-slide-up',
                selectedForm === stat.form 
                  ? 'ring-2 ring-primary-500 bg-primary-50/50' 
                  : 'hover:shadow-md hover:border-surface-300'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-primary-600" />
                </div>
                <ChevronRight className={clsx(
                  'w-5 h-5 text-surface-400 transition-transform',
                  selectedForm === stat.form && 'rotate-90'
                )} />
              </div>
              
              <h3 className="text-xl font-bold text-surface-900">Form {stat.form}</h3>
              
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-surface-600">
                    <Users className="w-4 h-4" />
                    Students
                  </span>
                  <span className="font-semibold text-surface-900">{stat.total_students}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-blue-600">
                    <AlertCircle className="w-4 h-4" />
                    Light Misconducts
                  </span>
                  <span className="font-semibold text-surface-900">
                    {stat.light_misconducts}
                    <span className="text-xs text-surface-400 ml-1">({stat.light_monthly} this month)</span>
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="w-4 h-4" />
                    Medium Misconducts
                  </span>
                  <span className="font-semibold text-surface-900">
                    {stat.medium_misconducts}
                    <span className="text-xs text-surface-400 ml-1">({stat.medium_monthly} this month)</span>
                  </span>
                </div>
              </div>
              
              {/* Progress bar showing total issues */}
              <div className="mt-4 pt-4 border-t border-surface-200">
                <div className="flex justify-between text-xs text-surface-500 mb-1">
                  <span>Total Issues</span>
                  <span>{stat.light_misconducts + stat.medium_misconducts}</span>
                </div>
                <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                  <div className="h-full flex">
                    <div 
                      className="bg-blue-500 transition-all"
                      style={{ 
                        width: `${(stat.light_misconducts / Math.max(stat.light_misconducts + stat.medium_misconducts, 1)) * 100}%` 
                      }}
                    />
                    <div 
                      className="bg-orange-500 transition-all"
                      style={{ 
                        width: `${(stat.medium_misconducts / Math.max(stat.light_misconducts + stat.medium_misconducts, 1)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Selected Form Students */}
      {selectedForm && (
        <div className="card animate-slide-up">
          <div className="p-4 lg:p-6 border-b border-surface-200 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-surface-900">
              Form {selectedForm} Students
            </h2>
            <span className="text-sm text-surface-500">{formStudents.length} students</span>
          </div>
          
          {studentsLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
            </div>
          ) : formStudents.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-surface-300 mx-auto" />
              <p className="mt-2 text-surface-500">No students in Form {selectedForm}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-50 border-b border-surface-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-surface-600">Student</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-surface-600">Class</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-surface-600">Light</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-surface-600">Medium</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-surface-600">Total</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {formStudents.map((student, index) => {
                    const lightTotal = student.misconduct_stats?.light_total || 0
                    const mediumTotal = student.misconduct_stats?.medium_total || 0
                    const total = lightTotal + mediumTotal
                    
                    return (
                      <tr 
                        key={student.id}
                        onClick={() => navigate(`/students/${student.id}`)}
                        className="hover:bg-surface-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium flex-shrink-0">
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-surface-900">{student.name}</p>
                              <p className="text-sm text-surface-500">{student.student_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-surface-700">{student.class_name}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                            {lightTotal}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-medium">
                            {mediumTotal}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={clsx(
                            'px-2 py-1 rounded-full text-sm font-medium',
                            total === 0 ? 'bg-emerald-100 text-emerald-700' :
                            total <= 3 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          )}>
                            {total}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <ChevronRight className="w-5 h-5 text-surface-400" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
