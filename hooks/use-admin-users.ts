'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface AdminUser {
  id: string
  fullName: string
  email: string
  role: string
  houseNumber: string | null
  active: boolean
}

interface ProfileRow {
  id: string
  full_name: string
  email: string
  role: string
  status: string
  houses: { house_number: string } | null
}

export function useAdminUsers() {
  const [allUsers, setAllUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const supabase = useMemo(() => createClient(), [])

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, status, houses(house_number)')
      .order('full_name')

    if (error) {
      console.error('Failed to fetch users:', error)
      setIsLoading(false)
      return
    }

    const mapped: AdminUser[] = ((data ?? []) as unknown as ProfileRow[]).map(row => {
      const house = row.houses
      return {
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        role: row.role,
        houseNumber: house ? house.house_number : null,
        active: row.status === 'APPROVED',
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

  return { users, isLoading, search, setSearch, roleFilter, setRoleFilter, refetch: fetchUsers }
}
