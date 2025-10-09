import { NextRequest, NextResponse } from 'next/server'
import { loadSchema, loadGoals, computeWeekly, LifeStage } from 'nutri-core'
import { loadLimits } from 'nutri-core'
import { renderReportPdf, buildCitationsMap, getAppVersion } from 'nutri-report-pdf'
import path from 'path'

// Load schema, goals, and limits at module level (could be cached)
let schema: any = null
let goals: any = null
let limits: any = null

async function loadData() {
  if (!schema || !goals || !limits) {
    const schemaPath = path.join(process.cwd(), '../../data/schema.yml')
    const goalsPath = path.join(process.cwd(), '../../data/goals.yml')
    const limitsPath = path.join(process.cwd(), '../../data/limits.yml')

    try {
      const { loadSchema: loadSchemaFn, loadGoals: loadGoalsFn } = await import('nutri-core')
      const { loadLimits: loadLimitsFn } = await import('nutri-core')
      schema = loadSchemaFn(schemaPath)
      goals = loadGoalsFn(goalsPath)
      limits = loadLimitsFn(limitsPath)
    } catch (error) {
      throw new Error(`Failed to load data: ${error}`)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    await loadData()

    const body = await request.json()
    const { stage, weekStartISO, log } = body

    if (!stage || !weekStartISO || !log) {
      return NextResponse.json(
        { error: 'Stage, weekStartISO, and log are required' },
        { status: 400 }
      )
    }

    if (!goals[stage as LifeStage]) {
      return NextResponse.json(
        { error: `Invalid stage: ${stage}` },
        { status: 400 }
      )
    }

    // Create a temporary CSV from the log data
    const csvContent = 'date,food_name,servings\n' +
      log.map((entry: any) => `${entry.date},${entry.food_name},${entry.servings}`).join('\n')

    // Write to temporary file
    const fs = await import('fs')
    const tmpPath = `/tmp/web_pdf_log_${Date.now()}.csv`
    fs.writeFileSync(tmpPath, csvContent)

    try {
      // Create food database from log entries (simplified - in reality you'd need full food data)
      const foodDB: any = {}

      for (const entry of log) {
        if (!foodDB[entry.food_name]) {
          foodDB[entry.food_name] = {
            food_name: entry.food_name,
            brand: '',
            category: 'Imported',
            fdc_id: 0,
            serving_name: '1 serving',
            serving_size_g: 100,
            DHA_mg: 0,
            Selenium_µg: 0,
            Vitamin_A_RAE_µg: 0,
            Zinc_mg: 0,
            Iron_mg: 0,
            Iodine_µg: 0,
            Choline_mg: 0,
            Folate_DFE_µg: 0,
          }
        }
      }

      // Compute report
      const report = computeWeekly({
        logPath: tmpPath,
        stage: stage as LifeStage,
        foodDB,
        goals,
        schema,
        limits,
      })

      // Build citations map
      const citations = buildCitationsMap(goals, limits)
      const appVersion = getAppVersion()

      // Generate PDF
      const pdfBuffer = await renderReportPdf(report, {
        stage: stage as LifeStage,
        goals,
        limits,
        weekStartISO,
        sources: citations,
        appVersion,
      })

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="maternal-nutrition_${stage}_${weekStartISO}.pdf"`,
        },
      })
    } finally {
      // Clean up temp file
      const fs = await import('fs')
      if (fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath)
      }
    }
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}




