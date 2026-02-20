'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface HouseWithDetails {
  id: string
  house_number: string
  street: string | null
  occupancy_status: 'OCCUPIED' | 'VACANT' | 'UNDER_RENOVATION'
  ownerName: string | null
  totalCount: number
}

interface ProfileRow {
  id: string
  full_name: string
  role: string
  status: string
}

interface HouseRow {
  id: string
  house_number: string
  street: string | null
  occupancy_status: string
  profiles: ProfileRow | ProfileRow[] | null
  house_members: { id: string }[] | null
}

export function useAdminHouses() {
  const [allHouses, setAllHouses] = useState<HouseWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const supabase = useMemo(() => createClient(), [])

  const fetchHouses = useCallback(async () => {
    setIsLoading(true)

    const { data, error } = await supabase
      .from('houses')
      .select(`
        id,
        house_number,
        street,
        occupancy_status,
        profiles(id, full_name, role, status),
        house_members(id)
      `)

    if (error || !data) {
      setIsLoading(false)
      return
    }

    const mapped = (data as HouseRow[]).map(house => {
      const rawProfiles = house.profiles
      const profiles: ProfileRow[] = rawProfiles
        ? Array.isArray(rawProfiles) ? rawProfiles : [rawProfiles]
        : []
      const owner = profiles.find(p => p.role === 'RESIDENT' && p.status === 'APPROVED')
      const members = house.house_members ?? []
      const totalCount = (owner ? 1 : 0) + members.length

      return {
        id: house.id,
        house_number: house.house_number,
        street: house.street,
        occupancy_status: house.occupancy_status as HouseWithDetails['occupancy_status'],
        ownerName: owner?.full_name ?? null,
        totalCount,
      }
    }).sort((a, b) => {
      const nA = parseInt(a.house_number) || 0
      const nB = parseInt(b.house_number) || 0
      return nA - nB
    })

    setAllHouses(mapped)
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchHouses()
  }, [fetchHouses])

  const houses = useMemo(() => {
    return allHouses.filter(h => {
      const matchesSearch =
        !search ||
        h.house_number.includes(search) ||
        (h.ownerName?.toLowerCase().includes(search.toLowerCase()) ?? false)
      const matchesStatus = statusFilter === 'all' || h.occupancy_status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [allHouses, search, statusFilter])

  return { houses, isLoading, search, setSearch, statusFilter, setStatusFilter }
}
