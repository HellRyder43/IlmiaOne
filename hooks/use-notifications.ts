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

    let channel: ReturnType<typeof supabase.channel> | null = null

    // Get user ID then subscribe with a per-user filter to avoid receiving
    // notifications intended for other users (which would cause duplicates).
    supabase.auth.getUser().then((result: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      const user = result.data.user
      if (!user) return

      channel = supabase
        .channel('notifications-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload: { new: AppNotification }) => {
            setNotifications(prev => [payload.new, ...prev].slice(0, 20))
          }
        )
        .subscribe()
    })

    return () => {
      if (channel) supabase.removeChannel(channel)
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
