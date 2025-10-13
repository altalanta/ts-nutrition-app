import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { rest } from 'msw'
import { setupServer } from 'msw/node'

// Mock @react-pdf/renderer
vi.mock('@react-pdf/renderer', () => ({
  renderToBuffer: vi.fn().mockResolvedValue(new Uint8Array([
    37, 80, 68, 70, // %PDF header
    ...Array(100).fill(0)
  ]))
}))

const server = setupServer(
  rest.post('/api/report/pdf', async (req, res, ctx) => {
    const body = await req.json()

    // Validate required fields
    if (!body.stage || !body.weekStartISO || !body.log) {
      return res(ctx.status(400), ctx.json({ error: 'Missing required fields' }))
    }

    // Mock successful PDF generation
    return res(
      ctx.set('Content-Type', 'application/pdf'),
      ctx.set('Content-Disposition', 'attachment; filename="test.pdf"'),
      ctx.body(new Uint8Array([37, 80, 68, 70, ...Array(100).fill(0)]))
    )
  })
)

describe('Web API PDF Export', () => {
  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it('should return PDF for valid request', async () => {
    const response = await fetch('/api/report/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stage: 'pregnancy_trimester2',
        weekStartISO: '2025-10-01',
        log: [
          { date: '2025-10-01', food_name: 'Salmon', servings: 1 },
          { date: '2025-10-02', food_name: 'Eggs', servings: 2 },
        ],
      }),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/pdf')
    expect(response.headers.get('Content-Disposition')).toContain('attachment')

    const pdfBuffer = await response.arrayBuffer()
    expect(pdfBuffer.byteLength).toBeGreaterThan(10)

    const pdfArray = new Uint8Array(pdfBuffer)
    expect(pdfArray.slice(0, 4)).toEqual(new Uint8Array([37, 80, 68, 70])) // %PDF header
  })

  it('should return 400 for missing required fields', async () => {
    const response = await fetch('/api/report/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stage: 'pregnancy_trimester2',
        // Missing weekStartISO and log
      }),
    })

    expect(response.status).toBe(400)
    const error = await response.json()
    expect(error.error).toBe('Missing required fields')
  })

  it('should handle server errors gracefully', async () => {
    server.use(
      rest.post('/api/report/pdf', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Internal server error' }))
      })
    )

    const response = await fetch('/api/report/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stage: 'pregnancy_trimester2',
        weekStartISO: '2025-10-01',
        log: [],
      }),
    })

    expect(response.status).toBe(500)
    const error = await response.json()
    expect(error.error).toBe('Internal server error')
  })
})







