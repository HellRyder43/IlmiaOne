'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Role, RolePermissions } from '@/lib/types'

export interface CreateRoleData {
  value:        string
  displayName:  string
  description?: string
  color?:       string
  permissions:  RolePermissions
}

export interface UpdateRoleData {
  displayName?:  string
  description?:  string
  color?:        string
  permissions?:  RolePermissions
}

export function useAdminRoles() {
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stable Supabase client — used only to get the session for auth headers
  const supabase = useMemo(() => createClient(), [])

  const fetchRoles = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/roles')
      if (!res.ok) throw new Error('Failed to fetch roles')
      const data: Role[] = await res.json()
      setRoles(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch roles')
    } finally {
      setIsLoading(false)
    }
    // supabase is used indirectly via the API route — included for stability
    void supabase
  }, [supabase])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const createRole = useCallback(async (data: CreateRoleData): Promise<void> => {
    const res = await fetch('/api/admin/roles', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.error ?? 'Failed to create role')
    }
    await fetchRoles()
  }, [fetchRoles])

  const updateRole = useCallback(async (id: string, data: UpdateRoleData): Promise<void> => {
    const res = await fetch(`/api/admin/roles/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.error ?? 'Failed to update role')
    }
    await fetchRoles()
  }, [fetchRoles])

  const deleteRole = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/admin/roles/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.error ?? 'Failed to delete role')
    }
    await fetchRoles()
  }, [fetchRoles])

  return { roles, isLoading, error, createRole, updateRole, deleteRole, refetch: fetchRoles }
}
