'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Relationship } from '@/lib/types'

export interface HouseMember {
  id: string
  name: string
  relationship: Relationship
  phoneNumber: string | null
}

export interface HousePrimaryResident {
  id: string
  fullName: string
  residentType: 'OWNER' | 'TENANT' | null
}

export interface HouseWithDetails {
  id: string
  house_number: string
  street: string | null
  occupancy_status: 'OCCUPIED' | 'VACANT' | 'UNDER_RENOVATION'
  ownerName: string | null
  residentType: 'OWNER' | 'TENANT' | null
  totalCount: number
  members: HouseMember[]
  primaryResident: HousePrimaryResident | null
}

interface ProfileRow {
  id: string
  full_name: string
  role: string
  status: string
  resident_type: string | null
}

interface HouseMemberRow {
  id: string
  name: string
  relationship: string
  phone_number: string | null
}

interface HouseRow {
  id: string
  house_number: string
  street: string | null
  occupancy_status: string
  profiles: ProfileRow | ProfileRow[] | null
  house_members: HouseMemberRow[] | null
}

export function useAdminHouses() {
  const [allHouses, setAllHouses] = useState<HouseWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [residencyFilter, setResidencyFilter] = useState('all')

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
        profiles(id, full_name, role, status, resident_type),
        house_members(id, name, relationship, phone_number)
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
      const owner = profiles.find(p => p.status === 'APPROVED')
      const rawMembers = house.house_members ?? []
      const members: HouseMember[] = rawMembers.map(m => ({
        id: m.id,
        name: m.name,
        relationship: m.relationship as Relationship,
        phoneNumber: m.phone_number,
      }))
      const totalCount = (owner ? 1 : 0) + members.length

      const primaryResident: HousePrimaryResident | null = owner
        ? { id: owner.id, fullName: owner.full_name, residentType: (owner.resident_type as 'OWNER' | 'TENANT' | null) ?? null }
        : null

      return {
        id: house.id,
        house_number: house.house_number,
        street: house.street,
        occupancy_status: house.occupancy_status as HouseWithDetails['occupancy_status'],
        ownerName: owner?.full_name ?? null,
        residentType: (owner?.resident_type as 'OWNER' | 'TENANT' | null) ?? null,
        totalCount,
        members,
        primaryResident,
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
      const matchesResidency = residencyFilter === 'all' || h.residentType === residencyFilter
      return matchesSearch && matchesStatus && matchesResidency
    })
  }, [allHouses, search, statusFilter, residencyFilter])

  return { houses, isLoading, search, setSearch, statusFilter, setStatusFilter, residencyFilter, setResidencyFilter }
}
