'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CoResident, FamilyMember, HousePendingChange, ResidencyType } from '@/lib/types'

export interface HouseholdData {
  residentType:       ResidencyType | null
  houseId:            string | null
  houseNumber:        string | null
  street:             string | null
  coResidents:        CoResident[]
  members:            FamilyMember[]
  pendingHouseChange: HousePendingChange | null
}

export interface AddMemberInput {
  name:         string
  relationship: 'SPOUSE' | 'CHILD' | 'RELATIVE' | 'TENANT'
  phoneNumber?: string
}

export function useHousehold(currentUserId: string | null): {
  data:               HouseholdData | null
  isLoading:          boolean
  error:              string | null
  updateResidentType: (type: ResidencyType) => Promise<void>
  updateHouseNumber:  (houseNumber: string) => Promise<{ pending: boolean }>
  cancelHouseChange:  () => Promise<void>
  addMember:          (input: AddMemberInput) => Promise<void>
  removeMember:       (id: string) => Promise<void>
  refresh:            () => Promise<void>
} {
  const [data, setData]           = useState<HouseholdData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // Stable Supabase client (not actually used for fetching here — data comes from API)
  // Kept to match pattern used in other hooks; may be used for optimistic updates.
  useMemo(() => createClient(), [])

  const fetchHousehold = useCallback(async () => {
    if (!currentUserId) return
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/resident/household')
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Failed to load household data')
      }
      const json = await res.json() as {
        residentType:       string | null
        houseId:            string | null
        houseNumber:        string | null
        street:             string | null
        coResidents:        { id: string; fullName: string; email: string; residentType: string | null }[]
        members:            { id: string; houseId: string; name: string; relationship: string; phoneNumber?: string; createdAt?: string }[]
        pendingHouseChange: { id: string; requestedHouseId: string; requestedHouseNumber: string } | null
      }

      setData({
        residentType: json.residentType as ResidencyType | null,
        houseId:      json.houseId,
        houseNumber:  json.houseNumber,
        street:       json.street,
        coResidents:  json.coResidents.map(cr => ({
          id:            cr.id,
          fullName:      cr.fullName,
          email:         cr.email,
          residentType:  cr.residentType as ResidencyType | null,
          isCurrentUser: cr.id === currentUserId,
        })),
        members: json.members.map(m => ({
          id:           m.id,
          houseId:      m.houseId,
          name:         m.name,
          relationship: m.relationship as FamilyMember['relationship'],
          phoneNumber:  m.phoneNumber,
          createdAt:    m.createdAt,
        })),
        pendingHouseChange: json.pendingHouseChange ?? null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [currentUserId])

  useEffect(() => {
    fetchHousehold()
  }, [fetchHousehold])

  const updateResidentType = async (type: ResidencyType): Promise<void> => {
    const res = await fetch('/api/resident/household', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ residentType: type }),
    })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.error ?? 'Failed to update resident type')
    }
    // Optimistic update
    setData(prev => prev ? { ...prev, residentType: type } : prev)
  }

  const updateHouseNumber = async (houseNumber: string): Promise<{ pending: boolean }> => {
    const res = await fetch('/api/resident/household', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ houseNumber }),
    })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.error ?? 'Failed to update house number')
    }
    const result = await res.json() as
      | { houseId: string; houseNumber: string; street: string | null }
      | { pending: true; requestId: string; requestedHouseNumber: string; requestedHouseId: string }

    if ('pending' in result && result.pending) {
      // Change request submitted — update pending state without changing house_id
      setData(prev => prev ? {
        ...prev,
        pendingHouseChange: {
          id:                   result.requestId,
          requestedHouseId:     result.requestedHouseId,
          requestedHouseNumber: result.requestedHouseNumber,
        },
      } : prev)
      return { pending: true }
    }

    // Direct update (AJK roles) — update house fields and refetch
    const direct = result as { houseId: string; houseNumber: string; street: string | null }
    setData(prev => prev ? {
      ...prev,
      houseId:            direct.houseId,
      houseNumber:        direct.houseNumber,
      street:             direct.street,
      coResidents:        [],
      members:            [],
      pendingHouseChange: null,
    } : prev)
    await fetchHousehold()
    return { pending: false }
  }

  const cancelHouseChange = async (): Promise<void> => {
    const res = await fetch('/api/resident/household/change-request', { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.error ?? 'Failed to cancel house change request')
    }
    setData(prev => prev ? { ...prev, pendingHouseChange: null } : prev)
  }

  const addMember = async (input: AddMemberInput): Promise<void> => {
    const res = await fetch('/api/resident/household/members', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(input),
    })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.error ?? 'Failed to add member')
    }
    // Refetch to get server-generated id + createdAt
    await fetchHousehold()
  }

  const removeMember = async (id: string): Promise<void> => {
    // Optimistic remove before API call for snappy UX
    setData(prev => prev ? { ...prev, members: prev.members.filter(m => m.id !== id) } : prev)

    const res = await fetch(`/api/resident/household/members/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      // Revert optimistic update on failure
      await fetchHousehold()
      const body = await res.json()
      throw new Error(body.error ?? 'Failed to remove member')
    }
  }

  return { data, isLoading, error, updateResidentType, updateHouseNumber, cancelHouseChange, addMember, removeMember, refresh: fetchHousehold }
}
