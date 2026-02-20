'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from './supabase/client'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import type { User, LoginCredentials, RegisterData, UserRole, AppPermission, RolePermissions } from './types'
import { ROLE_DASHBOARD } from './constants'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  hasPermission: (action: AppPermission) => boolean
  hasRoute: (routePrefix: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const EMPTY_PERMISSIONS: RolePermissions = { routes: [], actions: [] }

// Extract a minimal User from a Supabase session without a DB query.
// Role and permissions are read from JWT claims (set by custom_access_token_hook)
// with fallback to app_metadata. Returns null if no role can be determined.
function extractUserFromSession(session: Session): User | null {
  let role: UserRole | undefined
  let permissions: RolePermissions = EMPTY_PERMISSIONS

  try {
    const payload = JSON.parse(atob(session.access_token.split('.')[1]))
    if (payload.user_role) role = payload.user_role as UserRole
    if (payload.user_routes || payload.user_actions) {
      permissions = {
        routes:  Array.isArray(payload.user_routes)  ? payload.user_routes  : [],
        actions: Array.isArray(payload.user_actions) ? payload.user_actions : [],
      }
    }
  } catch {
    // JWT decode failed — fall through to app_metadata
  }

  if (!role) {
    role = session.user.app_metadata?.user_role as UserRole | undefined
  }

  if (!role) return null

  return {
    id:          session.user.id,
    name:        session.user.user_metadata?.full_name ?? session.user.email ?? '',
    email:       session.user.email ?? '',
    role,
    permissions,
    status:      'APPROVED',
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const loadUserProfile = useCallback(async (userId: string): Promise<User | null> => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, houses(house_number)')
      .eq('id', userId)
      .single()

    if (!profile) return null

    // Permissions are populated from the JWT (already set by extractUserFromSession).
    // We don't re-fetch them from DB here to avoid a second query; the JWT phase already
    // has them. The full profile enriches with houseNumber, icNumber, etc.
    return {
      id:              profile.id,
      name:            profile.full_name,
      email:           profile.email,
      role:            profile.role as UserRole,
      permissions:     EMPTY_PERMISSIONS,  // will be merged below
      houseNumber:     (profile.houses as { house_number: string } | null)?.house_number,
      houseId:         profile.house_id,
      icNumber:        profile.ic_number,
      residentType:    profile.resident_type,
      status:          profile.status,
      avatarUrl:       profile.avatar_url,
      rejectionReason: profile.rejection_reason ?? undefined,
    }
  }, [supabase])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          // Phase 1: Unblock the UI instantly using session data — no DB query
          const sessionUser = extractUserFromSession(session)
          if (sessionUser) {
            setUser(prev => {
              // Don't overwrite a full profile (with houseNumber) with partial session data,
              // but always preserve permissions from the latest JWT
              if (prev?.id === sessionUser.id && prev.houseNumber !== undefined) {
                return { ...prev, permissions: sessionUser.permissions }
              }
              return sessionUser
            })
          }
          setIsLoading(false)

          // Phase 2: Enrich with full profile in the background (preserves JWT permissions)
          loadUserProfile(session.user.id).then(fullProfile => {
            if (fullProfile) {
              setUser(prev => {
                if (prev?.id !== fullProfile.id) return prev
                // Keep permissions from the JWT-enriched state
                return { ...fullProfile, permissions: prev?.permissions ?? EMPTY_PERMISSIONS }
              })
            }
          })
        } else {
          setUser(null)
          setIsLoading(false)
        }
      }
    )

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
        // Merge permissions from the current session JWT
        const { data: { session } } = await supabase.auth.getSession()
        const sessionUser = session ? extractUserFromSession(session) : null
        setUser({ ...profile, permissions: sessionUser?.permissions ?? EMPTY_PERMISSIONS })
        const dashboard = ROLE_DASHBOARD[profile.role] ?? '/resident'
        router.replace(dashboard)
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

    // Profile creation + in-app notifications done server-side via service role
    // (bypasses RLS — necessary because email confirmation means no session yet)
    const profileRes = await fetch('/api/auth/register-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: authData.user.id,
        fullName: data.fullName,
        email: data.email,
        houseNumber: data.houseNumber,
        icNumber: data.icNumber,
        residentType: data.residentType,
      }),
    })

    if (!profileRes.ok) {
      const body = await profileRes.json()
      throw new Error(body.error ?? 'Failed to create profile — please contact support.')
    }

    // Fire-and-forget: send email notification to admins (non-blocking)
    fetch('/api/auth/notify-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        residentName: data.fullName,
        houseNumber: data.houseNumber,
        residentEmail: data.email,
      }),
    }).catch(() => {})
  }

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = '/login'
  }

  const hasPermission = useCallback((action: AppPermission): boolean => {
    return user?.permissions.actions.includes(action) ?? false
  }, [user])

  const hasRoute = useCallback((routePrefix: string): boolean => {
    return user?.permissions.routes.includes(routePrefix) ?? false
  }, [user])

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, hasPermission, hasRoute }}
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
  return user.permissions.routes.some(r => pathname.startsWith(`/${r}`))
}
