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

// GET /api/admin/users — list all users with hasLoggedIn derived from auth.users
export async function GET() {
  const claims = await getCallerClaims()
  const denied = requireAction(claims, 'manage_users')
  if (denied) return NextResponse.json(await denied.json(), { status: denied.status })

  const service = createServiceClient()

  // Fetch all auth users to get last_sign_in_at
  const { data: authData, error: authError } = await service.auth.admin.listUsers({ perPage: 1000 })
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  const signInMap: Record<string, string | null> = {}
  for (const u of authData.users) {
    signInMap[u.id] = u.last_sign_in_at ?? null
  }

  // Fetch profiles with house join
  const { data: profiles, error: profilesError } = await service
    .from('profiles')
    .select('id, full_name, email, role, status, created_via, houses(house_number, street)')
    .order('full_name')

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 })
  }

  type ProfileRow = {
    id: string
    full_name: string
    email: string
    role: string
    status: string
    created_via: string
    houses: { house_number: string; street: string | null } | { house_number: string; street: string | null }[] | null
  }

  const users = ((profiles ?? []) as unknown as ProfileRow[]).map((row) => {
    const house = Array.isArray(row.houses) ? (row.houses[0] ?? null) : row.houses
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      role: row.role,
      houseNumber: house ? house.house_number : null,
      street: house ? (house.street ?? null) : null,
      active: row.status === 'APPROVED',
      createdVia: (row.created_via ?? 'SELF_REGISTRATION') as 'SELF_REGISTRATION' | 'INVITED',
      hasLoggedIn: !!signInMap[row.id],
    }
  })

  return NextResponse.json(users)
}
