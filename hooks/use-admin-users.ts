'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

export interface AdminUser {
  id: string
  fullName: string
  email: string
  role: string
  houseNumber: string | null
  street: string | null
  active: boolean
  createdVia: 'SELF_REGISTRATION' | 'INVITED'
  hasLoggedIn: boolean
  inviteAccepted: boolean
}

export function useAdminUsers() {
  const [allUsers, setAllUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const res = await fetch('/api/admin/users')
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError((body as { error?: string }).error ?? 'Failed to load users')
      setIsLoading(false)
      return
    }

    const data: AdminUser[] = await res.json()
    setAllUsers(data)
    setIsLoading(false)
  }, [])

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
