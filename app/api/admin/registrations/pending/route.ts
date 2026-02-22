import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getCallerClaims, requireAction } from '@/lib/server-auth'

function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET() {
  const claims = await getCallerClaims()
  const denied = requireAction(claims, 'approve_registrations')
  if (denied) return NextResponse.json(await denied.json(), { status: denied.status })

  const service = createServiceClient()

  const { data: profiles, error } = await service
    .from('profiles')
    .select('id, full_name, email, ic_number, resident_type, rejection_reason, house_id, created_at, updated_at, houses(house_number, street, occupancy_status)')
    .eq('status', 'PENDING_APPROVAL')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch pending registrations' }, { status: 500 })
  }

  // Fetch auth users to get email_confirmed_at — only accessible via service role
  const { data: { users: authUsers }, error: authError } = await service.auth.admin.listUsers({
    perPage: 1000,
  })

  if (authError || !authUsers) {
    // Return profiles without email confirmation data rather than failing entirely
    return NextResponse.json({ data: (profiles ?? []).map(p => ({ ...p, email_confirmed_at: null })) })
  }

  const confirmedAtMap = new Map(authUsers.map(u => [u.id, u.email_confirmed_at ?? null]))

  const data = (profiles ?? []).map(p => ({
    ...p,
    email_confirmed_at: confirmedAtMap.get(p.id) ?? null,
  }))

  return NextResponse.json({ data })
}
