import { describe, it, expect } from 'vitest'
import { renderReportPdf, buildCitationsMap } from '../index'
import { loadLimits, loadGoals } from 'nutri-core'
import path from 'path'
import crypto from 'crypto'

// Mock @react-pdf/renderer
vi.mock('@react-pdf/renderer', () => ({
  renderToBuffer: vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70]))
}))

describe('PDF Determinism', () => {
  it('should produce identical PDF output for identical inputs', async () => {
    const limits = loadLimits(path.join(__dirname, '../../data/limits.yml'))
    const goals = loadGoals(path.join(__dirname, '../../data/goals.yml'))

    const mockReport = {
      stage: 'pregnancy_trimester2',
      week_start: '2025-10-01',
      week_end: '2025-10-07',
      nutrients: {
        DHA: { weekly_total: 150, weekly_goal: 200, percent_target: 75, gap_surplus: -50 },
        Selenium: { weekly_total: 45, weekly_goal: 60, percent_target: 75, gap_surplus: -15 },
        Vitamin_A_RAE: { weekly_total: 800, weekly_goal: 770, percent_target: 104, gap_surplus: 30 },
      },
      provenance: {
        DHA: 'FDC',
        Selenium: 'FDC',
        Vitamin_A_RAE: 'FDC',
      },
      confidence: {
        DHA: 0.9,
        Selenium: 0.85,
        Vitamin_A_RAE: 0.95,
      },
      ulAlerts: {
        DHA: { total: 150, ul: null, overBy: null, severity: 'none' },
        Selenium: { total: 45, ul: 400, overBy: null, severity: 'none' },
        Vitamin_A_RAE: { total: 800, ul: 3000, overBy: null, severity: 'none' },
      },
      flags: [],
    } as any

    // Generate PDF twice with identical inputs
    const pdf1 = await renderReportPdf(mockReport, {
      stage: 'pregnancy_trimester2',
      goals,
      limits,
      weekStartISO: '2025-10-01',
      sources: buildCitationsMap(goals, limits),
      appVersion: '1.0.0',
    })

    const pdf2 = await renderReportPdf(mockReport, {
      stage: 'pregnancy_trimester2',
      goals,
      limits,
      weekStartISO: '2025-10-01',
      sources: buildCitationsMap(goals, limits),
      appVersion: '1.0.0',
    })

    // PDFs should be identical
    expect(pdf1).toEqual(pdf2)

    // Calculate SHA-256 hash for golden testing
    const hash = crypto.createHash('sha256').update(pdf1).digest('hex')
    expect(hash).toBe('a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3') // Golden hash
  })

  it('should produce different PDF for different inputs', async () => {
    const limits = loadLimits(path.join(__dirname, '../../data/limits.yml'))
    const goals = loadGoals(path.join(__dirname, '../../data/goals.yml'))

    const mockReport1 = {
      stage: 'pregnancy_trimester2',
      week_start: '2025-10-01',
      week_end: '2025-10-07',
      nutrients: {
        DHA: { weekly_total: 150, weekly_goal: 200, percent_target: 75, gap_surplus: -50 },
      },
      provenance: { DHA: 'FDC' },
      confidence: { DHA: 0.9 },
      ulAlerts: { DHA: { total: 150, ul: null, overBy: null, severity: 'none' } },
      flags: [],
    } as any

    const mockReport2 = {
      stage: 'pregnancy_trimester2',
      week_start: '2025-10-01',
      week_end: '2025-10-07',
      nutrients: {
        DHA: { weekly_total: 160, weekly_goal: 200, percent_target: 80, gap_surplus: -40 },
      },
      provenance: { DHA: 'FDC' },
      confidence: { DHA: 0.9 },
      ulAlerts: { DHA: { total: 160, ul: null, overBy: null, severity: 'none' } },
      flags: [],
    } as any

    const pdf1 = await renderReportPdf(mockReport1, {
      stage: 'pregnancy_trimester2',
      goals,
      limits,
      weekStartISO: '2025-10-01',
      sources: buildCitationsMap(goals, limits),
      appVersion: '1.0.0',
    })

    const pdf2 = await renderReportPdf(mockReport2, {
      stage: 'pregnancy_trimester2',
      goals,
      limits,
      weekStartISO: '2025-10-01',
      sources: buildCitationsMap(goals, limits),
      appVersion: '1.0.0',
    })

    // PDFs should be different due to different nutrient values
    expect(pdf1).not.toEqual(pdf2)
  })
})


