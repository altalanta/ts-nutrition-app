'use client'

import { useState, useEffect } from 'react'
import { PersonalizedInsight, ProgressPrediction, AnalyticsData } from 'nutri-core'

interface InsightsDashboardProps {
  stage: string
}

interface AnalyticsResponse {
  analytics: AnalyticsData
}

export default function InsightsDashboard({ stage }: InsightsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [stage])

  const loadAnalytics = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/analytics?stage=${encodeURIComponent(stage)}`)
      const data: AnalyticsResponse = await response.json()

      if (response.ok) {
        setAnalytics(data.analytics)
      } else {
        setError(data.analytics?.toString() || 'Failed to load insights')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'achievement': return '🎉'
      case 'milestone': return '🏆'
      case 'warning': return '⚠️'
      case 'recommendation': return '💡'
      case 'trend': return '📈'
      default: return '📊'
    }
  }

  const getInsightColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-200 bg-red-50'
      case 'medium': return 'border-yellow-200 bg-yellow-50'
      case 'low': return 'border-green-200 bg-green-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-800'
      case 'medium': return 'text-yellow-800'
      case 'low': return 'text-green-800'
      default: return 'text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Analyzing your nutrition data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">😞</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadAnalytics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!analytics) return null

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Weeks Tracked</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.summary.total_weeks_tracked}</p>
            </div>
            <div className="text-blue-600 text-2xl">📅</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Consistency Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(analytics.summary.average_consistency * 100)}%
              </p>
            </div>
            <div className="text-green-600 text-2xl">🎯</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.summary.streak_days} days</p>
            </div>
            <div className="text-orange-600 text-2xl">🔥</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Most Improved</p>
              <p className="text-sm font-bold text-gray-900">
                {analytics.summary.most_improved_nutrient || 'None yet'}
              </p>
            </div>
            <div className="text-purple-600 text-2xl">🚀</div>
          </div>
        </div>
      </div>

      {/* Personalized Insights */}
      {analytics.insights.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personalized Insights</h3>

          <div className="space-y-4">
            {analytics.insights.map((insight) => (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border ${getInsightColor(insight.severity)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getInsightIcon(insight.type)}</span>
                  <div className="flex-1">
                    <h4 className={`font-medium ${getSeverityTextColor(insight.severity)}`}>
                      {insight.title}
                    </h4>
                    <p className={`text-sm mt-1 ${getSeverityTextColor(insight.severity)}`}>
                      {insight.description}
                    </p>
                    {insight.actionable && (
                      <button className="mt-2 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors">
                        Take Action →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goal Predictions */}
      {analytics.predictions.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Goal Predictions</h3>

          <div className="space-y-4">
            {analytics.predictions.map((prediction) => (
              <div key={prediction.nutrient} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-blue-900">{prediction.nutrient}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    prediction.confidence > 0.7 ? 'bg-green-100 text-green-800' :
                    prediction.confidence > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {Math.round(prediction.confidence * 100)}% confidence
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Current</p>
                    <p className="font-medium text-gray-900">
                      {Math.round(prediction.current_value)} / {Math.round(prediction.target_value)}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-600">Weeks to Goal</p>
                    <p className="font-medium text-gray-900">
                      {Math.ceil(prediction.predicted_weeks_to_goal)} weeks
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-600">Trend</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {prediction.trend_strength > 1 ? 'Strong' : prediction.trend_strength > 0.5 ? 'Moderate' : 'Weak'}
                    </p>
                  </div>
                </div>

                {prediction.recommendation && (
                  <p className="mt-3 text-sm text-blue-700 italic">
                    💡 {prediction.recommendation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Needs Attention */}
      {analytics.summary.needs_attention_nutrients.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Needs Attention</h3>

          <div className="flex flex-wrap gap-2">
            {analytics.summary.needs_attention_nutrients.map((nutrient) => (
              <span
                key={nutrient}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800"
              >
                {nutrient}
              </span>
            ))}
          </div>

          <p className="mt-3 text-sm text-gray-600">
            These nutrients may need more focus in your diet. Consider reviewing your recent food choices or consulting with a healthcare provider.
          </p>
        </div>
      )}

      {/* Empty State */}
      {analytics.insights.length === 0 && analytics.predictions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">🎯</div>
          <p className="text-lg font-medium text-gray-900 mb-2">No insights available yet</p>
          <p className="text-sm">Continue tracking your nutrition for at least 2-3 weeks to see personalized insights and predictions!</p>
        </div>
      )}
    </div>
  )
}
