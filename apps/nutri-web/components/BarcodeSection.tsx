'use client'

import { useState, useEffect, useRef } from 'react'
import { NormalizedFood } from 'nutri-importers'
// @ts-ignore - ZXing types not available
import { BrowserMultiFormatReader } from '@zxing/browser'

interface BarcodeSectionProps {
  onAddToLog: (food: NormalizedFood, servings?: number) => void
}

export default function BarcodeSection({ onAddToLog }: BarcodeSectionProps) {
  const [barcode, setBarcode] = useState('')
  const [result, setResult] = useState<NormalizedFood | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<any>(null) // BrowserMultiFormatReader
  const scanningRef = useRef(false)

  // Check if camera scanning is enabled
  const enableCamera = process.env.NEXT_PUBLIC_ENABLE_CAMERA === 'true'

  // Initialize ZXing reader
  useEffect(() => {
    if (enableCamera && cameraEnabled && videoRef.current && !readerRef.current) {
      readerRef.current = new BrowserMultiFormatReader()
    }

    return () => {
      if (readerRef.current) {
        readerRef.current.reset()
        readerRef.current = null
      }
    }
  }, [cameraEnabled, enableCamera])

  // Start/stop camera scanning
  useEffect(() => {
    if (!enableCamera || !cameraEnabled || !videoRef.current || !readerRef.current || scanningRef.current) {
      return
    }

    scanningRef.current = true

    const startScanning = async () => {
      try {
        setCameraError(null)
        const result = await readerRef.current!.decodeOnceFromVideoDevice(undefined, videoRef.current!)

        if (result) {
          const scannedBarcode = result.getText()
          setLastScanned(scannedBarcode)
          setBarcode(scannedBarcode)

          // Stop scanning after successful scan
          await stopScanning()
          await handleLookup(scannedBarcode)
        }
      } catch (err) {
        console.error('Camera scanning error:', err)
        setCameraError('Failed to access camera or decode barcode')
      } finally {
        scanningRef.current = false
      }
    }

    startScanning()

    return () => {
      scanningRef.current = false
    }
  }, [cameraEnabled, enableCamera])

  const startScanning = async () => {
    if (!enableCamera || !videoRef.current || !readerRef.current) return

    try {
      setCameraError(null)
      await readerRef.current.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        if (result) {
          const scannedBarcode = result.getText()
          setLastScanned(scannedBarcode)
          setBarcode(scannedBarcode)
          stopScanning()
          handleLookup(scannedBarcode)
        }
      })
    } catch (err) {
      console.error('Failed to start camera:', err)
      setCameraError('Camera access denied or not available')
    }
  }

  const stopScanning = async () => {
    if (readerRef.current) {
      await readerRef.current.reset()
    }
    setCameraEnabled(false)
    scanningRef.current = false
  }

  const handleLookup = async (barcodeValue?: string) => {
    const barcodeToLookup = barcodeValue || barcode
    if (!barcodeToLookup.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`/api/barcode?ean=${encodeURIComponent(barcodeToLookup)}`)
      const data = await response.json()

      if (response.ok) {
        setResult(data.food)
      } else {
        setError(data.error || 'Barcode lookup failed')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLookup()
    }
  }

  const handleAddToLog = () => {
    if (result) {
      const servings = prompt('Servings?', '1')
      if (servings) {
        onAddToLog(result, parseFloat(servings))
        setResult(null)
        setBarcode('')
        setLastScanned(null)
      }
    }
  }

  const handleRescan = () => {
    setLastScanned(null)
    setBarcode('')
    setResult(null)
    setError(null)
    setCameraError(null)
    setCameraEnabled(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Scan Barcode</h2>

        {/* Camera scanning section */}
        {enableCamera && (
          <div className="mb-6">
            {!cameraEnabled ? (
              <div className="text-center">
                <button
                  onClick={() => setCameraEnabled(true)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  📷 Start Camera Scan
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Scan EAN-13, EAN-8, UPC-A, UPC-E, or CODE-128 barcodes
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ maxWidth: '400px', margin: '0 auto' }}>
                  <video
                    ref={videoRef}
                    className="w-full h-auto"
                    playsInline
                    muted
                    style={{ transform: 'scaleX(-1)' }} // Mirror for better UX
                  />
                  {cameraError && (
                    <div className="absolute inset-0 bg-red-900 bg-opacity-75 flex items-center justify-center">
                      <div className="text-white text-center p-4">
                        <p className="mb-2">Camera Error</p>
                        <p className="text-sm">{cameraError}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={stopScanning}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Stop Camera
                  </button>
                  {lastScanned && (
                    <button
                      onClick={handleRescan}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Rescan
                    </button>
                  )}
                </div>

                {lastScanned && (
                  <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm">
                      Last scanned: <code className="font-mono">{lastScanned}</code>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Manual input fallback */}
        <div className="flex gap-4">
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter barcode (EAN/UPC)..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={cameraEnabled && enableCamera}
          />
          <button
            onClick={() => handleLookup()}
            disabled={loading || !barcode.trim() || (cameraEnabled && enableCamera)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Looking up...' : 'Lookup'}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Enter a barcode number (e.g., 04963406 for a product) or use camera scanning above
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Product Found</h3>

          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">Name:</span>
              <span className="ml-2">{result.food_name}</span>
            </div>

            {result.brand && (
              <div>
                <span className="font-medium text-gray-700">Brand:</span>
                <span className="ml-2">{result.brand}</span>
              </div>
            )}

            {result.barcode && (
              <div>
                <span className="font-medium text-gray-700">Barcode:</span>
                <span className="ml-2">{result.barcode}</span>
              </div>
            )}

            <div>
              <span className="font-medium text-gray-700">Source:</span>
              <span className="ml-2">{result.source} ({result.source_id})</span>
            </div>

            <div>
              <span className="font-medium text-gray-700">Serving:</span>
              <span className="ml-2">{result.serving_name}</span>
            </div>

            {/* Show nutrients */}
            {Object.entries(result.nutrients).filter(([_, value]) => value > 0).length > 0 && (
              <div>
                <span className="font-medium text-gray-700">Key nutrients:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(result.nutrients)
                    .filter(([_, value]) => value > 0)
                    .map(([key, value]) => (
                      <span key={key} className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-green-100 text-green-800">
                        {key}: {value.toFixed(1)}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleAddToLog}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add to Log
            </button>
            <button
              onClick={() => {
                setResult(null)
                setBarcode('')
              }}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


