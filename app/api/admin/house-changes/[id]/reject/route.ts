import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getCallerClaims, requireAction } from '@/lib/server-auth'

function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const claims = await getCallerClaims()
  const denied = requireAction(claims, 'approve_registrations')
  if (denied) return NextResponse.json(await denied.json(), { status: denied.status })

  const { id } = await params
  const body = await req.json() as { reason?: string }
  const reason = body.reason?.trim() ?? ''

  if (reason.length < 10) {
    return NextResponse.json(
      { error: 'Rejection reason must be at least 10 characters' },
      { status: 400 },
    )
  }

  const service = createServiceClient()

  const { data: request, error: fetchError } = await service
    .from('house_change_requests')
    .select(`
      id, resident_id, status,
      profiles!house_change_requests_resident_id_fkey(full_name),
      current_house:houses!house_change_requests_current_house_id_fkey(house_number),
      requested_house:houses!house_change_requests_requested_house_id_fkey(house_number)
    `)
    .eq('id', id)
    .single()

  if (fetchError || !request) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  if (request.status !== 'PENDING') {
    return NextResponse.json({ error: 'Request is no longer pending' }, { status: 409 })
  }

  const residentName = (request.profiles as unknown as { full_name: string } | null)?.full_name ?? 'Unknown'
  const fromHouse    = (request.current_house as unknown as { house_number: string } | null)?.house_number ?? '—'
  const toHouse      = (request.requested_house as unknown as { house_number: string } | null)?.house_number ?? '—'

  const { error: updateError } = await service
    .from('house_change_requests')
    .update({
      status:           'REJECTED',
      rejection_reason: reason,
      reviewed_by:      claims!.userId,
      reviewed_at:      new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update request status' }, { status: 500 })
  }

  // Notify the resident
  await service.from('notifications').insert({
    user_id: request.resident_id,
    title:   'House Change Request Rejected',
    message: `Your request to move from House ${fromHouse} to House ${toHouse} was rejected. Reason: ${reason}`,
    type:    'HOUSE_CHANGE_REJECTED',
    read:    false,
  })

  await service.from('audit_logs').insert({
    user_id:     claims!.userId,
    action:      'house_change_rejected',
    entity_type: 'house_change_requests',
    entity_id:   id,
    metadata:    {
      detail:      `Rejected house change for ${residentName}: House ${fromHouse} → House ${toHouse}`,
      residentId:  request.resident_id,
      residentName,
      fromHouse,
      toHouse,
      reason,
    },
  })

  return NextResponse.json({ success: true })
}
