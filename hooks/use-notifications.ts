'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

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

  // Unique channel name per hook instance to prevent channel collisions
  const channelId = useRef(`notifications-${crypto.randomUUID()}`).current

  // Synchronous dedup set — immune to React state batching delays
  const seenIds = useRef(new Set<string>())

  // Track whether this effect instance is still mounted
  const mountedRef = useRef(true)

  // Store userId for use in markAllRead
  const userIdRef = useRef<string | null>(null)

  const fetchNotifications = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('id, title, message, type, read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      // Populate seenIds so Realtime events for already-fetched rows are ignored
      for (const n of data) {
        seenIds.current.add(n.id)
      }
      setNotifications(data)
    }
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    mountedRef.current = true

    let channel: ReturnType<typeof supabase.channel> | null = null

    supabase.auth.getUser().then((result: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      if (!mountedRef.current) return

      const user = result.data.user
      if (!user) return

      userIdRef.current = user.id
      fetchNotifications(user.id)

      channel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload: { new: AppNotification }) => {
            // Synchronous dedup — prevents duplicates even when multiple
            // Realtime callbacks fire before React processes state updates
            if (seenIds.current.has(payload.new.id)) return
            seenIds.current.add(payload.new.id)

            setNotifications(prev => [payload.new, ...prev].slice(0, 20))
          }
        )
        .subscribe()
    })

    return () => {
      mountedRef.current = false
      if (channel) {
        supabase.removeChannel(channel)
      } else {
        // Channel may not be assigned yet if cleanup races with async getUser
        const existing = supabase.getChannels().find((c: { topic: string }) => c.topic === `realtime:${channelId}`)
        if (existing) supabase.removeChannel(existing)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  const markAsRead = useCallback(async (id: string) => {
    const snapshot = notifications
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id)
    if (error) {
      setNotifications(snapshot)
      toast.error('Failed to mark notification as read')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, notifications])

  const markAllRead = useCallback(async () => {
    if (!userIdRef.current) return
    const snapshot = notifications
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false)
      .eq('user_id', userIdRef.current)
    if (error) {
      setNotifications(snapshot)
      toast.error('Failed to mark all notifications as read')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, notifications])

  const unreadCount = notifications.filter(n => !n.read).length

  return { notifications, unreadCount, isLoading, markAsRead, markAllRead }
}
