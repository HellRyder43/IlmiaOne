import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendAdminRegistrationNotification } from '@/lib/email'

function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(_request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()

  // Verify the resident is currently REJECTED
  const { data: profile, error: fetchError } = await service
    .from('profiles')
    .select('full_name, email, status, houses(house_number)')
    .eq('id', user.id)
    .single()

  if (fetchError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (profile.status !== 'REJECTED') {
    return NextResponse.json({ error: 'Only rejected profiles can resubmit' }, { status: 400 })
  }

  // Reset status to PENDING_APPROVAL and clear rejection reason
  const { error: updateError } = await service
    .from('profiles')
    .update({ status: 'PENDING_APPROVAL', rejection_reason: null })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to resubmit' }, { status: 500 })
  }

  const houseNumber = (profile.houses as unknown as { house_number: string } | null)?.house_number ?? '—'

  // Notify all ADMIN profiles in-app
  const { data: admins } = await service
    .from('profiles')
    .select('id, email')
    .in('role', ['AJK_LEADER', 'AJK_COMMITTEE'])
    .eq('status', 'APPROVED')

  if (admins?.length) {
    await service.from('notifications').insert(
      admins.map((a: { id: string; email: string }) => ({
        user_id: a.id,
        title: 'Registration Resubmitted',
        message: `${profile.full_name} from house ${houseNumber} has resubmitted their registration.`,
        type: 'REGISTRATION_PENDING',
      }))
    )

    // Email all admins (non-blocking)
    admins.forEach((a: { id: string; email: string }) => {
      sendAdminRegistrationNotification({
        residentName: profile.full_name,
        houseNumber,
        residentEmail: profile.email,
        adminEmail: a.email,
      }).catch(() => {})
    })
  }

  return NextResponse.json({ success: true })
}
