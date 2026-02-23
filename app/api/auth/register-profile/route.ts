import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendAdminRegistrationNotification } from '@/lib/email'

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
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
    .select('id, street')
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
    created_via: 'SELF_REGISTRATION',
  })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // Find all roles that have the approve_registrations permission
  const { data: eligibleRoles } = await service
    .from('roles')
    .select('value')
    .contains('permissions', { actions: ['approve_registrations'] })

  const eligibleRoleValues = (eligibleRoles ?? []).map((r: { value: string }) => r.value)

  // Notify all profiles with an eligible role in-app
  const { data: admins } = eligibleRoleValues.length
    ? await service
        .from('profiles')
        .select('id, email')
        .in('role', eligibleRoleValues)
        .eq('status', 'APPROVED')
    : { data: [] }

  if (admins?.length) {
    await service.from('notifications').insert(
      admins.map((a: { id: string; email: string }) => ({
        user_id: a.id,
        title: 'New Registration Pending',
        message: `${fullName} from house ${houseNumber} has registered and is awaiting approval.`,
        type: 'REGISTRATION_PENDING',
      }))
    )

    for (const a of admins as { id: string; email: string }[]) {
      sendAdminRegistrationNotification({
        residentName: fullName,
        houseNumber,
        street: house?.street ?? undefined,
        residentEmail: email,
        adminEmail: a.email,
      }).catch(err => console.error('[email] notify-registration failed:', err))
    }
  }

  service.from('audit_logs').insert({
    user_id: userId,
    action: 'resident_registered',
    entity_type: 'profiles',
    entity_id: userId,
    metadata: {
      detail: `${fullName} submitted a registration request for house ${houseNumber}`,
      fullName,
      houseNumber,
      residentType,
    },
  }).then(({ error }) => { if (error) console.error('[audit_log] insert failed:', error.message) })

  return NextResponse.json({ success: true })
}
