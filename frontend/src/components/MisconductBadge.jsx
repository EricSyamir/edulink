import clsx from 'clsx'

/**
 * Display student's misconduct count with color coding
 * 
 * Colors based on total misconduct count:
 * - 0: Green (no issues)
 * - 1-3: Yellow (few issues)
 * - 4+: Red (needs attention)
 */
export default function MisconductBadge({ light = 0, medium = 0, size = 'md', showBreakdown = false }) {
  const total = light + medium
  
  const getBadgeClass = () => {
    if (total === 0) return 'bg-emerald-100 text-emerald-700'
    if (total <= 3) return 'bg-amber-100 text-amber-700'
    return 'bg-red-100 text-red-700'
  }
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }
  
  if (showBreakdown) {
    return (
      <div className="flex gap-2">
        <span className={clsx('inline-flex items-center gap-1 rounded-full font-semibold', sizeClasses[size], 'bg-blue-100 text-blue-700')}>
          L: {light}
        </span>
        <span className={clsx('inline-flex items-center gap-1 rounded-full font-semibold', sizeClasses[size], 'bg-orange-100 text-orange-700')}>
          M: {medium}
        </span>
      </div>
    )
  }
  
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full font-semibold', sizeClasses[size], getBadgeClass())}>
      {total} {total === 1 ? 'misconduct' : 'misconducts'}
    </span>
  )
}

/**
 * Compact version showing just light and medium counts
 */
export function MisconductStats({ stats, size = 'md' }) {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }
  
  return (
    <div className={clsx('flex flex-col gap-1', sizeClasses[size])}>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
          Light: {stats?.light_total || 0}
        </span>
        <span className="text-surface-400 text-xs">
          ({stats?.light_monthly || 0} this month)
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
          Medium: {stats?.medium_total || 0}
        </span>
        <span className="text-surface-400 text-xs">
          ({stats?.medium_monthly || 0} this month)
        </span>
      </div>
    </div>
  )
}
