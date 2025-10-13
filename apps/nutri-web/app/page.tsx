'use client'

import { useState, useEffect } from 'react'
import SearchSection from '@/components/SearchSection'
import BarcodeSection from '@/components/BarcodeSection'
import LogSection from '@/components/LogSection'
import RecipeSection from '@/components/RecipeSection'
import UserAccountSection from '@/components/UserAccountSection'
import SyncStatus from '@/components/SyncStatus'
import SettingsSection from '@/components/SettingsSection'
import InsightsDashboard from '@/components/InsightsDashboard'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import { NormalizedFood, Recipe, User } from 'nutri-core'
import { initializeDemoSeed } from '@/demo-seed'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'search' | 'barcode' | 'recipes' | 'insights' | 'log' | 'settings'>('search')
  const [logItems, setLogItems] = useState<Array<{
    food: NormalizedFood
    servings: number
    date: string
  }>>([])
  const [currentReport, setCurrentReport] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [syncManager, setSyncManager] = useState<any>(null)

  // Load log from localStorage on mount and initialize demo seed
  useEffect(() => {
    // Initialize demo seed for mock mode
    initializeDemoSeed()

    const saved = localStorage.getItem('nutrition-log')
    if (saved) {
      try {
        setLogItems(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to parse saved log:', error)
      }
    }

    // Initialize sync manager
    const initializeSync = async () => {
      try {
        const { MockCloudService, SyncManagerImpl } = await import('nutri-sync')
        const cloudService = new MockCloudService()
        const manager = new SyncManagerImpl(cloudService)
        setSyncManager(manager)

        // Check if user is logged in
        const user = await cloudService.getCurrentUser()
        if (user) {
          setCurrentUser(user)
          await manager.initialize(user.id)
        }
      } catch (error) {
        console.error('Failed to initialize sync:', error)
      }
    }

    initializeSync()
  }, [])

  // Register service worker for PWA
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration)
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error)
        })
    }
  }, [])

  // Save log to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('nutrition-log', JSON.stringify(logItems))
  }, [logItems])

  const addToLog = (food: NormalizedFood, servings: number = 1) => {
    const today = new Date().toISOString().split('T')[0]
    setLogItems(prev => [...prev, { food, servings, date: today }])
  }

  const addRecipeToLog = (recipe: Recipe, servings: number = 1) => {
    // Convert recipe to a NormalizedFood-like object for logging
    const recipeAsFood: NormalizedFood = {
      source: 'Recipe',
      source_id: recipe.id,
      fdc_id: 0,
      food_name: recipe.name,
      brand: recipe.source || 'Custom Recipe',
      category: recipe.category,
      serving_name: `1 serving (${recipe.servings} total)`,
      serving_size_g: 100, // Placeholder - in a real app, this would be calculated
      nutrients: recipe.nutrition_per_serving,
      barcode: undefined
    }

    const today = new Date().toISOString().split('T')[0]
    setLogItems(prev => [...prev, {
      food: recipeAsFood,
      servings,
      date: today
    }])
  }

  const removeFromLog = (index: number) => {
    setLogItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateServings = (index: number, servings: number) => {
    setLogItems(prev => prev.map((item, i) =>
      i === index ? { ...item, servings } : item
    ))
  }

  return (
    <div className="space-y-8">
      {/* Header with User Account and Sync Status */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nutrition Tracker</h1>
              <p className="text-sm text-gray-500">Track your daily nutrition intake</p>
            </div>

            <div className="flex items-center gap-6">
              <SyncStatus syncManager={syncManager} onSyncComplete={() => {
                // Refresh data after sync
                const saved = localStorage.getItem('nutrition-log')
                if (saved) {
                  try {
                    setLogItems(JSON.parse(saved))
                  } catch (error) {
                    console.error('Failed to refresh log after sync:', error)
                  }
                }
              }} />

              <UserAccountSection onUserChange={(user) => {
                setCurrentUser(user)
                if (user && syncManager) {
                  syncManager.initialize(user.id)
                }
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'search', label: '🔍 Search Foods' },
            { id: 'barcode', label: '📱 Scan Barcode' },
            { id: 'recipes', label: '🍳 Browse Recipes' },
            { id: 'insights', label: '📊 Insights' },
            { id: 'log', label: `📝 Daily Log (${logItems.length})` },
            { id: 'settings', label: '⚙️ Settings' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'search' && (
          <SearchSection onAddToLog={addToLog} />
        )}
        {activeTab === 'barcode' && (
          <BarcodeSection onAddToLog={addToLog} />
        )}
        {activeTab === 'recipes' && (
          <RecipeSection
            onAddRecipeToLog={addRecipeToLog}
            currentReport={currentReport}
          />
        )}
        {activeTab === 'insights' && (
          <InsightsDashboard stage={currentUser?.preferences?.life_stage || 'pregnancy_trimester2'} />
        )}
        {activeTab === 'log' && (
          <LogSection
            items={logItems}
            onRemove={removeFromLog}
            onUpdateServings={updateServings}
            onReportGenerated={setCurrentReport}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsSection
            syncManager={syncManager}
            currentUser={currentUser}
            logItems={logItems}
            onDataImported={() => {
              // Refresh data after import
              const saved = localStorage.getItem('nutrition-log')
              if (saved) {
                try {
                  setLogItems(JSON.parse(saved))
                } catch (error) {
                  console.error('Failed to refresh log after import:', error)
                }
              }
            }}
          />
        )}
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  )
}
