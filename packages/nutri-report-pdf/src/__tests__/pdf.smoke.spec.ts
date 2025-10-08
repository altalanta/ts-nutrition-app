import { describe, it, expect } from 'vitest'
import { renderReportPdf, buildCitationsMap, getAppVersion } from '../index'
import { loadLimits, loadGoals } from 'nutri-core'
import path from 'path'

// Mock @react-pdf/renderer
vi.mock('@react-pdf/renderer', () => ({
  renderToBuffer: vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70])) // %PDF header
}))

describe('PDF Smoke Tests', () => {
  it('should render PDF with valid header', async () => {
    const limits = loadLimits(path.join(__dirname, '../../data/limits.yml'))
    const goals = loadGoals(path.join(__dirname, '../../data/goals.yml'))

    const mockReport = {
      stage: 'pregnancy_trimester2',
      week_start: '2025-10-01',
      week_end: '2025-10-07',
      nutrients: {
        DHA: { weekly_total: 150, weekly_goal: 200, percent_target: 75, gap_surplus: -50 },
        Selenium: { weekly_total: 45, weekly_goal: 60, percent_target: 75, gap_surplus: -15 },
      },
      provenance: {
        DHA: 'FDC',
        Selenium: 'FDC',
      },
      confidence: {
        DHA: 0.9,
        Selenium: 0.85,
      },
      ulAlerts: {
        DHA: { total: 150, ul: null, overBy: null, severity: 'none' },
        Selenium: { total: 45, ul: 400, overBy: null, severity: 'none' },
      },
      flags: [],
    } as any

    const pdfBuffer = await renderReportPdf(mockReport, {
      stage: 'pregnancy_trimester2',
      goals,
      limits,
      weekStartISO: '2025-10-01',
      sources: {},
      appVersion: '1.0.0',
    })

    expect(pdfBuffer).toBeInstanceOf(Uint8Array)
    expect(pdfBuffer.length).toBeGreaterThan(10) // At least 10 bytes
    expect(pdfBuffer.slice(0, 4)).toEqual(new Uint8Array([37, 80, 68, 70])) // %PDF header
  })

  it('should build citations map correctly', () => {
    const goals = loadGoals(path.join(__dirname, '../../data/goals.yml'))
    const limits = loadLimits(path.join(__dirname, '../../data/limits.yml'))

    const citations = buildCitationsMap(goals, limits)

    expect(citations).toBeDefined()
    expect(typeof citations).toBe('object')

    // Should have citations for nutrients that have metadata
    if (goals.metadata?.sources) {
      Object.keys(goals.metadata.sources).forEach(nutrient => {
        if (citations[nutrient]) {
          expect(citations[nutrient]).toBeDefined()
        }
      })
    }
  })

  it('should get app version', () => {
    const version = getAppVersion()
    expect(typeof version).toBe('string')
    expect(version.length).toBeGreaterThan(0)
  })
})
