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
    .select('id, resident_id, status')
    .eq('id', id)
    .single()

  if (fetchError || !request) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  if (request.status !== 'PENDING') {
    return NextResponse.json({ error: 'Request is no longer pending' }, { status: 409 })
  }

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
    message: `Your house number change request was rejected. Reason: ${reason}`,
    type:    'HOUSE_CHANGE_REJECTED',
    read:    false,
  })

  await service.from('audit_logs').insert({
    user_id:     claims!.userId,
    action:      'house_change_rejected',
    entity_type: 'house_change_requests',
    entity_id:   id,
    metadata:    {
      detail:     `Rejected house change request for resident ${request.resident_id}`,
      residentId: request.resident_id,
      reason,
    },
  })

  return NextResponse.json({ success: true })
}
