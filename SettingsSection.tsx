'use client'

import { useState } from 'react'
import { User } from 'nutri-core'
import { SyncManager } from 'nutri-sync'

interface SettingsSectionProps {
  syncManager?: SyncManager
  currentUser: User | null
  logItems: any[]
  onDataImported?: () => void
}

export default function SettingsSection({ syncManager, currentUser, logItems, onDataImported }: SettingsSectionProps) {
  const [exportData, setExportData] = useState('')
  const [importData, setImportData] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: boolean; errors: string[] } | null>(null)

  const handleExport = async () => {
    if (!syncManager) return

    setIsExporting(true)
    try {
      const data = await syncManager.exportData()
      setExportData(data)

      // Also copy to clipboard
      await navigator.clipboard.writeText(data)
      alert('Data exported and copied to clipboard!')
    } catch (error) {
      alert('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async () => {
    if (!syncManager || !importData.trim()) return

    setIsImporting(true)
    setImportResult(null)

    try {
      const result = await syncManager.importData(importData)
      setImportResult(result)

      if (result.success) {
        alert('Data imported successfully!')
        setImportData('')
        onDataImported?.()
      }
    } catch (error) {
      setImportResult({
        success: false,
        errors: [error instanceof Error ? error.message : 'Import failed']
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setImportData(content)
    }
    reader.readAsText(file)
  }

  const downloadExportData = () => {
    if (!exportData) return

    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nutrition-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Settings & Data Management</h2>

      {/* Account Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>

        {currentUser ? (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{currentUser.name || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{currentUser.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Life Stage:</span>
              <span className="font-medium capitalize">{currentUser.preferences.life_stage.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Member since:</span>
              <span className="font-medium">{new Date(currentUser.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">Sign in to enable cloud sync and multi-device support</p>
            <p className="text-sm">Your data will be automatically backed up and synced across devices</p>
          </div>
        )}
      </div>

      {/* Data Export */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Export Data</h3>
        <p className="text-sm text-gray-600 mb-4">
          Export all your nutrition data including food logs, reports, and preferences.
          This data can be used to backup or transfer to another device.
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Exporting...
              </>
            ) : (
              <>
                <span>📤</span>
                Export Data
              </>
            )}
          </button>

          {exportData && (
            <button
              onClick={downloadExportData}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              📥 Download File
            </button>
          )}
        </div>

        {exportData && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Exported Data:</p>
            <textarea
              readOnly
              value={exportData}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-xs bg-gray-50"
              placeholder="Exported data will appear here..."
            />
          </div>
        )}
      </div>

      {/* Data Import */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Import Data</h3>
        <p className="text-sm text-gray-600 mb-4">
          Import nutrition data from a previous export. This will merge with your existing data.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Import from file:
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or paste exported data:
            </label>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste your exported JSON data here..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>

          <button
            onClick={handleImport}
            disabled={isImporting || !importData.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
          >
            {isImporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Importing...
              </>
            ) : (
              <>
                <span>📥</span>
                Import Data
              </>
            )}
          </button>

          {importResult && (
            <div className={`p-3 rounded-lg text-sm ${
              importResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {importResult.success ? (
                <p className="font-medium">✅ Import successful!</p>
              ) : (
                <div>
                  <p className="font-medium">❌ Import failed</p>
                  {importResult.errors.map((error, index) => (
                    <p key={index} className="text-xs mt-1">• {error}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Data Statistics */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{logItems.length}</div>
            <div className="text-sm text-gray-600">Food Entries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {new Set(logItems.map(item => item.date)).size}
            </div>
            <div className="text-sm text-gray-600">Days Logged</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(logItems.map(item => item.food.food_name)).size}
            </div>
            <div className="text-sm text-gray-600">Unique Foods</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(logItems.reduce((sum, item) => sum + item.servings, 0) * 10) / 10}
            </div>
            <div className="text-sm text-gray-600">Total Servings</div>
          </div>
        </div>
      </div>
    </div>
  )
}
