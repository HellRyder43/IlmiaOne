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

export async function GET() {
  const claims = await getCallerClaims()
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  const { data, error } = await service
    .from('events')
    .select('id, title, category, event_date, event_time, location, description, image_urls, created_by')
    .order('event_date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }

  const events: CalendarEvent[] = ((data ?? []) as Parameters<typeof mapRow>[0][]).map(mapRow)

  return NextResponse.json({ events })
}

export async function POST(req: NextRequest) {
  const claims = await getCallerClaims()
  const denied = requireAction(claims, 'manage_calendar')
  if (denied) return denied

  const body = await req.json() as {
    title?: string
    category?: string
    eventDate?: string
    eventTime?: string
    location?: string
    description?: string
    imageUrls?: string[]
  }

  const { title, category, eventDate, eventTime, location, description, imageUrls } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }
  if (!category || !VALID_CATEGORIES.includes(category as EventCategory)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }
  if (!eventDate?.trim()) {
    return NextResponse.json({ error: 'Event date is required' }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: inserted, error: insertError } = await service
    .from('events')
    .insert({
      title:       title.trim(),
      category:    category as EventCategory,
      event_date:  eventDate,
      event_time:  eventTime?.trim() || null,
      location:    location?.trim() || null,
      description: description?.trim() || null,
      image_urls:  imageUrls ?? [],
      created_by:  claims!.userId,
    })
    .select('id, title, category, event_date, event_time, location, description, image_urls, created_by')
    .single()

  if (insertError || !inserted) {
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }

  await service.from('audit_logs').insert({
    user_id:     claims!.userId,
    action:      'event_created',
    entity_type: 'events',
    entity_id:   (inserted as { id: string }).id,
    metadata:    { title: (inserted as { title: string }).title, category },
  })

  return NextResponse.json({ event: mapRow(inserted as Parameters<typeof mapRow>[0]) }, { status: 201 })
}
