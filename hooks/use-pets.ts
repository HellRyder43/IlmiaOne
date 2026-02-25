'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Pet } from '@/lib/types'

export interface PetFormInput {
  name: string
  type: string
  breed: string
  vaccinationStatus: boolean
  photoUrl?: string
}

export function usePets(currentUserId: string | null): {
  myPets:       Pet[]
  communityPets: Pet[]
  isLoading:    boolean
  error:        string | null
  createPet:    (input: PetFormInput) => Promise<Pet>
  deletePet:    (id: string) => Promise<void>
  refresh:      () => Promise<void>
} {
  const [pets, setPets]           = useState<Pet[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const myPets       = useMemo(() => pets.filter(p => p.ownerId === currentUserId), [pets, currentUserId])
  const communityPets = useMemo(() => pets, [pets])

  const fetchPets = useCallback(async () => {
    if (!currentUserId) return
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/resident/pets')
      if (!res.ok) {
        const body = await res.json()
        throw new Error((body as { error?: string }).error ?? 'Failed to load pets')
      }
      const json = await res.json() as { pets: Pet[] }
      setPets(json.pets)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [currentUserId])

  useEffect(() => {
    fetchPets()
  }, [fetchPets])

  const createPet = async (input: PetFormInput): Promise<Pet> => {
    const res = await fetch('/api/resident/pets', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(input),
    })
    if (!res.ok) {
      const body = await res.json()
      throw new Error((body as { error?: string }).error ?? 'Failed to register pet')
    }
    const { pet } = await res.json() as { pet: Pet }
    setPets(prev => [pet, ...prev])
    return pet
  }

  const deletePet = async (id: string): Promise<void> => {
    // Optimistic remove
    setPets(prev => prev.filter(p => p.id !== id))

    const res = await fetch(`/api/resident/pets/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      // Revert on failure
      await fetchPets()
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error ?? 'Failed to delete pet')
    }
  }

  return { myPets, communityPets, isLoading, error, createPet, deletePet, refresh: fetchPets }
}
