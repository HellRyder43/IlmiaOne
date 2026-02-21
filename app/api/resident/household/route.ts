import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getCallerClaims } from '@/lib/server-auth'

function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function GET() {
  const claims = await getCallerClaims()
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()

  // Fetch own profile with house join
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('resident_type, house_id, houses(house_number, street)')
    .eq('id', claims.userId)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const houseId = profile.house_id as string | null
  const house = profile.houses as unknown as { house_number: string; street: string | null } | null

  if (!houseId) {
    return NextResponse.json({
      residentType:  profile.resident_type ?? null,
      houseId:       null,
      houseNumber:   null,
      street:        null,
      coResidents:   [],
      members:       [],
    })
  }

  // Co-residents: use service role since residents can't SELECT other profiles via RLS
  const service = createServiceClient()
  const [coResidentsResult, membersResult] = await Promise.all([
    service
      .from('profiles')
      .select('id, full_name, email, resident_type')
      .eq('house_id', houseId)
      .eq('status', 'APPROVED'),
    supabase
      .from('house_members')
      .select('id, house_id, name, relationship, phone_number, created_at')
      .eq('house_id', houseId)
      .order('created_at', { ascending: true }),
  ])

  const coResidents = ((coResidentsResult.data ?? []) as {
    id: string
    full_name: string
    email: string
    resident_type: string | null
  }[]).map(cr => ({
    id:           cr.id,
    fullName:     cr.full_name,
    email:        cr.email,
    residentType: cr.resident_type ?? null,
  }))

  const members = ((membersResult.data ?? []) as {
    id: string
    house_id: string
    name: string
    relationship: string
    phone_number: string | null
    created_at: string
  }[]).map(m => ({
    id:          m.id,
    houseId:     m.house_id,
    name:        m.name,
    relationship: m.relationship,
    phoneNumber: m.phone_number ?? undefined,
    createdAt:   m.created_at,
  }))

  return NextResponse.json({
    residentType: profile.resident_type ?? null,
    houseId,
    houseNumber:  house?.house_number ?? null,
    street:       house?.street ?? null,
    coResidents,
    members,
  })
}

export async function PUT(req: NextRequest) {
  const claims = await getCallerClaims()
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { residentType } = body as { residentType: string }

  if (residentType !== 'OWNER' && residentType !== 'TENANT') {
    return NextResponse.json({ error: 'Invalid residentType' }, { status: 400 })
  }

  const supabase = await createClient()

  // If switching to TENANT, require at least one house member
  if (residentType === 'TENANT') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('house_id')
      .eq('id', claims.userId)
      .single()

    if (profile?.house_id) {
      const { count } = await supabase
        .from('house_members')
        .select('id', { count: 'exact', head: true })
        .eq('house_id', profile.house_id)

      if ((count ?? 0) === 0) {
        return NextResponse.json(
          { error: 'Tenants must register at least one additional household member first.' },
          { status: 422 },
        )
      }
    }
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ resident_type: residentType })
    .eq('id', claims.userId)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update resident type' }, { status: 500 })
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id:     claims.userId,
    action:      'resident_type_updated',
    entity_type: 'profiles',
    entity_id:   claims.userId,
    metadata:    {
      detail:       `Updated resident type to ${residentType}`,
      residentType,
    },
  })

  return NextResponse.json({ success: true })
}
