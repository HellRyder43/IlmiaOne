'use client'

import { useState, useEffect, useCallback } from 'react'
import type { CalendarEvent, EventCategory } from '@/lib/types'

export interface EventInput {
  title: string
  category: EventCategory
  eventDate: string
  eventTime?: string
  location?: string
  description?: string
  imageUrls?: string[]
}

export function useEvents(): {
  events:      CalendarEvent[]
  isLoading:   boolean
  error:       string | null
  createEvent: (input: EventInput) => Promise<CalendarEvent>
  updateEvent: (id: string, input: Partial<EventInput>) => Promise<CalendarEvent>
  deleteEvent: (id: string) => Promise<void>
  refresh:     () => Promise<void>
} {
  const [events, setEvents]       = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/events')
      if (!res.ok) {
        const body = await res.json()
        throw new Error((body as { error?: string }).error ?? 'Failed to load events')
      }
      const json = await res.json() as { events: CalendarEvent[] }
      setEvents(json.events)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const createEvent = async (input: EventInput): Promise<CalendarEvent> => {
    const res = await fetch('/api/events', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(input),
    })
    if (!res.ok) {
      const body = await res.json()
      throw new Error((body as { error?: string }).error ?? 'Failed to create event')
    }
    const { event } = await res.json() as { event: CalendarEvent }
    setEvents(prev => [...prev, event].sort((a, b) => a.date.localeCompare(b.date)))
    return event
  }

  const updateEvent = async (id: string, input: Partial<EventInput>): Promise<CalendarEvent> => {
    const res = await fetch(`/api/events/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(input),
    })
    if (!res.ok) {
      const body = await res.json()
      throw new Error((body as { error?: string }).error ?? 'Failed to update event')
    }
    const { event } = await res.json() as { event: CalendarEvent }
    setEvents(prev =>
      prev.map(e => e.id === id ? event : e).sort((a, b) => a.date.localeCompare(b.date))
    )
    return event
  }

  const deleteEvent = async (id: string): Promise<void> => {
    // Optimistic remove
    setEvents(prev => prev.filter(e => e.id !== id))

    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      await fetchEvents()
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error ?? 'Failed to delete event')
    }
  }

  return { events, isLoading, error, createEvent, updateEvent, deleteEvent, refresh: fetchEvents }
}
