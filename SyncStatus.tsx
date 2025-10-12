'use client'

import { useState, useEffect } from 'react'
import { SyncManager } from 'nutri-sync'

interface SyncStatusProps {
  syncManager?: SyncManager
  onSyncComplete?: () => void
}

export default function SyncStatus({ syncManager, onSyncComplete }: SyncStatusProps) {
  const [syncStatus, setSyncStatus] = useState({
    isOnline: navigator.onLine,
    lastSync: null as Date | null,
    pendingChanges: 0
  })
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    conflicts: number;
    errors: string[]
  } | null>(null)

  useEffect(() => {
    if (syncManager) {
      updateSyncStatus()
    }
  }, [syncManager])

  const updateSyncStatus = () => {
    if (syncManager) {
      setSyncStatus(syncManager.getSyncStatus())
    }
  }

  const handleManualSync = async () => {
    if (!syncManager) return

    setIsSyncing(true)
    setSyncResult(null)

    try {
      const result = await syncManager.syncNow()
      setSyncResult(result)
      updateSyncStatus()
      onSyncComplete?.()
    } catch (error) {
      setSyncResult({
        success: false,
        conflicts: 0,
        errors: [error instanceof Error ? error.message : 'Sync failed']
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never'

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  if (!syncManager) {
    return null
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Sync Status</h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${syncStatus.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-xs text-gray-500">
            {syncStatus.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Last sync:</span>
          <span className="text-gray-900">{formatLastSync(syncStatus.lastSync)}</span>
        </div>

        {syncStatus.pendingChanges > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Pending changes:</span>
            <span className="text-orange-600 font-medium">{syncStatus.pendingChanges}</span>
          </div>
        )}

        <button
          onClick={handleManualSync}
          disabled={isSyncing || !syncStatus.isOnline}
          className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
        >
          {isSyncing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Syncing...
            </>
          ) : (
            <>
              <span>🔄</span>
              Sync Now
            </>
          )}
        </button>

        {syncResult && (
          <div className={`p-3 rounded-lg text-sm ${
            syncResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {syncResult.success ? (
              <div>
                <p className="font-medium">Sync successful!</p>
                {syncResult.conflicts > 0 && (
                  <p className="text-xs mt-1">{syncResult.conflicts} conflicts resolved</p>
                )}
              </div>
            ) : (
              <div>
                <p className="font-medium">Sync failed</p>
                {syncResult.errors.map((error, index) => (
                  <p key={index} className="text-xs mt-1">• {error}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
