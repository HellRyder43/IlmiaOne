'use client'

import { useState, useEffect, useCallback } from 'react'
import type { HouseChangeRequest } from '@/lib/types'

export function useAdminHouseChanges(): {
  requests:      HouseChangeRequest[]
  isLoading:     boolean
  error:         string | null
  approveRequest: (id: string) => Promise<void>
  rejectRequest:  (id: string, reason: string) => Promise<void>
  refetch:        () => Promise<void>
} {
  const [requests,  setRequests]  = useState<HouseChangeRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/house-changes')
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Failed to load house change requests')
      }
      setRequests(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const approveRequest = async (id: string): Promise<void> => {
    const res = await fetch(`/api/admin/house-changes/${id}/approve`, { method: 'POST' })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.error ?? 'Failed to approve request')
    }
    // Optimistic remove
    setRequests(prev => prev.filter(r => r.id !== id))
  }

  const rejectRequest = async (id: string, reason: string): Promise<void> => {
    const res = await fetch(`/api/admin/house-changes/${id}/reject`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ reason }),
    })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.error ?? 'Failed to reject request')
    }
    // Optimistic remove
    setRequests(prev => prev.filter(r => r.id !== id))
  }

  return { requests, isLoading, error, approveRequest, rejectRequest, refetch: fetchRequests }
}
