'use client'

import { useState, useEffect } from 'react'

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as any).standalone === true) {
        setIsInstalled(true)
        return
      }
    }

    checkInstalled()

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
  }

  // Don't show if already installed or no prompt available
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              📱
            </div>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-900">
              Install Nutrition Tracker
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Install our app for a better experience with offline support and quick access.
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleInstallClick}
              className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-700 mr-2"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Dismiss</span>
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

