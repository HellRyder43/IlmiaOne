import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { sendRegistrationRejectedEmail } from '@/lib/email'

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Verify caller is ADMIN
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let role: string | undefined
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const payload = JSON.parse(atob(session.access_token.split('.')[1]))
      role = payload.user_role ?? user.app_metadata?.user_role
    }
  } catch {
    role = user.app_metadata?.user_role
  }

  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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
