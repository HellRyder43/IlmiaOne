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
  const service = createServiceClient()

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

  // Check for pending house change request
  const { data: pendingRequest } = await service
    .from('house_change_requests')
    .select('id, requested_house_id, houses!house_change_requests_requested_house_id_fkey(house_number)')
    .eq('resident_id', claims.userId)
    .eq('status', 'PENDING')
    .maybeSingle()

  const pendingHouseChange = pendingRequest
    ? {
        id:                   pendingRequest.id as string,
        requestedHouseId:     pendingRequest.requested_house_id as string,
        requestedHouseNumber: (pendingRequest.houses as unknown as { house_number: string } | null)?.house_number ?? '',
      }
    : null

  if (!houseId) {
    return NextResponse.json({
      residentType:      profile.resident_type ?? null,
      houseId:           null,
      houseNumber:       null,
      street:            null,
      coResidents:       [],
      members:           [],
      pendingHouseChange,
    })
  }

  // Co-residents: use service role since residents can't SELECT other profiles via RLS
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
    pendingHouseChange,
  })
}

export async function PUT(req: NextRequest) {
  const claims = await getCallerClaims()
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { residentType?: string; houseNumber?: string }
  const supabase = await createClient()

  // --- House number change ---
  if (body.houseNumber !== undefined) {
    const houseNumber = body.houseNumber.trim()
    if (!houseNumber) {
      return NextResponse.json({ error: 'House number is required' }, { status: 400 })
    }

    // Look up the house by number (service role to bypass RLS on houses table)
    const service = createServiceClient()
    const { data: house, error: houseError } = await service
      .from('houses')
      .select('id, house_number, street')
      .eq('house_number', houseNumber)
      .single()

    if (houseError || !house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    const callerRole = claims.role as string

    // AJK members can update house directly; residents submit a change request
    if (callerRole === 'AJK_COMMITTEE' || callerRole === 'AJK_LEADER') {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ house_id: house.id })
        .eq('id', claims.userId)

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update house number' }, { status: 500 })
      }

      await supabase.from('audit_logs').insert({
        user_id:     claims.userId,
        action:      'house_number_updated',
        entity_type: 'profiles',
        entity_id:   claims.userId,
        metadata:    {
          detail:      `Updated house number to ${houseNumber}`,
          houseNumber,
          houseId:     house.id,
        },
      })

      return NextResponse.json({
        success:     true,
        houseId:     house.id,
        houseNumber: house.house_number as string,
        street:      house.street as string | null,
      })
    }

    // RESIDENT path: submit a change request
    // Check for existing PENDING request
    const { data: existing } = await service
      .from('house_change_requests')
      .select('id')
      .eq('resident_id', claims.userId)
      .eq('status', 'PENDING')
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'You already have a pending house change request. Cancel it before submitting a new one.' },
        { status: 409 },
      )
    }

    // Get caller's current house_id + name for the request record and audit log
    const { data: currentProfile } = await service
      .from('profiles')
      .select('full_name, house_id, houses(house_number)')
      .eq('id', claims.userId)
      .single()

    const residentName  = (currentProfile as unknown as { full_name: string } | null)?.full_name ?? 'Unknown'
    const fromHouseNum  = (currentProfile?.houses as unknown as { house_number: string } | null)?.house_number ?? '—'

    const { data: newRequest, error: insertError } = await service
      .from('house_change_requests')
      .insert({
        resident_id:        claims.userId,
        current_house_id:   currentProfile?.house_id ?? null,
        requested_house_id: house.id,
        status:             'PENDING',
      })
      .select('id')
      .single()

    if (insertError || !newRequest) {
      return NextResponse.json({ error: 'Failed to submit change request' }, { status: 500 })
    }

    // Notify all AJK_LEADER and AJK_COMMITTEE profiles
    const { data: ajkProfiles } = await service
      .from('profiles')
      .select('id')
      .in('role', ['AJK_LEADER', 'AJK_COMMITTEE'])
      .eq('status', 'APPROVED')

    if (ajkProfiles && ajkProfiles.length > 0) {
      await service.from('notifications').insert(
        ajkProfiles.map(p => ({
          user_id: p.id,
          title:   'House Change Request',
          message: `${residentName} requested to move from House ${fromHouseNum} to House ${houseNumber}.`,
          type:    'HOUSE_CHANGE_REQUESTED',
          read:    false,
        })),
      )
    }

    await service.from('audit_logs').insert({
      user_id:     claims.userId,
      action:      'house_change_requested',
      entity_type: 'house_change_requests',
      entity_id:   newRequest.id,
      metadata:    {
        detail:               `Requested house change: House ${fromHouseNum} → House ${houseNumber}`,
        residentName,
        fromHouse:            fromHouseNum,
        toHouse:              houseNumber,
        requestedHouseId:     house.id,
      },
    })

    return NextResponse.json({
      pending:              true,
      requestId:            newRequest.id,
      requestedHouseNumber: house.house_number as string,
      requestedHouseId:     house.id as string,
    })
  }

  // --- Resident type change ---
  const { residentType } = body

  if (residentType !== 'OWNER' && residentType !== 'TENANT') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ resident_type: residentType })
    .eq('id', claims.userId)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update resident type' }, { status: 500 })
  }

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
