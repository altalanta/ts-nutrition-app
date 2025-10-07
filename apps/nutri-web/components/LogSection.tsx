'use client'

import { useState } from 'react'
import { NormalizedFood } from 'nutri-importers'

interface LogItem {
  food: NormalizedFood
  servings: number
  date: string
}

interface LogSectionProps {
  items: LogItem[]
  onRemove: (index: number) => void
  onUpdateServings: (index: number, servings: number) => void
}

export default function LogSection({ items, onRemove, onUpdateServings }: LogSectionProps) {
  const [selectedStage, setSelectedStage] = useState('pregnancy_trimester2')
  const [showReport, setShowReport] = useState(false)
  const [report, setReport] = useState<any>(null)
  const [generating, setGenerating] = useState(false)

  const generateReport = async () => {
    if (items.length === 0) return

    setGenerating(true)

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stage: selectedStage,
          log: items.map(item => ({
            date: item.date,
            food_name: item.food.food_name,
            servings: item.servings,
          })),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setReport(data.report)
        setShowReport(true)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Daily Food Log</h2>
        <div className="flex gap-3">
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="pregnancy_trimester2">Pregnancy Trimester 2</option>
          </select>
          <button
            onClick={generateReport}
            disabled={items.length === 0 || generating}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {generating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No foods logged yet. Add some foods from the Search or Barcode tabs!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.food.food_name}</h4>
                  {item.food.brand && (
                    <p className="text-sm text-gray-600">Brand: {item.food.brand}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    Date: {formatDate(item.date)} • Servings: {item.servings}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const newServings = prompt('New servings?', item.servings.toString())
                      if (newServings) {
                        onUpdateServings(index, parseFloat(newServings))
                      }
                    }}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onRemove(index)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showReport && report && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">Weekly Nutrition Report</h3>
            <button
              onClick={() => setShowReport(false)}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Hide Report
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Week:</span>
                <span className="ml-2">{report.week_start} to {report.week_end}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Stage:</span>
                <span className="ml-2">{report.stage}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Nutrient</th>
                    <th className="text-right py-2">Total</th>
                    <th className="text-right py-2">Goal</th>
                    <th className="text-right py-2">% Target</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(report.nutrients).map(([nutrient, data]) => (
                    <tr key={nutrient} className="border-b">
                      <td className="py-2 font-medium">{nutrient}</td>
                      <td className="text-right py-2">{data.weekly_total.toFixed(1)}</td>
                      <td className="text-right py-2">{data.weekly_goal.toFixed(1)}</td>
                      <td className={`text-right py-2 font-medium ${
                        data.percent_target < 90 ? 'text-red-600' :
                        data.percent_target < 100 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {data.percent_target}%
                      </td>
                      <td className="py-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          data.gap_surplus < 0 ? 'bg-red-100 text-red-800' :
                          data.gap_surplus > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {data.gap_surplus < 0 ? 'DEFICIT' : data.gap_surplus > 0 ? 'SURPLUS' : 'ON TRACK'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
              <div className="flex flex-wrap gap-2">
                {report.summary.deficient_nutrients.length > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
                    Deficient: {report.summary.deficient_nutrients.join(', ')}
                  </span>
                )}
                {report.summary.surplus_nutrients.length > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                    Surplus: {report.summary.surplus_nutrients.join(', ')}
                  </span>
                )}
                {report.summary.deficient_nutrients.length === 0 && report.summary.surplus_nutrients.length === 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                    All nutrients on track! 🎉
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
