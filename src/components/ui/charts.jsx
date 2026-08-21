/**
 * charts.jsx
 *
 * Lightweight, dependency-free SVG charts used across the app:
 * - AreaChart   : smooth area/line chart for time-series (views, likes…)
 * - BarChart    : vertical bar chart (trending engagement)
 * - Sparkline   : tiny inline line for cards/tables
 * - ProgressBar : simple percentage bar
 */

import { useId } from 'react'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function niceTicks(max) {
  if (max <= 0) return [0, 1]
  const raw = max / 4
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const norm = raw / mag
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10
  return [0, 1, 2, 3, 4].map((i) => Math.round(i * step * mag))
}

function buildPath(points, { width, height, pad = 6 }) {
  const maxX = width - pad
  const minX = pad
  const maxY = height - pad * 2
  const minY = pad
  const dataMax = Math.max(...points, 1)
  const stepX = points.length > 1 ? (maxX - minX) / (points.length - 1) : 0
  const coords = points.map((value, i) => ({
    x: points.length > 1 ? minX + i * stepX : width / 2,
    y: maxY - (value / dataMax) * (maxY - minY),
  }))

  let d = ''
  coords.forEach((p, i) => {
    if (i === 0) {
      d += `M ${p.x} ${p.y}`
    } else {
      const prev = coords[i - 1]
      const cx = (prev.x + p.x) / 2
      d += ` C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`
    }
  })

  const area = `${d} L ${coords[coords.length - 1].x} ${height - pad} L ${coords[0].x} ${height - pad} Z`
  return { line: d, area, coords }
}

// ---------------------------------------------------------------------------
// AreaChart
// ---------------------------------------------------------------------------

export function AreaChart({
  points,
  labels,
  color = '#f97316',
  height = 180,
  compact = false,
}) {
  const gradId = useId()
  const values = Array.isArray(points) ? points : []
  const maxValue = Math.max(...values, 1)
  const ticks = niceTicks(maxValue)
  const { line, area } = buildPath(values, {
    width: 640,
    height,
    pad: compact ? 4 : 8,
  })

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 640 ${height}`}
        className="w-full"
        style={{ display: 'block' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* horizontal gridlines */}
        {ticks.map((t) => {
          const y = height - 8 - (t / (maxValue || 1)) * (height - 16)
          return (
            <g key={t}>
              <line
                x1="8"
                y1={y}
                x2="632"
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
              {!compact && (
                <text x="2" y={y + 3} fill="rgba(255,255,255,0.35)" fontSize="10">
                  {t}
                </text>
              )}
            </g>
          )
        })}

        <path d={area} fill={`url(#${gradId})`} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {!compact &&
          values.map((v, i) => {
            const total = values.length - 1
            const x = total > 0 ? 8 + (i / total) * (632 - 16) : 320
            return (
              <circle
                key={i}
                cx={x}
                cy={height - 8 - (v / (maxValue || 1)) * (height - 16)}
                r="3"
                fill={color}
              />
            )
          })}
      </svg>

      {/* X-axis labels */}
      {labels && labels.length > 0 && (
        <div className="flex justify-between mt-1 text-[10px] text-white/35 px-1">
          {labels.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// BarChart
// ---------------------------------------------------------------------------

export function BarChart({
  bars,
  labels,
  color = '#f97316',
  height = 180,
}) {
  const values = Array.isArray(bars) ? bars : []
  const maxValue = Math.max(...values, 1)
  const pad = 8

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 640 ${height}`}
        className="w-full"
        style={{ display: 'block' }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* baseline */}
        <line
          x1={pad}
          y1={height - pad}
          x2={640 - pad}
          y2={height - pad}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />

        {values.map((value, i) => {
          const slot = (640 - pad * 2) / values.length
          const barWidth = Math.max(slot * 0.5, 10)
          const x = pad + i * slot + (slot - barWidth) / 2
          const barHeight = (value / maxValue) * (height - pad * 2)
          const y = height - pad - barHeight
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, value > 0 ? 2 : 0)}
              rx="4"
              fill={color}
              opacity={0.85}
              className="transition-opacity hover:opacity-100"
            />
          )
        })}
      </svg>

      {labels && labels.length > 0 && (
        <div className="flex justify-between mt-1 text-[10px] text-white/35 px-1">
          {labels.map((label, i) => (
            <span key={i} className="truncate" style={{ maxWidth: `${100 / labels.length}%` }}>
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sparkline
// ---------------------------------------------------------------------------

export function Sparkline({
  points,
  color = '#f97316',
  width = 80,
  height = 28,
}) {
  const values = Array.isArray(points) ? points : []
  if (!values.length) return <div className="w-full h-7" />

  const maxValue = Math.max(...values, 1)
  const stepX = values.length > 1 ? (width - 4) / (values.length - 1) : 0
  const coords = values.map((v, i) => ({
    x: values.length > 1 ? 2 + i * stepX : width / 2,
    y: height - 3 - (v / maxValue) * (height - 6),
  }))
  const d = coords
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// ProgressBar
// ---------------------------------------------------------------------------

export function ProgressBar({ value = 0, color = 'bg-orange-500', className = '' }) {
  const pct = Math.min(Math.max(value, 0), 100)
  return (
    <div className={`h-1.5 w-full bg-white/10 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full ${color} transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default { AreaChart, BarChart, Sparkline, ProgressBar }
