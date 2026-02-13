'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { VisitorPass, VisitorType } from '@/lib/types'

interface PreRegistrationRow {
  id: string
  resident_id: string
  house_id: string
  visitor_name: string
  visitor_type: string
  visit_reason: string
  expected_date: string
  phone_number: string | null
  vehicle_number: string | null
  qr_code: string
  status: string
  expires_at: string
  created_at: string
}

interface CreatePassData {
  visitorName: string
  visitorType: string
  visitReason: string
  expectedDate: string
  phoneNumber?: string
  vehicleNumber?: string
  houseId: string
}

export function usePreRegistrations(residentId: string | null) {
  const [passes, setPasses] = useState<VisitorPass[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const fetchPasses = useCallback(async () => {
    if (!residentId) return
    setIsLoading(true)
    setError(null)

    const { data, error: queryError } = await supabase
      .from('visitor_pre_registrations')
      .select('*')
      .eq('resident_id', residentId)
      .order('created_at', { ascending: false })

    if (queryError) {
      setError(queryError.message)
      setIsLoading(false)
      return
    }

    setPasses(
      ((data ?? []) as PreRegistrationRow[]).map(row => ({
        id: row.id,
        residentId: row.resident_id,
        houseId: row.house_id,
        visitorName: row.visitor_name,
        visitorType: row.visitor_type as VisitorType,
        visitReason: row.visit_reason,
        expectedDate: row.expected_date,
        phoneNumber: row.phone_number ?? undefined,
        vehicleNumber: row.vehicle_number ?? undefined,
        qrCode: row.qr_code,
        status: row.status as 'ACTIVE' | 'USED' | 'EXPIRED',
        expiresAt: row.expires_at,
        createdAt: row.created_at,
      })),
    )
    setIsLoading(false)
  }, [residentId, supabase])

  useEffect(() => {
    fetchPasses()
  }, [fetchPasses])

  const createPass = async (formData: CreatePassData): Promise<void> => {
    const res = await fetch('/api/visitors/pre-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.error ?? 'Failed to create visitor pass')
    }
    await fetchPasses()
  }

  const revokePass = async (id: string): Promise<void> => {
    const { error: updateError } = await supabase
      .from('visitor_pre_registrations')
      .update({ status: 'EXPIRED' })
      .eq('id', id)
    if (updateError) throw new Error(updateError.message)
    await fetchPasses()
  }

  return { passes, isLoading, error, createPass, revokePass, refresh: fetchPasses }
}
