import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  LayoutDashboard, 
  Camera, 
  Users, 
  LogOut,
  Menu,
  X,
  GraduationCap,
  Building2,
  School,
  UserCog,
  ShieldCheck,
  User
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

// School logo component
function SchoolLogo({ size = 'md' }) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-11 h-11',
    lg: 'w-20 h-20'
  }
  
  const [imageError, setImageError] = useState(false)
  
  return (
    <div className={clsx(
      sizeClasses[size],
      'rounded-xl bg-white flex items-center justify-center shadow-lg shadow-primary-500/20 overflow-hidden p-1'
    )}>
      {!imageError ? (
        <img 
          src="/logosekolah.png" 
          alt="SMK Bercham Logo"
          className="w-full h-full object-contain"
          onError={() => setImageError(true)}
        />
      ) : (
        <Building2 className={clsx(
          size === 'lg' ? 'w-10 h-10' : size === 'md' ? 'w-6 h-6' : 'w-5 h-5',
          'text-primary-600'
        )} />
      )}
    </div>
  )
}

export default function Layout() {
  const { teacher, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Check if user is admin
  const isAdmin = teacher?.is_admin || teacher?.role === 'admin'
  
  // Navigation items
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/scan', label: 'Scan Student', icon: Camera },
    { path: '/students', label: 'Students', icon: Users },
    { path: '/forms', label: 'Forms', icon: GraduationCap },
    { path: '/classes', label: 'Classes', icon: School },
    { path: '/profile', label: 'Profile', icon: User },
  ]
  
  // Admin-only navigation items
  const adminNavItems = [
    { path: '/admin', label: 'Admin Panel', icon: ShieldCheck },
    { path: '/admin/teachers', label: 'Manage Teachers', icon: UserCog },
  ]
  
  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  
  return (
    <div className="min-h-screen bg-surface-50">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-surface-200">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-2">
            {/* EduLink Logo */}
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-primary-500/20 overflow-hidden p-1">
              <img 
                src="/photo_2026-01-27_00-12-15.jpg" 
                alt="EduLink Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.parentElement.innerHTML = '<Building2 className="w-5 h-5 text-primary-600" />'
                }}
              />
            </div>
            {/* SMK Bercham Logo */}
            <SchoolLogo size="sm" />
            <div>
              <span className="font-display font-bold text-lg text-surface-900">EduLink</span>
              <span className="text-xs text-primary-600 block -mt-1">BErCHAMPION</span>
            </div>
          </div>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl hover:bg-surface-100 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-surface-600" />
            ) : (
              <Menu className="w-6 h-6 text-surface-600" />
            )}
          </button>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <nav className="absolute top-16 left-0 right-0 bg-white border-b border-surface-200 shadow-lg animate-slide-down">
            <div className="p-4 space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-surface-600 hover:bg-surface-100'
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ))}
              
              {/* Admin items (only show if admin) */}
              {isAdmin && (
                <>
                  <hr className="my-2 border-surface-200" />
                  {adminNavItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                          isActive
                            ? 'bg-amber-50 text-amber-700 font-medium'
                            : 'text-surface-600 hover:bg-surface-100'
                        )
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </NavLink>
                  ))}
                </>
              )}
              
              <hr className="my-2 border-surface-200" />
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </nav>
        )}
      </header>
      
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-surface-200">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 h-20 border-b border-surface-200">
          <div className="flex items-center gap-2">
            {/* EduLink Logo */}
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-primary-500/20 overflow-hidden p-1">
              <img 
                src="/photo_2026-01-27_00-12-15.jpg" 
                alt="EduLink Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.parentElement.innerHTML = '<Building2 className="w-6 h-6 text-primary-600" />'
                }}
              />
            </div>
            {/* SMK Bercham Logo */}
            <SchoolLogo size="sm" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-surface-900">EduLink</h1>
            <p className="text-xs text-primary-600 font-medium">BErCHAMPION</p>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium shadow-sm'
                    : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
          
          {/* Admin section */}
          {isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-4 text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Admin
                </p>
              </div>
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-amber-50 text-amber-700 font-medium shadow-sm'
                        : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>
        
        {/* User section */}
        <div className="p-4 border-t border-surface-200">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
              {teacher?.name?.charAt(0) || 'T'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-surface-900 truncate">{teacher?.name}</p>
              <p className="text-xs text-surface-500 truncate">
                {isAdmin ? 'Administrator' : 'Teacher'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
