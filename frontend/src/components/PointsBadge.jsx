import clsx from 'clsx'

/**
 * Display student's Sahsiah points with color coding
 * - >= 100: High (green)
 * - 70-99: Normal (teal)
 * - 50-69: Low (amber)
 * - < 50: Critical (red)
 */
export default function PointsBadge({ points, size = 'md' }) {
  const getPointsClass = () => {
    if (points >= 100) return 'points-high'
    if (points >= 70) return 'points-normal'
    if (points >= 50) return 'points-low'
    return 'points-critical'
  }
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }
  
  return (
    <span className={clsx(getPointsClass(), sizeClasses[size])}>
      {points} pts
    </span>
  )
}
