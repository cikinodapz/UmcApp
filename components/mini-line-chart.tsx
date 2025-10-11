"use client"

import React, { useMemo, useRef, useState } from "react"

type Point = { label: string; value: number }

export function MiniLineChart({
  data,
  height = 340,
  stroke = "#4f46e5",
  fill = "rgba(99, 102, 241, 0.12)",
  grid = true,
  valueFormatter,
  yTicks = 4,
  className = "",
  showDots = true,
  title,
  subtitle,
}: {
  data: Point[]
  height?: number
  stroke?: string
  fill?: string
  grid?: boolean
  valueFormatter?: (n: number) => string
  yTicks?: number
  className?: string
  showDots?: boolean
  title?: string
  subtitle?: string
}) {
  const width = 1000 // will scale via viewBox + CSS
  const padding = { top: 32, right: 32, bottom: 64, left: 68 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const maxVal = Math.max(1, ...data.map((d) => d.value))
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW

  const y = (v: number) => innerH - (v / maxVal) * innerH

  const points = useMemo(() => data.map((d, i) => [padding.left + i * stepX, padding.top + y(d.value)] as const), [data, stepX, padding.left, padding.top])
  const dPath = points
    .map(([x, y], i) => (i === 0 ? `M ${x},${y}` : `L ${x},${y}`))
    .join(" ")

  const areaPath = `${dPath} L ${padding.left + innerW},${padding.top + innerH} L ${padding.left},${padding.top + innerH} Z`

  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((maxVal * i) / yTicks))

  // Determine x label density: target ~8 labels by default for readability
  const targetLabels = 8
  const step = data.length > targetLabels ? Math.ceil(data.length / targetLabels) : 1

  // Hover interaction state
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [hoverPosSvg, setHoverPosSvg] = useState<{ x: number; y: number } | null>(null)
  const [hoverPosPx, setHoverPosPx] = useState<{ left: number; top: number } | null>(null)

  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || data.length === 0) return
    const svg = svgRef.current
    const rect = svg.getBoundingClientRect()
    // Convert client coords to SVG coords accounting for viewBox scaling
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const ctm = svg.getScreenCTM()
    const inv = ctm ? ctm.inverse() : null
    const sp = inv ? pt.matrixTransform(inv) : { x: e.clientX - rect.left, y: e.clientY - rect.top }

    const sx = sp.x
    const sy = sp.y

    // Only react inside plot area (SVG coords)
    if (sx < padding.left || sx > padding.left + innerW || sy < padding.top || sy > padding.top + innerH) {
      setHoverIdx(null)
      setHoverPosSvg(null)
      setHoverPosPx(null)
      return
    }
    const relX = sx - padding.left
    const idx = Math.round(relX / stepX)
    const clamped = Math.max(0, Math.min(data.length - 1, idx))
    setHoverIdx(clamped)
    const [cx, cy] = points[clamped]
    setHoverPosSvg({ x: cx, y: cy })
    // Save pixel position for tooltip placement in container space
    setHoverPosPx({ left: e.clientX - rect.left, top: e.clientY - rect.top })
  }

  const onMouseLeave = () => {
    setHoverIdx(null)
    setHoverPosSvg(null)
    setHoverPosPx(null)
  }

  return (
    <div className={`w-full bg-white rounded-2xl border shadow-sm ${className}`}>
      {(title || subtitle) && (
        <div className="px-5 pt-4">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="p-4 relative">
        {/* Tooltip */}
        {hoverIdx !== null && hoverPosSvg && hoverPosPx && (
          <div
            className="pointer-events-none absolute z-10 px-3 py-2 rounded-lg bg-gray-900 text-white text-xs shadow-lg"
            style={{
              left: Math.min(hoverPosPx.left + 12, (svgRef.current?.clientWidth || width) - 160),
              top: Math.max(hoverPosPx.top - 12, 8),
              transform: "translateX(-72px)",
            }}
          >
            <div className="font-medium">{data[hoverIdx].label}</div>
            <div className="opacity-90">{valueFormatter ? valueFormatter(data[hoverIdx].value) : data[hoverIdx].value}</div>
          </div>
        )}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          style={{ height }}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
        >
          {/* Y grid + labels */}
          {grid && ticks.map((t, i) => {
            const yy = padding.top + y(t)
            return (
              <g key={i}>
                <line x1={padding.left} y1={yy} x2={padding.left + innerW} y2={yy} stroke="#e5e7eb" strokeDasharray="4 4" />
                <text x={padding.left - 14} y={yy} textAnchor="end" dominantBaseline="middle" fontSize="16" fill="#111827" fontWeight={600}>
                  {valueFormatter ? valueFormatter(t) : t}
                </text>
              </g>
            )
          })}

          {/* X labels (abbreviated, rotated for readability) */}
          {data.length > 0 && (
            <g>
              {data.map((d, idx) => {
                if (idx % step !== 0 && idx !== data.length - 1) return null
                const [xx] = points[idx]
                const yy = height - (padding.bottom - 12)
                return (
                  <text
                    key={idx}
                    x={xx}
                    y={yy}
                    textAnchor="end"
                    fontSize="16"
                    fill="#111827"
                    fontWeight={600}
                    transform={`rotate(-32 ${xx} ${yy})`}
                  >
                    {d.label}
                  </text>
                )
              })}
            </g>
          )}

          {/* Area fill */}
          <path d={areaPath} fill={fill} stroke="none" />

          {/* Line path */}
          <path d={dPath} fill="none" stroke={stroke} strokeWidth={3} />

          {/* Dots */}
          {showDots && points.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={hoverIdx === i ? 5 : 4} fill={stroke} />
          ))}

          {/* Hover vertical line and active dot */}
          {hoverIdx !== null && hoverPosSvg && (
            <g>
              <line
                x1={hoverPosSvg.x}
                y1={padding.top}
                x2={hoverPosSvg.x}
                y2={padding.top + innerH}
                stroke="#9ca3af"
                strokeDasharray="4 4"
              />
              <circle cx={hoverPosSvg.x} cy={hoverPosSvg.y} r={6} fill="#fff" stroke={stroke} strokeWidth={2} />
            </g>
          )}
        </svg>
      </div>
    </div>
  )
}
