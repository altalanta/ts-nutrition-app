'use client'

import { useState, useEffect } from 'react'
import { User, UserPreferences, AuthState } from 'nutri-sync'

interface UserAccountSectionProps {
  onUserChange?: (user: User | null) => void
}

export default function UserAccountSection({ onUserChange }: UserAccountSectionProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true
  })

  const [showLoginForm, setShowLoginForm] = useState(false)
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [registerData, setRegisterData] = useState({ email: '', password: '', name: '' })
  const [profileData, setProfileData] = useState<Partial<UserPreferences>>({})

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const { MockCloudService } = await import('nutri-sync')
      const cloudService = new MockCloudService()
      const user = await cloudService.getCurrentUser()

      if (user) {
        setAuthState({
          isAuthenticated: true,
          user,
          token: user.id,
          isLoading: false
        })
        onUserChange?.(user)
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }))
        onUserChange?.(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setAuthState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { MockCloudService } = await import('nutri-sync')
      const cloudService = new MockCloudService()

      const result = await cloudService.login(loginData.email, loginData.password)

      setAuthState({
        isAuthenticated: true,
        user: result.user,
        token: result.token,
        isLoading: false
      })

      setShowLoginForm(false)
      setLoginData({ email: '', password: '' })
      onUserChange?.(result.user)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Login failed')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { MockCloudService } = await import('nutri-sync')
      const cloudService = new MockCloudService()

      const result = await cloudService.register(
        registerData.email,
        registerData.password,
        registerData.name
      )

      setAuthState({
        isAuthenticated: true,
        user: result.user,
        token: result.token,
        isLoading: false
      })

      setShowRegisterForm(false)
      setRegisterData({ email: '', password: '', name: '' })
      onUserChange?.(result.user)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Registration failed')
    }
  }

  const handleLogout = async () => {
    try {
      const { MockCloudService } = await import('nutri-sync')
      const cloudService = new MockCloudService()
      await cloudService.logout()

      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false
      })

      onUserChange?.(null)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!authState.user) return

    try {
      // Update user preferences locally for now
      // In a real app, this would sync to the cloud
      const updatedUser = {
        ...authState.user,
        preferences: { ...authState.user.preferences, ...profileData }
      }

      setAuthState(prev => ({
        ...prev,
        user: updatedUser
      }))

      setShowProfileForm(false)
      setProfileData({})
      onUserChange?.(updatedUser)
    } catch (error) {
      alert('Failed to update profile')
    }
  }

  if (authState.isLoading) {
    return (
      <div className="flex items-center gap-3 text-gray-600">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading...</span>
      </div>
    )
  }

  if (authState.isAuthenticated && authState.user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {authState.user.name?.[0]?.toUpperCase() || authState.user.email[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{authState.user.name || 'User'}</p>
            <p className="text-xs text-gray-500">{authState.user.email}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowProfileForm(true)}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Profile
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Profile Edit Form */}
        {showProfileForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h3>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={profileData.name || authState.user.name || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Life Stage
                  </label>
                  <select
                    value={profileData.life_stage || authState.user.preferences.life_stage}
                    onChange={(e) => setProfileData(prev => ({ ...prev, life_stage: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="preconception">Preconception</option>
                    <option value="pregnancy_trimester1">Pregnancy Trimester 1</option>
                    <option value="pregnancy_trimester2">Pregnancy Trimester 2</option>
                    <option value="pregnancy_trimester3">Pregnancy Trimester 3</option>
                    <option value="lactation">Lactation</option>
                    <option value="interpregnancy">Interpregnancy</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowProfileForm(false)}
                    className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setShowLoginForm(true)}
        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Login
      </button>
      <button
        onClick={() => setShowRegisterForm(true)}
        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
      >
        Sign Up
      </button>

      {/* Login Form */}
      {showLoginForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Login</h3>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                <strong>Demo:</strong> Use any email with password "demo-password"
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLoginForm(false)}
                  className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Form */}
      {showRegisterForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Account</h3>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={registerData.name}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRegisterForm(false)}
                  className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

