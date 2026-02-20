import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendAdminRegistrationNotification } from '@/lib/email'

// Service-role client for reading admin emails across RLS boundaries
function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: Request) {
  // Require an authenticated session (resident who just registered)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { residentName, houseNumber, residentEmail } = await request.json() as {
    residentName: string
    houseNumber: string
    residentEmail: string
  }

  const service = createServiceClient()
  const { data: admins } = await service
    .from('profiles')
    .select('email')
    .in('role', ['AJK_LEADER', 'AJK_COMMITTEE'])
    .eq('status', 'APPROVED')

  if (!admins?.length) {
    return NextResponse.json({ sent: 0 })
  }

  // Send to all admins in parallel; failures are non-blocking
  await Promise.allSettled(
    admins.map((a: { email: string }) =>
      sendAdminRegistrationNotification({
        residentName,
        houseNumber,
        residentEmail,
        adminEmail: a.email,
      })
    )
  )

  return NextResponse.json({ sent: admins.length })
}
