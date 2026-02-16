import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

export async function POST(request: Request) {
  const { userId, fullName, email, houseNumber, icNumber, residentType } =
    await request.json() as {
      userId: string
      fullName: string
      email: string
      houseNumber: string
      icNumber: string
      residentType: string
    }

  if (!userId || !fullName || !email || !houseNumber || !icNumber || !residentType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const service = createServiceClient()

  // Prevent duplicate profile creation
  const { data: existing } = await service
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Profile already exists' }, { status: 409 })
  }

  // Look up house ID from house number
  const { data: house } = await service
    .from('houses')
    .select('id')
    .eq('house_number', houseNumber)
    .single()

  // Insert profile using service role (bypasses RLS)
  const { error: profileError } = await service.from('profiles').insert({
    id: userId,
    full_name: fullName,
    email,
    role: 'RESIDENT',
    house_id: house?.id ?? null,
    ic_number: icNumber.slice(-4),
    resident_type: residentType,
    status: 'PENDING_APPROVAL',
  })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // Notify all ADMIN profiles in-app
  const { data: admins } = await service
    .from('profiles')
    .select('id')
    .eq('role', 'ADMIN')
    .eq('status', 'APPROVED')

  if (admins?.length) {
    await service.from('notifications').insert(
      admins.map((a: { id: string }) => ({
        user_id: a.id,
        title: 'New Registration Pending',
        message: `${fullName} from house ${houseNumber} has registered and is awaiting approval.`,
        type: 'REGISTRATION_PENDING',
      }))
    )
  }

  return NextResponse.json({ success: true })
}
