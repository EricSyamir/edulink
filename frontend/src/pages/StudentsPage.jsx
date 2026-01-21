import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { studentApi } from '../services/api'
import { 
  Search, 
  UserPlus, 
  ChevronRight, 
  Loader2,
  Users,
  Filter,
  Camera,
  CameraOff
} from 'lucide-react'
import clsx from 'clsx'
import MisconductBadge from '../components/MisconductBadge'

export default function StudentsPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [formFilter, setFormFilter] = useState('')
  
  // Fetch students with filters
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students', searchQuery, classFilter, formFilter],
    queryFn: () => studentApi.list({ 
      search: searchQuery || undefined,
      class_name: classFilter || undefined,
      form: formFilter || undefined,
      limit: 100,
    }),
    keepPreviousData: true,
  })
  
  // Get unique classes for filter dropdown
  const uniqueClasses = [...new Set(students.map(s => s.class_name))].sort()
  
  const handleSearch = (e) => {
    e.preventDefault()
  }
  
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-surface-900">Students</h1>
          <p className="text-surface-500 mt-1">
            Manage all registered students
          </p>
        </div>
        
        <Link to="/students/add" className="btn-primary">
          <UserPlus className="w-5 h-5" />
          Add Student
        </Link>
      </div>
      
      {/* Search and Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or student ID..."
              className="input pl-12"
            />
          </form>
          
          {/* Class filter */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="input w-full lg:w-48"
          >
            <option value="">All Classes</option>
            {uniqueClasses.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
          
          {/* Form filter */}
          <select
            value={formFilter}
            onChange={(e) => setFormFilter(e.target.value)}
            className="input w-full lg:w-40"
          >
            <option value="">All Forms</option>
            {[1, 2, 3, 4, 5].map(form => (
              <option key={form} value={form}>Form {form}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-surface-500">
        <p>{students.length} student{students.length !== 1 ? 's' : ''} found</p>
        {(searchQuery || classFilter || formFilter) && (
          <button
            onClick={() => {
              setSearchQuery('')
              setClassFilter('')
              setFormFilter('')
            }}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>
      
      {/* Student List */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
            <p className="mt-2 text-surface-500">Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-surface-300 mx-auto" />
            <p className="mt-2 text-surface-500">
              {searchQuery || classFilter || formFilter 
                ? 'No students found matching your filters' 
                : 'No students registered yet'}
            </p>
            {!searchQuery && !classFilter && !formFilter && (
              <Link to="/students/add" className="btn-primary mt-4 inline-flex">
                <UserPlus className="w-5 h-5" />
                Add First Student
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-50 border-b border-surface-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-surface-600">Student</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-surface-600">Class</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-surface-600">Form</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-surface-600">Misconducts</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-surface-600">Face</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {students.map((student, index) => (
                  <tr 
                    key={student.id}
                    onClick={() => navigate(`/students/${student.id}`)}
                    className="hover:bg-surface-50 cursor-pointer transition-colors animate-slide-up"
                    style={{ animationDelay: `${index * 30}ms` }}
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
                    <td className="px-6 py-4 text-surface-700">Form {student.form}</td>
                    <td className="px-6 py-4">
                      <MisconductBadge 
                        light={student.misconduct_stats?.light_total || 0}
                        medium={student.misconduct_stats?.medium_total || 0}
                        showBreakdown
                      />
                    </td>
                    <td className="px-6 py-4">
                      {student.has_face_embedding ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <Camera className="w-4 h-4" />
                          <span className="text-sm">Registered</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-surface-400">
                          <CameraOff className="w-4 h-4" />
                          <span className="text-sm">Not set</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <ChevronRight className="w-5 h-5 text-surface-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
