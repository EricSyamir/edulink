import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { studentApi, disciplineApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { 
  Search, 
  Camera, 
  Users, 
  TrendingUp, 
  TrendingDown,
  ChevronRight,
  Loader2,
  UserPlus,
  AlertTriangle,
  AlertCircle,
  BarChart3,
  Calendar
} from 'lucide-react'
import clsx from 'clsx'
import MisconductBadge from '../components/MisconductBadge'

export default function DashboardPage() {
  const { teacher } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  
  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => disciplineApi.getAnalytics(30),
    staleTime: 60000, // Cache for 1 minute
  })
  
  // Fetch students
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['students', searchQuery],
    queryFn: () => studentApi.list({ search: searchQuery || undefined, limit: 20 }),
    keepPreviousData: true,
  })
  
  const isLoading = analyticsLoading || studentsLoading
  
  const handleSearch = (e) => {
    e.preventDefault()
  }
  
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-surface-900">
            Good {getTimeOfDay()}, {teacher?.name?.split(' ')[0]}!
          </h1>
          <p className="text-surface-500 mt-1">
            Here's an overview of student discipline tracking
          </p>
        </div>
        
        <div className="flex gap-3">
          <Link to="/scan" className="btn-primary">
            <Camera className="w-5 h-5" />
            Scan Student
          </Link>
          <Link to="/students/add" className="btn-secondary">
            <UserPlus className="w-5 h-5" />
            Add Student
          </Link>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Students"
          value={analytics?.total_students || 0}
          color="primary"
        />
        <StatCard
          icon={AlertCircle}
          label="Light Misconducts"
          value={analytics?.total_light_misconducts || 0}
          subtext={`${analytics?.monthly_light_misconducts || 0} this month`}
          color="blue"
        />
        <StatCard
          icon={AlertTriangle}
          label="Medium Misconducts"
          value={analytics?.total_medium_misconducts || 0}
          subtext={`${analytics?.monthly_medium_misconducts || 0} this month`}
          color="amber"
        />
        <StatCard
          icon={Camera}
          label="Face Registered"
          value={students.filter(s => s.has_face_embedding).length}
          subtext={`${Math.round((students.filter(s => s.has_face_embedding).length / Math.max(students.length, 1)) * 100)}%`}
          color="emerald"
        />
      </div>
      
      {/* Top Offenders */}
      {analytics?.top_offenders?.length > 0 && (
        <div className="card">
          <div className="p-4 lg:p-6 border-b border-surface-200">
            <h2 className="font-display text-xl font-semibold text-surface-900">
              Students Requiring Attention
            </h2>
          </div>
          <div className="divide-y divide-surface-100">
            {analytics.top_offenders.slice(0, 5).map((student, index) => (
              <button
                key={student.id}
                onClick={() => navigate(`/students/${student.id}`)}
                className="w-full flex items-center gap-4 p-4 lg:px-6 hover:bg-surface-50 transition-colors text-left animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {student.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-surface-900 truncate">{student.name}</p>
                  <p className="text-sm text-surface-500">
                    {student.student_id} • {student.class_name} • Form {student.form}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold text-sm">
                  {student.total_misconducts} misconducts
                </span>
                <ChevronRight className="w-5 h-5 text-surface-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Search and Student List */}
      <div className="card">
        <div className="p-4 lg:p-6 border-b border-surface-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h2 className="font-display text-xl font-semibold text-surface-900">
              Students
            </h2>
            
            <form onSubmit={handleSearch} className="relative w-full lg:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or ID..."
                className="input pl-12"
              />
            </form>
          </div>
        </div>
        
        {/* Student list */}
        <div className="divide-y divide-surface-100">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
              <p className="mt-2 text-surface-500">Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-surface-300 mx-auto" />
              <p className="mt-2 text-surface-500">
                {searchQuery ? 'No students found matching your search' : 'No students registered yet'}
              </p>
              {!searchQuery && (
                <Link to="/students/add" className="btn-primary mt-4 inline-flex">
                  <UserPlus className="w-5 h-5" />
                  Add First Student
                </Link>
              )}
            </div>
          ) : (
            students.map((student, index) => (
              <StudentRow 
                key={student.id} 
                student={student} 
                index={index}
                onClick={() => navigate(`/students/${student.id}`)}
              />
            ))
          )}
        </div>
        
        {/* View all link */}
        {students.length > 0 && (
          <div className="p-4 border-t border-surface-200 text-center">
            <Link 
              to="/students" 
              className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
            >
              View All Students
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, subtext, color }) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
  }
  
  return (
    <div className="card p-5 animate-slide-up">
      <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center mb-3', colorClasses[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-surface-900">{value}</p>
      <p className="text-sm text-surface-500">{label}</p>
      {subtext && <p className="text-xs text-surface-400 mt-1">{subtext}</p>}
    </div>
  )
}

function StudentRow({ student, index, onClick }) {
  const totalMisconducts = (student.misconduct_stats?.light_total || 0) + (student.misconduct_stats?.medium_total || 0)
  
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 lg:px-6 hover:bg-surface-50 transition-colors text-left animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
        {student.name.charAt(0)}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-surface-900 truncate">{student.name}</p>
        <p className="text-sm text-surface-500">
          {student.student_id} • {student.class_name} • Form {student.form}
        </p>
      </div>
      
      {/* Misconduct Badge */}
      <MisconductBadge 
        light={student.misconduct_stats?.light_total || 0} 
        medium={student.misconduct_stats?.medium_total || 0} 
      />
      
      {/* Arrow */}
      <ChevronRight className="w-5 h-5 text-surface-400 flex-shrink-0" />
    </button>
  )
}

function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
