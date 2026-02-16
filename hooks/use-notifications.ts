'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface AppNotification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select('id, title, message, type, read, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) setNotifications(data)
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchNotifications()

    // Realtime subscription for new notifications
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload: { new: AppNotification }) => {
          setNotifications(prev => [payload.new, ...prev].slice(0, 20))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchNotifications])

  const markAsRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    )
  }, [supabase])

  const markAllRead = useCallback(async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [supabase])

  const unreadCount = notifications.filter(n => !n.read).length

  return { notifications, unreadCount, isLoading, markAsRead, markAllRead }
}
