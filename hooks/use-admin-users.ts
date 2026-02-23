'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface AdminUser {
  id: string
  fullName: string
  email: string
  role: string
  houseNumber: string | null
  street: string | null
  active: boolean
  createdVia: 'SELF_REGISTRATION' | 'INVITED'
}

interface ProfileRow {
  id: string
  full_name: string
  email: string
  role: string
  status: string
  created_via: string
  houses: { house_number: string; street: string | null } | null
}

export function useAdminUsers() {
  const [allUsers, setAllUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const supabase = useMemo(() => createClient(), [])

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, status, created_via, houses(house_number, street)')
      .order('full_name')

    if (fetchError) {
      setError(fetchError.message)
      setIsLoading(false)
      return
    }

    const mapped: AdminUser[] = ((data ?? []) as unknown as ProfileRow[]).map((row: ProfileRow) => {
      const house = row.houses
      return {
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        role: row.role,
        houseNumber: house ? house.house_number : null,
        street: house ? (house.street ?? null) : null,
        active: row.status === 'APPROVED',
        createdVia: (row.created_via as 'SELF_REGISTRATION' | 'INVITED') ?? 'SELF_REGISTRATION',
      }
    })

    setAllUsers(mapped)
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const users = useMemo(() => {
    const q = search.toLowerCase()
    return allUsers.filter(u => {
      const matchesSearch =
        !q ||
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      const matchesRole = roleFilter === 'all' || u.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [allUsers, search, roleFilter])

  return { users, isLoading, error, search, setSearch, roleFilter, setRoleFilter, refetch: fetchUsers }
}
