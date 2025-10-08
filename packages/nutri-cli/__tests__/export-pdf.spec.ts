import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

// Mock @react-pdf/renderer
vi.mock('@react-pdf/renderer', () => ({
  renderToBuffer: vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70]))
}))

describe('CLI export-pdf command', () => {
  let tempDir: string
  let testLogPath: string
  let testSchemaPath: string
  let testGoalsPath: string
  let testLimitsPath: string
  let outputPath: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(__dirname, 'test-'))
    testLogPath = path.join(tempDir, 'test-log.csv')
    testSchemaPath = path.join(tempDir, 'schema.yml')
    testGoalsPath = path.join(tempDir, 'goals.yml')
    testLimitsPath = path.join(tempDir, 'limits.yml')
    outputPath = path.join(tempDir, 'output.pdf')

    // Create test files
    fs.writeFileSync(testLogPath, 'date,food_name,servings\n2025-10-01,Salmon,1\n')
    fs.writeFileSync(testSchemaPath, 'nutrients: {}\nserving_fields: []\nfood_fields_required: []')
    fs.writeFileSync(testGoalsPath, 'pregnancy_trimester2: { DHA: 200 }')
    fs.writeFileSync(testLimitsPath, 'units_base: { µg: "microgram" }\nUL: { pregnancy: {} }\nplausibility_per_100g: {}\nconfidence_weights: {}')
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('should export PDF successfully with valid inputs', async () => {
    const cliPath = path.join(__dirname, '../src/index.ts')

    return new Promise((resolve, reject) => {
      const child = spawn('node', [
        '--loader', 'ts-node/esm',
        cliPath,
        'export-pdf',
        '--stage', 'pregnancy_trimester2',
        '--log', testLogPath,
        '--goals', testGoalsPath,
        '--schema', testSchemaPath,
        '--limits', testLimitsPath,
        '--week-start', '2025-10-01',
        '--out', outputPath
      ], {
        stdio: 'pipe',
        cwd: path.join(__dirname, '../../..')
      })

      let stdout = ''
      let stderr = ''

      child.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      child.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      child.on('close', (code) => {
        try {
          expect(code).toBe(0)
          expect(stdout).toContain('PDF exported to:')
          expect(fs.existsSync(outputPath)).toBe(true)

          const pdfBuffer = fs.readFileSync(outputPath)
          expect(pdfBuffer.length).toBeGreaterThan(10)

          resolve(undefined)
        } catch (error) {
          reject(error)
        }
      })

      child.on('error', reject)
    })
  }, 10000)

  it('should fail with missing required files', async () => {
    const cliPath = path.join(__dirname, '../src/index.ts')

    return new Promise((resolve, reject) => {
      const child = spawn('node', [
        '--loader', 'ts-node/esm',
        cliPath,
        'export-pdf',
        '--stage', 'pregnancy_trimester2',
        '--log', '/nonexistent/log.csv', // Non-existent file
        '--goals', testGoalsPath,
        '--schema', testSchemaPath,
        '--limits', testLimitsPath,
        '--week-start', '2025-10-01',
        '--out', outputPath
      ], {
        stdio: 'pipe',
        cwd: path.join(__dirname, '../../..')
      })

      let stderr = ''

      child.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      child.on('close', (code) => {
        try {
          expect(code).toBe(1)
          expect(stderr).toContain('File not found')
          expect(fs.existsSync(outputPath)).toBe(false)
          resolve(undefined)
        } catch (error) {
          reject(error)
        }
      })

      child.on('error', reject)
    })
  }, 10000)
})
