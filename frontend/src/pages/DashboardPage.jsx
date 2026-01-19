import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { studentApi } from '../services/api'
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
  Award,
  AlertTriangle
} from 'lucide-react'
import clsx from 'clsx'
import PointsBadge from '../components/PointsBadge'

export default function DashboardPage() {
  const { teacher } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  
  // Fetch students
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students', searchQuery],
    queryFn: () => studentApi.list({ search: searchQuery || undefined, limit: 20 }),
    keepPreviousData: true,
  })
  
  // Calculate statistics
  const stats = {
    total: students.length,
    highPoints: students.filter(s => s.current_points >= 100).length,
    lowPoints: students.filter(s => s.current_points < 50).length,
    withFace: students.filter(s => s.has_face_embedding).length,
  }
  
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
          value={stats.total}
          color="primary"
        />
        <StatCard
          icon={Award}
          label="High Achievers"
          value={stats.highPoints}
          subtext="≥100 points"
          color="emerald"
        />
        <StatCard
          icon={AlertTriangle}
          label="Need Attention"
          value={stats.lowPoints}
          subtext="<50 points"
          color="amber"
        />
        <StatCard
          icon={Camera}
          label="Face Registered"
          value={stats.withFace}
          subtext={`${Math.round((stats.withFace / Math.max(stats.total, 1)) * 100)}%`}
          color="blue"
        />
      </div>
      
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
          {student.student_id} • {student.class_name}
        </p>
      </div>
      
      {/* Points */}
      <PointsBadge points={student.current_points} />
      
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
