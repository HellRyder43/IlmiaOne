import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST /api/auth/complete-invite
// Called after successful password update on the reset-password page.
// Marks invite_accepted_at on the caller's profile (no-op if not invited or already accepted).
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()

  const { data: profile, error: fetchError } = await service
    .from('profiles')
    .select('created_via, invite_accepted_at')
    .eq('id', user.id)
    .single()

  if (fetchError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // No-op if not an invited user or already accepted
  if (profile.created_via !== 'INVITED' || profile.invite_accepted_at !== null) {
    return NextResponse.json({ success: true })
  }

  const { error: updateError } = await service
    .from('profiles')
    .update({ invite_accepted_at: new Date().toISOString() })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to mark invite as accepted' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
