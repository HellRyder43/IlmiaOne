'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'

type ActivityType = 'success' | 'warning' | 'info'

interface ActivityItem {
  action: string
  detail: string
  time: string
  type: ActivityType
}

interface AdminStats {
  totalHouses: number
  activeResidents: number
  activeGuards: number
  monthlyEvents: number
  recentActivity: ActivityItem[]
}

interface AuditLogRow {
  id: string
  action: string
  entity_type: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

function classifyAction(action: string): ActivityType {
  const upper = action.toUpperCase()
  if (upper.includes('APPROVE') || upper.includes('CREATE') || upper.includes('REGISTER')) {
    return 'success'
  }
  if (upper.includes('REJECT') || upper.includes('DELETE') || upper.includes('FAIL')) {
    return 'warning'
  }
  return 'info'
}

function formatActionLabel(action: string): string {
  return action
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats>({
    totalHouses: 0,
    activeResidents: 0,
    activeGuards: 0,
    monthlyEvents: 0,
    recentActivity: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  const supabase = useMemo(() => createClient(), [])

  const fetchStats = useCallback(async () => {
    setIsLoading(true)

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

    const [
      housesResult,
      residentsResult,
      guardsResult,
      eventsResult,
      auditResult,
    ] = await Promise.all([
      supabase.from('houses').select('id', { count: 'exact', head: true }),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .in('role', ['RESIDENT', 'AJK_COMMITTEE', 'AJK_LEADER'])
        .eq('status', 'APPROVED'),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'GUARD')
        .eq('status', 'APPROVED'),
      supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .gte('event_date', monthStart)
        .lte('event_date', monthEnd),
      supabase
        .from('audit_logs')
        .select('id, action, entity_type, metadata, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    const recentActivity: ActivityItem[] = ((auditResult.data ?? []) as AuditLogRow[]).map(log => {
      const metadata = log.metadata
      const detail =
        typeof metadata?.detail === 'string'
          ? metadata.detail
          : log.entity_type ?? ''

      return {
        action: formatActionLabel(log.action),
        detail,
        time: formatDistanceToNow(new Date(log.created_at), { addSuffix: true }),
        type: classifyAction(log.action),
      }
    })

    setStats({
      totalHouses: housesResult.count ?? 0,
      activeResidents: residentsResult.count ?? 0,
      activeGuards: guardsResult.count ?? 0,
      monthlyEvents: eventsResult.count ?? 0,
      recentActivity,
    })

    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { ...stats, isLoading }
}
