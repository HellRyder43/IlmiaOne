import { NextResponse } from 'next/server'
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
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const claims = await getCallerClaims()
  const denied = requireAction(claims, 'approve_registrations')
  if (denied) return NextResponse.json(await denied.json(), { status: denied.status })

  const { id } = await params
  const service = createServiceClient()

  const { data: request, error: fetchError } = await service
    .from('house_change_requests')
    .select('id, resident_id, requested_house_id, status')
    .eq('id', id)
    .single()

  if (fetchError || !request) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  if (request.status !== 'PENDING') {
    return NextResponse.json({ error: 'Request is no longer pending' }, { status: 409 })
  }

  // Update the resident's house_id
  const { error: profileError } = await service
    .from('profiles')
    .update({ house_id: request.requested_house_id })
    .eq('id', request.resident_id)

  if (profileError) {
    return NextResponse.json({ error: 'Failed to update resident profile' }, { status: 500 })
  }

  // Mark request as approved
  const { error: updateError } = await service
    .from('house_change_requests')
    .update({
      status:      'APPROVED',
      reviewed_by: claims!.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update request status' }, { status: 500 })
  }

  // Notify the resident
  await service.from('notifications').insert({
    user_id: request.resident_id,
    title:   'House Change Approved',
    message: 'Your house number change request has been approved by the AJK.',
    type:    'HOUSE_CHANGE_APPROVED',
    read:    false,
  })

  await service.from('audit_logs').insert({
    user_id:     claims!.userId,
    action:      'house_change_approved',
    entity_type: 'house_change_requests',
    entity_id:   id,
    metadata:    {
      detail:      `Approved house change request for resident ${request.resident_id}`,
      residentId:  request.resident_id,
      newHouseId:  request.requested_house_id,
    },
  })

  return NextResponse.json({ success: true })
}
