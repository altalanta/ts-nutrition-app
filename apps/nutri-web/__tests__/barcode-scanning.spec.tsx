import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BarcodeSection from '../components/BarcodeSection'

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_ENABLE_CAMERA: 'true',
    NEXT_PUBLIC_MOCK_MODE: 'true'
  }
}))

// Mock ZXing browser
vi.mock('@zxing/browser', () => ({
  BrowserMultiFormatReader: vi.fn().mockImplementation(() => ({
    decodeOnceFromVideoDevice: vi.fn().mockResolvedValue({
      getText: () => '041196910184'
    }),
    decodeFromVideoDevice: vi.fn(),
    reset: vi.fn().mockResolvedValue(undefined)
  }))
}))

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn()
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia
  },
  writable: true
})

// Mock fetch for API calls
global.fetch = vi.fn()

describe('BarcodeSection - Camera Scanning', () => {
  const mockOnAddToLog = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock successful camera access
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }]
    })

    // Mock successful API response
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        food: {
          food_name: 'Test Food',
          brand: 'Test Brand',
          barcode: '041196910184',
          nutrients: { Protein: 10 }
        }
      })
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should show camera scanning UI when enabled', () => {
    render(<BarcodeSection onAddToLog={mockOnAddToLog} />)

    expect(screen.getByText('📷 Start Camera Scan')).toBeInTheDocument()
    expect(screen.getByText('Scan EAN-13, EAN-8, UPC-A, UPC-E, or CODE-128 barcodes')).toBeInTheDocument()
  })

  it('should start camera when start button is clicked', async () => {
    const user = userEvent.setup()
    render(<BarcodeSection onAddToLog={mockOnAddToLog} />)

    const startButton = screen.getByText('📷 Start Camera Scan')
    await user.click(startButton)

    await waitFor(() => {
      expect(screen.getByText('Stop Camera')).toBeInTheDocument()
    })
  })

  it('should handle camera access denial', async () => {
    const user = userEvent.setup()
    mockGetUserMedia.mockRejectedValue(new Error('Permission denied'))

    render(<BarcodeSection onAddToLog={mockOnAddToLog} />)

    const startButton = screen.getByText('📷 Start Camera Scan')
    await user.click(startButton)

    await waitFor(() => {
      expect(screen.getByText('Camera Error')).toBeInTheDocument()
    })
  })

  it('should perform barcode lookup when scan succeeds', async () => {
    const user = userEvent.setup()
    render(<BarcodeSection onAddToLog={mockOnAddToLog} />)

    const startButton = screen.getByText('📷 Start Camera Scan')
    await user.click(startButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/barcode?ean=041196910184')
    })
  })

  it('should show scanned barcode result', async () => {
    const user = userEvent.setup()
    render(<BarcodeSection onAddToLog={mockOnAddToLog} />)

    const startButton = screen.getByText('📷 Start Camera Scan')
    await user.click(startButton)

    await waitFor(() => {
      expect(screen.getByText('Last scanned:')).toBeInTheDocument()
      expect(screen.getByText('041196910184')).toBeInTheDocument()
    })
  })

  it('should allow rescan after successful scan', async () => {
    const user = userEvent.setup()
    render(<BarcodeSection onAddToLog={mockOnAddToLog} />)

    const startButton = screen.getByText('📷 Start Camera Scan')
    await user.click(startButton)

    await waitFor(() => {
      expect(screen.getByText('Rescan')).toBeInTheDocument()
    })

    const rescanButton = screen.getByText('Rescan')
    await user.click(rescanButton)

    // Should reset and allow new scan
    expect(screen.queryByText('Last scanned:')).not.toBeInTheDocument()
  })

  it('should fallback to manual input when camera is disabled', () => {
    // Mock camera disabled
    vi.mocked(process.env.NEXT_PUBLIC_ENABLE_CAMERA).mockReturnValue('false')

    render(<BarcodeSection onAddToLog={mockOnAddToLog} />)

    expect(screen.queryByText('📷 Start Camera Scan')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter barcode (EAN/UPC)...')).toBeInTheDocument()
  })

  it('should disable manual input when camera is active', async () => {
    const user = userEvent.setup()
    render(<BarcodeSection onAddToLog={mockOnAddToLog} />)

    const startButton = screen.getByText('📷 Start Camera Scan')
    await user.click(startButton)

    await waitFor(() => {
      const manualInput = screen.getByPlaceholderText('Enter barcode (EAN/UPC)...')
      expect(manualInput).toBeDisabled()
    })
  })
})

