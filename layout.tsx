import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Nutrition Tracker',
  description: 'Track your daily nutrition intake and get personalized reports',
  manifest: '/manifest.webmanifest',
  themeColor: '#3b82f6',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <h1 className="text-2xl font-bold text-gray-900">🍎 Nutrition Tracker</h1>
              <p className="text-gray-600">Track your nutrition and get personalized reports</p>
            </div>
          </header>
          <main className="max-w-4xl mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
