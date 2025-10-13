import { NextRequest, NextResponse } from 'next/server'
import { loadSchema, loadGoals, generateAnalyticsData } from 'nutri-core'

export async function GET(request: NextRequest) {
  try {
    // Load schema and goals
    const schema = loadSchema('./data/schema.yml')
    const goals = loadGoals('./data/goals.yml')

    // Get stage from query params
    const { searchParams } = new URL(request.url)
    const stage = (searchParams.get('stage') || 'pregnancy_trimester2') as any

    // Load historical reports from localStorage (in a real app, this would come from a database)
    const reportsData = localStorage.getItem('nutrition-reports-history')
    const reports = reportsData ? JSON.parse(reportsData) : []

    if (reports.length === 0) {
      return NextResponse.json({
        analytics: {
          trends: [],
          insights: [],
          predictions: [],
          summary: {
            total_weeks_tracked: 0,
            average_consistency: 0,
            needs_attention_nutrients: [],
            streak_days: 0
          }
        }
      })
    }

    // Generate analytics data
    const analytics = generateAnalyticsData(reports, goals, stage)

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Analytics generation failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    )
  }
}

