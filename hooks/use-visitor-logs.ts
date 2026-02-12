'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { EntryLog, GuardStats } from '@/lib/types'

export function useVisitorLogs() {
  const [logs, setLogs] = useState<EntryLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchLogs = useCallback(async (filter?: { status?: string; search?: string }) => {
    setIsLoading(true)
    setError(null)

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 90)

    let query = supabase
      .from('visitor_logs')
      .select('*')
      .gte('check_in_time', cutoff.toISOString())
      .order('check_in_time', { ascending: false })

    if (filter?.status && filter.status !== 'ALL') {
      query = query.eq('status', filter.status)
    }

    const { data, error: queryError } = await query

    if (queryError) {
      setError(queryError.message)
      setIsLoading(false)
      return
    }

    let mapped: EntryLog[] = (data ?? []).map(row => ({
      id: row.id,
      preRegistrationId: row.pre_registration_id ?? undefined,
      visitorName: row.visitor_name,
      visitorType: row.visitor_type,
      visitReason: row.visit_reason,
      houseNumber: row.house_number,
      icNumber: row.ic_number ?? undefined,
      vehicleNumber: row.vehicle_number ?? undefined,
      phoneNumber: row.phone_number ?? undefined,
      checkInTime: row.check_in_time,
      checkOutTime: row.check_out_time ?? undefined,
      status: row.status,
      guardId: row.guard_id,
      entryMethod: row.entry_method,
    }))

    if (filter?.search) {
      const s = filter.search.toLowerCase()
      mapped = mapped.filter(l =>
        l.visitorName.toLowerCase().includes(s) ||
        l.houseNumber.toLowerCase().includes(s) ||
        (l.vehicleNumber?.toLowerCase().includes(s) ?? false),
      )
    }

    setLogs(mapped)
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const checkOut = async (id: string) => {
    const { error: updateError } = await supabase
      .from('visitor_logs')
      .update({
        check_out_time: new Date().toISOString(),
        status: 'EXITED',
      })
      .eq('id', id)

    if (updateError) throw new Error(updateError.message)
    await fetchLogs()
  }

  return { logs, isLoading, error, fetchLogs, checkOut }
}

export function useGuardStats() {
  const [stats, setStats] = useState<GuardStats>({
    visitorsInside: 0,
    deliveriesToday: 0,
    totalEntriesToday: 0,
    overstayedVisitors: 0,
  })
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()

  const fetchStats = useCallback(async () => {
    setIsLoading(true)

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000)

    const [inside, deliveries, total, overstayed] = await Promise.all([
      supabase
        .from('visitor_logs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'INSIDE'),
      supabase
        .from('visitor_logs')
        .select('id', { count: 'exact', head: true })
        .in('visitor_type', ['E_HAILING', 'COURIER'])
        .gte('check_in_time', todayStart.toISOString()),
      supabase
        .from('visitor_logs')
        .select('id', { count: 'exact', head: true })
        .gte('check_in_time', todayStart.toISOString()),
      supabase
        .from('visitor_logs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'INSIDE')
        .lt('check_in_time', fourHoursAgo.toISOString()),
    ])

    setStats({
      visitorsInside: inside.count ?? 0,
      deliveriesToday: deliveries.count ?? 0,
      totalEntriesToday: total.count ?? 0,
      overstayedVisitors: overstayed.count ?? 0,
    })
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, isLoading, refresh: fetchStats }
}
