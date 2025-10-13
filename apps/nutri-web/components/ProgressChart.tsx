'use client'

import { useMemo } from 'react'
import { NutrientTrend, TrendPoint } from 'nutri-core'

interface ProgressChartProps {
  trends: NutrientTrend[]
  height?: number
}

export default function ProgressChart({ trends, height = 300 }: ProgressChartProps) {
  const chartData = useMemo(() => {
    if (trends.length === 0) return null

    // Combine all trends into a single chart
    const allDataPoints: Array<{
      date: string
      nutrient: string
      value: number
      target?: number
    }> = []

    trends.forEach(trend => {
      trend.data_points.forEach(point => {
        allDataPoints.push({
          date: point.date,
          nutrient: trend.nutrient,
          value: point.percent_target || 0,
          target: point.target ? (point.target / (point.target || 1)) * 100 : 100
        })
      })
    })

    // Group by date and calculate averages
    const dataByDate = new Map<string, Array<{ value: number; target?: number }>>()

    allDataPoints.forEach(point => {
      if (!dataByDate.has(point.date)) {
        dataByDate.set(point.date, [])
      }
      dataByDate.get(point.date)!.push({ value: point.value, target: point.target })
    })

    // Convert to chart format
    const chartData = Array.from(dataByDate.entries())
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, points]) => {
        const avgValue = points.reduce((sum, p) => sum + p.value, 0) / points.length
        const avgTarget = points.length > 0 && points[0].target ? points[0].target : 100
        return {
          date,
          value: Math.round(avgValue),
          target: Math.round(avgTarget)
        }
      })

    return chartData
  }, [trends])

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📈</div>
          <p>Track more weeks to see your progress trends!</p>
        </div>
      </div>
    )
  }

  const maxValue = Math.max(...chartData.map(d => Math.max(d.value, d.target)))
  const minValue = Math.min(...chartData.map(d => Math.min(d.value, d.target)))

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Over Time</h3>

      <div className="relative" style={{ height }}>
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 100 ${height}`}
          className="overflow-visible"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(value => (
            <g key={value}>
              <line
                x1="0"
                y1={height - (value / 100) * (height - 40)}
                x2="100"
                y2={height - (value / 100) * (height - 40)}
                stroke="#e5e7eb"
                strokeWidth="0.5"
              />
              <text
                x="-2"
                y={height - (value / 100) * (height - 40) + 2}
                textAnchor="end"
                className="text-xs fill-gray-500"
              >
                {value}%
              </text>
            </g>
          ))}

          {/* Area under curve */}
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          {/* Progress line */}
          <polyline
            points={chartData.map((point, index) => {
              const x = (index / (chartData.length - 1)) * 100
              const y = height - 40 - ((point.value - minValue) / (maxValue - minValue)) * (height - 80)
              return `${x},${y}`
            }).join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            className="drop-shadow-sm"
          />

          {/* Target line */}
          <polyline
            points={chartData.map((point, index) => {
              const x = (index / (chartData.length - 1)) * 100
              const y = height - 40 - ((point.target - minValue) / (maxValue - minValue)) * (height - 80)
              return `${x},${y}`
            }).join(' ')}
            fill="none"
            stroke="#10b981"
            strokeWidth="1"
            strokeDasharray="3,3"
            opacity="0.7"
          />

          {/* Data points */}
          {chartData.map((point, index) => {
            const x = (index / (chartData.length - 1)) * 100
            const y = height - 40 - ((point.value - minValue) / (maxValue - minValue)) * (height - 80)

            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="2"
                fill="#3b82f6"
                className="hover:r-3 transition-all cursor-pointer"
                title={`${point.date}: ${point.value}% of goal`}
              />
            )
          })}

          {/* Legend */}
          <g transform="translate(5, 20)">
            <circle cx="0" cy="0" r="3" fill="#3b82f6" />
            <text x="8" y="2" className="text-xs fill-gray-600">Your Progress</text>

            <circle cx="0" cy="12" r="3" fill="#10b981" />
            <text x="8" y="14" className="text-xs fill-gray-600">Target (100%)</text>
          </g>
        </svg>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>Showing average progress across all tracked nutrients over time</p>
      </div>
    </div>
  )
}

