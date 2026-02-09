'use client'

// Authentication context and hooks for Ilmia One

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, LoginCredentials, RegisterData, UserRole } from './types'
import { ROLE_DASHBOARD, MOCK_CREDENTIALS } from './constants'

// Auth context interface
interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
}

// Create context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Storage keys
const USER_STORAGE_KEY = 'ilmia_user'
const TOKEN_STORAGE_KEY = 'ilmia_token'

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem(USER_STORAGE_KEY)
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)

        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser) as User
          setUser(parsedUser)
        }
      } catch (error) {
        console.error('Failed to load user from storage:', error)
        // Clear invalid data
        localStorage.removeItem(USER_STORAGE_KEY)
        localStorage.removeItem(TOKEN_STORAGE_KEY)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    console.log('Login function called', { email: credentials.email })
    setIsLoading(true)

    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log('Checking credentials against:', MOCK_CREDENTIALS)

      // Mock authentication - Check against mock credentials
      const matchedCredential = Object.entries(MOCK_CREDENTIALS).find(
        ([key, mockCred]) =>
          mockCred.email === credentials.email &&
          mockCred.password === credentials.password
      )

      console.log('Matched credential:', matchedCredential)

      if (!matchedCredential) {
        throw new Error('Invalid email or password')
      }

      const [, mockCred] = matchedCredential
      const authenticatedUser: User = {
        id: `${mockCred.role.toLowerCase()}-001`,
        name: getMockUserName(mockCred.role),
        email: credentials.email,
        role: mockCred.role,
        avatarUrl: getMockAvatar(mockCred.role),
        houseNumber: mockCred.role === 'RESIDENT' ? 'A-12-03' : undefined,
      }

      console.log('Authenticated user:', authenticatedUser)

      // Store user and token
      const mockToken = generateMockToken(authenticatedUser.id)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authenticatedUser))
      localStorage.setItem(TOKEN_STORAGE_KEY, mockToken)

      // Also set cookies for middleware authentication
      document.cookie = `ilmia_token=${mockToken}; path=/; max-age=86400; SameSite=Lax`
      document.cookie = `ilmia_user=${encodeURIComponent(JSON.stringify(authenticatedUser))}; path=/; max-age=86400; SameSite=Lax`

      setUser(authenticatedUser)

      // Redirect to role-based dashboard
      const dashboard = ROLE_DASHBOARD[authenticatedUser.role]
      console.log('Redirecting to:', dashboard)
      window.location.href = dashboard
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
      throw error
    }
  }

  // Register function
  const register = async (data: RegisterData): Promise<void> => {
    setIsLoading(true)

    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock registration - Create new user with RESIDENT role
      const newUser: User = {
        id: `resident-${Date.now()}`,
        name: data.fullName,
        email: data.email,
        role: 'RESIDENT',
        houseNumber: data.houseNumber,
        icNumber: data.icNumber,
        avatarUrl: getMockAvatar('RESIDENT'),
      }

      // Store user and token
      const mockToken = generateMockToken(newUser.id)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser))
      localStorage.setItem(TOKEN_STORAGE_KEY, mockToken)

      // Also set cookies for middleware authentication
      document.cookie = `ilmia_token=${mockToken}; path=/; max-age=86400; SameSite=Lax`
      document.cookie = `ilmia_user=${encodeURIComponent(JSON.stringify(newUser))}; path=/; max-age=86400; SameSite=Lax`

      setUser(newUser)

      // Redirect to resident dashboard
      window.location.href = '/resident'
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }

  // Logout function
  const logout = () => {
    // Clear storage
    localStorage.removeItem(USER_STORAGE_KEY)
    localStorage.removeItem(TOKEN_STORAGE_KEY)

    // Clear cookies
    document.cookie = 'ilmia_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'ilmia_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'

    // Clear state
    setUser(null)

    // Redirect to login
    window.location.href = '/login'
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

// Helper functions

function getMockUserName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    RESIDENT: 'Ahmad bin Abdullah',
    TREASURER: 'Sarah Lee',
    GUARD: 'Kumar Raj',
    ADMIN: 'System Administrator',
  }
  return names[role]
}

function getMockAvatar(role: UserRole): string {
  // Using UI Avatars service for consistent mock avatars
  const name = getMockUserName(role)
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5&color=fff&size=128`
}

function generateMockToken(userId: string): string {
  // Generate a mock JWT-like token (not secure, for demo only)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(
    JSON.stringify({
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    })
  )
  const signature = btoa(`mock-signature-${userId}`)

  return `${header}.${payload}.${signature}`
}

// Helper function to check if user has access to a route
export function hasAccessToRoute(user: User | null, pathname: string): boolean {
  if (!user) return false

  // Admin has access to all routes
  if (user.role === 'ADMIN') return true

  // Check role-specific routes
  if (pathname.startsWith('/resident') && user.role === 'RESIDENT') return true
  if (pathname.startsWith('/treasurer') && user.role === 'TREASURER') return true
  if (pathname.startsWith('/guard') && user.role === 'GUARD') return true

  return false
}
