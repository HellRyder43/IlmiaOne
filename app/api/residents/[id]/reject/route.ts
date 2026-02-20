import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendRegistrationRejectedEmail } from '@/lib/email'
import { getCallerClaims, requireAction } from '@/lib/server-auth'

function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Verify caller has approve_registrations permission (AJK_LEADER or AJK_COMMITTEE)
  const claims = await getCallerClaims()
  const denied = requireAction(claims, 'approve_registrations')
  if (denied) return NextResponse.json(await denied.json(), { status: denied.status })

  const { reason } = await request.json() as { reason: string }
  if (!reason?.trim() || reason.trim().length < 10) {
    return NextResponse.json({ error: 'Reason must be at least 10 characters' }, { status: 400 })
  }

  const service = createServiceClient()

  // Fetch resident profile
  const { data: profile, error: fetchError } = await service
    .from('profiles')
    .select('full_name, email, status')
    .eq('id', id)
    .single()

  if (fetchError || !profile) {
    return NextResponse.json({ error: 'Resident not found' }, { status: 404 })
  }

  if (profile.status !== 'PENDING_APPROVAL') {
    return NextResponse.json({ error: 'Profile is not pending approval' }, { status: 400 })
  }

  // Update status to REJECTED with reason
  const { error: updateError } = await service
    .from('profiles')
    .update({ status: 'REJECTED', rejection_reason: reason.trim() })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to reject' }, { status: 500 })
  }

  // Insert in-app notification for the resident
  await service.from('notifications').insert({
    user_id: id,
    title: 'Registration Not Approved',
    message: `Your registration was not approved. Reason: ${reason.trim()}`,
    type: 'REGISTRATION_REJECTED',
  })

  // Send rejection email (non-blocking)
  sendRegistrationRejectedEmail({
    residentName: profile.full_name,
    residentEmail: profile.email,
    reason: reason.trim(),
  }).catch(() => {})

  return NextResponse.json({ success: true })
}
