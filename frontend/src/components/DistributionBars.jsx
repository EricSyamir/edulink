import clsx from 'clsx'

/**
 * Simple stacked bar distribution chart (no external chart libs)
 *
 * items: [{ key, label, light, medium, meta? }]
 */
export default function DistributionBars({
  title,
  subtitle,
  items = [],
  maxItems = 10,
}) {
  const sliced = [...items]
    .sort((a, b) => (b.light + b.medium) - (a.light + a.medium))
    .slice(0, maxItems)

  const maxTotal = Math.max(
    1,
    ...sliced.map((i) => (i.light || 0) + (i.medium || 0))
  )

  return (
    <div className="card p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-semibold text-surface-900">
            {title}
          </h2>
          {subtitle && <p className="text-surface-500 mt-1">{subtitle}</p>}
        </div>
        <div className="text-sm text-surface-500">
          Showing top {Math.min(maxItems, sliced.length)}
        </div>
      </div>

      {sliced.length === 0 ? (
        <div className="p-10 text-center text-surface-500">No data</div>
      ) : (
        <div className="mt-5 space-y-3">
          {sliced.map((item) => {
            const light = item.light || 0
            const medium = item.medium || 0
            const total = light + medium

            const widthPct = (total / maxTotal) * 100
            const lightPct = (light / Math.max(total, 1)) * 100
            const mediumPct = (medium / Math.max(total, 1)) * 100

            return (
              <div key={item.key} className="flex items-center gap-3">
                <div className="w-40 lg:w-56 min-w-0">
                  <p className="text-sm font-medium text-surface-900 truncate">
                    {item.label}
                  </p>
                  {item.meta && (
                    <p className="text-xs text-surface-500 truncate">{item.meta}</p>
                  )}
                </div>

                <div className="flex-1">
                  <div className="h-3 bg-surface-100 rounded-full overflow-hidden">
                    <div
                      className="h-full"
                      style={{ width: `${widthPct}%` }}
                    >
                      <div className="h-full flex">
                        <div
                          className="bg-blue-500"
                          style={{ width: `${lightPct}%` }}
                          title={`Light: ${light}`}
                        />
                        <div
                          className="bg-orange-500"
                          style={{ width: `${mediumPct}%` }}
                          title={`Medium: ${medium}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-xs text-surface-500">
                    <span className="tabular-nums">
                      Light {light} • Medium {medium}
                    </span>
                    <span className={clsx('tabular-nums font-semibold', total ? 'text-surface-700' : 'text-surface-400')}>
                      Total {total}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-5 flex items-center gap-4 text-xs text-surface-500">
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-blue-500" />
          Light
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-orange-500" />
          Medium
        </span>
      </div>
    </div>
  )
}

