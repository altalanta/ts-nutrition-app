'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface ShareMetadata {
  id: string
  size: number
  meta: {
    stage: string
    weekStartISO: string
    version: string
    createdAt: string
  }
}

export default function SharePage() {
  const params = useParams()
  const token = params?.token as string

  const [metadata, setMetadata] = useState<ShareMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!token) return

    const fetchMetadata = async () => {
      try {
        const response = await fetch(`/api/share/${token}`)
        if (response.ok) {
          const data = await response.json()
          setMetadata(data)
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Link expired or invalid')
        }
      } catch (err) {
        setError('Failed to load report metadata')
      } finally {
        setLoading(false)
      }
    }

    fetchMetadata()
  }, [token])

  const downloadPDF = async () => {
    if (!token) return

    setDownloading(true)

    try {
      const response = await fetch(`/api/share/${token}?download=1`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'nutrition-report.pdf'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const errorData = await response.json()
        alert(`Download failed: ${errorData.error}`)
      }
    } catch (error) {
      alert('Failed to download PDF')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Link Expired or Invalid</h1>
          <p className="text-gray-600 mb-4">
            This shared link is no longer valid or has expired. Please ask the sender to create a new share link.
          </p>
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    )
  }

  if (!metadata) {
    return null
  }

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    })
  }

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">📊 Nutrition Report</h1>
          <p className="text-gray-600 mt-1">
            Shared report for {metadata.meta.stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Report Metadata */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Life Stage:</span>
                <p className="text-gray-900">
                  {metadata.meta.stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Week:</span>
                <p className="text-gray-900">
                  {formatDate(metadata.meta.weekStartISO)}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Generated:</span>
                <p className="text-gray-900">
                  {formatDateTime(metadata.meta.createdAt)}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">File Size:</span>
                <p className="text-gray-900">
                  {(metadata.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          </div>

          {/* Download Button */}
          <div className="mb-8">
            <button
              onClick={downloadPDF}
              disabled={downloading}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {downloading ? 'Downloading...' : '📄 Download PDF Report'}
            </button>
          </div>

          {/* About Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">About This Report</h3>

            <div className="prose prose-sm max-w-none text-gray-600">
              <p className="mb-4">
                This nutrition report provides a weekly summary of nutrient intake compared to established dietary reference values for maternal health.
              </p>

              <h4 className="text-md font-medium text-gray-800 mb-2">Data Sources & Quality</h4>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li><strong>FDC (USDA FoodData Central)</strong>: Government-verified data with highest confidence</li>
                <li><strong>Nutritionix</strong>: Commercial database with verified ingredients</li>
                <li><strong>Open Food Facts</strong>: User-contributed data with variable quality</li>
              </ul>

              <h4 className="text-md font-medium text-gray-800 mb-2">Safety Features</h4>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li><strong>Upper Limits (ULs)</strong>: Warnings at 80% and errors at 100% of established limits</li>
                <li><strong>Plausibility Guards</strong>: Values exceeding realistic thresholds are clamped</li>
                <li><strong>Clinical Citations</strong>: All values include authoritative source references</li>
              </ul>

              <h4 className="text-md font-medium text-gray-800 mb-2">Methodology</h4>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li>Vitamin A reported as Retinol Activity Equivalents (RAE)</li>
                <li>Values normalized to schema units (µg for vitamins, mg for minerals)</li>
                <li>International Units (IU) not converted</li>
              </ul>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Privacy Note:</strong> This report contains no personal identifiers.
                  Access is logged for security purposes only.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}



