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
    .select(`
      id, resident_id, current_house_id, requested_house_id, status,
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

  // Update the resident's house_id
  const { error: profileError } = await service
    .from('profiles')
    .update({ house_id: request.requested_house_id })
    .eq('id', request.resident_id)

  if (profileError) {
    return NextResponse.json({ error: 'Failed to update resident profile' }, { status: 500 })
  }

  // Only set old house to VACANT if the resident had a previous house
  if (request.current_house_id) {
    const { error: oldHouseError } = await service
      .from('houses')
      .update({ occupancy_status: 'VACANT' })
      .eq('id', request.current_house_id)

    if (oldHouseError) {
      return NextResponse.json({ error: 'Failed to update old house status' }, { status: 500 })
    }
  }

  // Update new house to OCCUPIED
  const { error: newHouseError } = await service
    .from('houses')
    .update({ occupancy_status: 'OCCUPIED' })
    .eq('id', request.requested_house_id)

  if (newHouseError) {
    return NextResponse.json({ error: 'Failed to update new house status' }, { status: 500 })
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
    message: `Your request to move from House ${fromHouse} to House ${toHouse} has been approved by the AJK.`,
    type:    'HOUSE_CHANGE_APPROVED',
    read:    false,
  })

  await service.from('audit_logs').insert({
    user_id:     claims!.userId,
    action:      'house_change_approved',
    entity_type: 'house_change_requests',
    entity_id:   id,
    metadata:    {
      detail:      `Approved house change for ${residentName}: House ${fromHouse} → House ${toHouse}`,
      residentId:  request.resident_id,
      residentName,
      fromHouse,
      toHouse,
    },
  })

  return NextResponse.json({ success: true })
}
