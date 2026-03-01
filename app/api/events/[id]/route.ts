import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getCallerClaims, requireAction } from '@/lib/server-auth'
import type { CalendarEvent, EventCategory } from '@/lib/types'

const VALID_CATEGORIES: EventCategory[] = [
  'COMMUNITY_EVENT',
  'MAINTENANCE',
  'MEETING',
  'NOTICE',
  'HOLIDAY',
]

function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

function mapRow(row: {
  id: string
  title: string
  category: string
  event_date: string
  event_time: string | null
  location: string | null
  description: string | null
  image_urls: string[] | null
  created_by: string | null
}): CalendarEvent {
  return {
    id:          row.id,
    title:       row.title,
    category:    row.category as EventCategory,
    date:        row.event_date,
    time:        row.event_time ?? undefined,
    location:    row.location ?? undefined,
    description: row.description ?? undefined,
    imageUrls:   row.image_urls ?? [],
    createdBy:   row.created_by ?? undefined,
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const claims = await getCallerClaims()
  const denied = requireAction(claims, 'manage_calendar')
  if (denied) return denied

  const { id } = await params

  const body = await req.json() as {
    title?: string
    category?: string
    eventDate?: string
    eventTime?: string
    location?: string
    description?: string
    imageUrls?: string[]
  }

  const updates: Record<string, unknown> = {}

  if (body.title !== undefined) {
    if (!body.title.trim()) return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
    updates.title = body.title.trim()
  }
  if (body.category !== undefined) {
    if (!VALID_CATEGORIES.includes(body.category as EventCategory)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }
    updates.category = body.category
  }
  if (body.eventDate !== undefined) updates.event_date = body.eventDate
  if (body.eventTime !== undefined) updates.event_time = body.eventTime?.trim() || null
  if (body.location !== undefined) updates.location = body.location?.trim() || null
  if (body.description !== undefined) updates.description = body.description?.trim() || null
  if (body.imageUrls !== undefined) updates.image_urls = body.imageUrls

  const service = createServiceClient()

  const { data: updated, error: updateError } = await service
    .from('events')
    .update(updates)
    .eq('id', id)
    .select('id, title, category, event_date, event_time, location, description, image_urls, created_by')
    .single()

  if (updateError || !updated) {
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }

  await service.from('audit_logs').insert({
    user_id:     claims!.userId,
    action:      'event_updated',
    entity_type: 'events',
    entity_id:   id,
    metadata:    updates,
  })

  return NextResponse.json({ event: mapRow(updated as Parameters<typeof mapRow>[0]) })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const claims = await getCallerClaims()
  const denied = requireAction(claims, 'manage_calendar')
  if (denied) return denied

  const { id } = await params

  const service = createServiceClient()

  const { error } = await service
    .from('events')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }

  await service.from('audit_logs').insert({
    user_id:     claims!.userId,
    action:      'event_deleted',
    entity_type: 'events',
    entity_id:   id,
  })

  return NextResponse.json({ success: true })
}
