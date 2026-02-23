import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendRegistrationApprovedEmail } from '@/lib/email'
import { getCallerClaims, requireAction } from '@/lib/server-auth'

function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Verify caller has approve_registrations permission (AJK_LEADER or AJK_COMMITTEE)
  const claims = await getCallerClaims()
  const denied = requireAction(claims, 'approve_registrations')
  if (denied) return NextResponse.json(await denied.json(), { status: denied.status })

  const service = createServiceClient()

  // Fetch resident profile
  const { data: profile, error: fetchError } = await service
    .from('profiles')
    .select('full_name, email, status, house_id')
    .eq('id', id)
    .single()

  if (fetchError || !profile) {
    return NextResponse.json({ error: 'Resident not found' }, { status: 404 })
  }

  if (profile.status !== 'PENDING_APPROVAL') {
    return NextResponse.json({ error: 'Profile is not pending approval' }, { status: 400 })
  }

  // Update status to APPROVED
  const { error: updateError } = await service
    .from('profiles')
    .update({ status: 'APPROVED', rejection_reason: null })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to approve' }, { status: 500 })
  }

  // Mark house as OCCUPIED now that a resident is approved there (non-fatal)
  let houseOccupancySynced = true
  if (profile.house_id) {
    const { error: houseError } = await service
      .from('houses')
      .update({ occupancy_status: 'OCCUPIED' })
      .eq('id', profile.house_id)

    if (houseError) {
      houseOccupancySynced = false
      // Log the failure but do NOT block approval — profile is already APPROVED
      await service.from('audit_logs').insert({
        user_id: claims!.userId,
        action: 'house_occupancy_sync_failed',
        entity_type: 'houses',
        entity_id: profile.house_id,
        metadata: { detail: `Failed to mark house as OCCUPIED after approving ${profile.full_name}`, error: houseError.message },
      }).then(({ error }) => { if (error) console.error('[audit_log] occupancy sync failed log error:', error.message) })
    }
  }

  await service.from('audit_logs').insert({
    user_id: claims!.userId,
    action: 'registration_approved',
    entity_type: 'profiles',
    entity_id: id,
    metadata: {
      detail: `Approved registration for ${profile.full_name}`,
      residentName: profile.full_name,
    },
  })

  // Insert in-app notification for the resident
  await service.from('notifications').insert({
    user_id: id,
    title: 'Registration Approved',
    message: 'Your registration has been approved by the committee. Welcome to Ilmia One!',
    type: 'REGISTRATION_APPROVED',
  })

  // Send approval email
  await sendRegistrationApprovedEmail({
    residentName: profile.full_name,
    residentEmail: profile.email,
  }).catch(err => console.error('[email] approval email failed:', err))

  return NextResponse.json({ success: true, houseOccupancySynced })
}
