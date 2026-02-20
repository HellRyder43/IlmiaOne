'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, isToday, isYesterday, startOfWeek, startOfMonth } from 'date-fns'

export type AuditLogType = 'create' | 'update' | 'delete' | 'login'
export type AuditActionFilter = 'all' | 'create' | 'update' | 'delete' | 'login'
export type AuditTimeFilter = 'today' | 'week' | 'month' | 'all'

export interface AdminAuditLog {
  id: string
  time: string
  date: string
  userName: string
  action: string
  details: string
  logType: AuditLogType
  createdAt: Date
}

interface AuditLogRow {
  id: string
  action: string
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  user_id: string | null
  profiles: { full_name: string } | null
}

function formatActionLabel(action: string): string {
  return action
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function classifyLogType(action: string): AuditLogType {
  const upper = action.toUpperCase()
  if (upper.includes('LOGIN') || upper.includes('SIGN_IN') || upper.includes('LOGOUT')) {
    return 'login'
  }
  if (upper.includes('DELETE') || upper.includes('REMOVE') || upper.includes('PURGE')) {
    return 'delete'
  }
  if (upper.includes('CREATE') || upper.includes('REGISTER') || upper.includes('ADD') || upper.includes('INSERT')) {
    return 'create'
  }
  return 'update'
}

function formatLogDate(d: Date): string {
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'd MMM yyyy')
}

export function useAdminAuditLogs() {
  const [allLogs, setAllLogs] = useState<AdminAuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState<AuditActionFilter>('all')
  const [timeFilter, setTimeFilter] = useState<AuditTimeFilter>('all')

  const supabase = useMemo(() => createClient(), [])

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)

    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, action, entity_type, entity_id, metadata, created_at, user_id, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Failed to fetch audit logs:', error)
      setIsLoading(false)
      return
    }

    const mapped: AdminAuditLog[] = ((data ?? []) as unknown as AuditLogRow[]).map(row => {
      const createdAt = new Date(row.created_at)
      const profileData = row.profiles
      const userName = profileData ? profileData.full_name : 'System'
      const metadata = row.metadata
      const details =
        typeof metadata?.detail === 'string'
          ? metadata.detail
          : row.entity_type
            ? `${row.entity_type}${row.entity_id ? ` (${row.entity_id.slice(0, 8)}...)` : ''}`
            : ''

      return {
        id: row.id,
        time: format(createdAt, 'hh:mm a'),
        date: formatLogDate(createdAt),
        userName,
        action: formatActionLabel(row.action),
        details,
        logType: classifyLogType(row.action),
        createdAt,
      }
    })

    setAllLogs(mapped)
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const logs = useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now)
    const monthStart = startOfMonth(now)

    return allLogs.filter(log => {
      if (actionFilter !== 'all' && log.logType !== actionFilter) return false

      if (timeFilter === 'today' && !isToday(log.createdAt)) return false
      if (timeFilter === 'week' && log.createdAt < weekStart) return false
      if (timeFilter === 'month' && log.createdAt < monthStart) return false

      return true
    })
  }, [allLogs, actionFilter, timeFilter])

  return { logs, isLoading, actionFilter, setActionFilter, timeFilter, setTimeFilter }
}
