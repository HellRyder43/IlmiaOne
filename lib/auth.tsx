'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from './supabase/client'
import type { User, LoginCredentials, RegisterData, UserRole } from './types'
import { ROLE_DASHBOARD } from './constants'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = useMemo(() => createClient(), [])

  const loadUserProfile = useCallback(async (userId: string): Promise<User | null> => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, houses(house_number)')
      .eq('id', userId)
      .single()

    if (!profile) return null

    return {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: profile.role as UserRole,
      houseNumber: (profile.houses as { house_number: string } | null)?.house_number,
      houseId: profile.house_id,
      icNumber: profile.ic_number,
      residentType: profile.resident_type,
      status: profile.status,
      avatarUrl: profile.avatar_url,
    }
  }, [supabase])

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const profile = await loadUserProfile(session.user.id)
          setUser(profile)
        }
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await loadUserProfile(session.user.id)
        setUser(profile)
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, loadUserProfile])

  const login = async (credentials: LoginCredentials): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) throw new Error(error.message)

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const profile = await loadUserProfile(authUser.id)
      if (profile) {
        setUser(profile)
        window.location.href = ROLE_DASHBOARD[profile.role]
      }
    }
  }

  const register = async (data: RegisterData): Promise<void> => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.fullName },
      },
    })

    if (authError) throw new Error(authError.message)
    if (!authData.user) throw new Error('Registration failed — please try again.')

    const { data: house } = await supabase
      .from('houses')
      .select('id')
      .eq('house_number', data.houseNumber)
      .single()

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: data.fullName,
        email: data.email,
        role: 'RESIDENT',
        house_id: house?.id ?? null,
        ic_number: data.icNumber.slice(-4),
        resident_type: data.residentType,
        status: 'PENDING_APPROVAL',
      })

    if (profileError) throw new Error('Failed to create profile — please contact support.')

    const { data: treasurers } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'TREASURER')
      .eq('status', 'APPROVED')

    if (treasurers?.length) {
      await supabase.from('notifications').insert(
        treasurers.map((t: { id: string }) => ({
          user_id: t.id,
          title: 'New Registration Pending',
          message: `${data.fullName} from house ${data.houseNumber} has registered and is awaiting approval.`,
          type: 'REGISTRATION_PENDING',
        }))
      )
    }
  }

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export function hasAccessToRoute(user: User | null, pathname: string): boolean {
  if (!user) return false
  if (user.role === 'ADMIN') return true
  if (pathname.startsWith('/resident') && user.role === 'RESIDENT') return true
  if (pathname.startsWith('/treasurer') && user.role === 'TREASURER') return true
  if (pathname.startsWith('/guard') && user.role === 'GUARD') return true
  return false
}
