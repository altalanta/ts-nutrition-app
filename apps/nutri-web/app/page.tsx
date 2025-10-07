'use client'

import { useState, useEffect } from 'react'
import SearchSection from '@/components/SearchSection'
import BarcodeSection from '@/components/BarcodeSection'
import LogSection from '@/components/LogSection'
import { NormalizedFood } from 'nutri-importers'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'search' | 'barcode' | 'log'>('search')
  const [logItems, setLogItems] = useState<Array<{
    food: NormalizedFood
    servings: number
    date: string
  }>>([])

  // Load log from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('nutrition-log')
    if (saved) {
      try {
        setLogItems(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to parse saved log:', error)
      }
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
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'search', label: '🔍 Search Foods' },
            { id: 'barcode', label: '📱 Scan Barcode' },
            { id: 'log', label: `📝 Daily Log (${logItems.length})` },
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
        {activeTab === 'log' && (
          <LogSection
            items={logItems}
            onRemove={removeFromLog}
            onUpdateServings={updateServings}
          />
        )}
      </div>
    </div>
  )
}
