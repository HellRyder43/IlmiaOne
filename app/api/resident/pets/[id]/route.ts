import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getCallerClaims } from '@/lib/server-auth'

function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const claims = await getCallerClaims()
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'Pet ID is required' }, { status: 400 })

  const body = await req.json() as {
    name?: string
    type?: string
    breed?: string
    vaccinationStatus?: boolean
    photoUrl?: string
  }

  const service = createServiceClient()

  // Verify ownership
  const { data: existing, error: fetchError } = await service
    .from('pets')
    .select('id, owner_id, name')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
  }

  const existingRow = existing as { id: string; owner_id: string; name: string }

  if (existingRow.owner_id !== claims.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Build update object with only provided fields
  const updates: Record<string, unknown> = {}
  if (body.name !== undefined)              updates.name               = body.name.trim()
  if (body.type !== undefined)              updates.type               = body.type.trim()
  if (body.breed !== undefined)             updates.breed              = body.breed.trim()
  if (body.vaccinationStatus !== undefined) updates.vaccination_status = body.vaccinationStatus
  if (body.photoUrl !== undefined)          updates.photo_url          = body.photoUrl

  const { error: updateError } = await service
    .from('pets')
    .update(updates)
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update pet' }, { status: 500 })
  }

  // Re-fetch with joins
  const { data: pet, error: refetchError } = await service
    .from('pets')
    .select(`
      id,
      owner_id,
      house_id,
      name,
      type,
      breed,
      photo_url,
      vaccination_status,
      created_at,
      profiles!pets_owner_id_fkey ( full_name ),
      houses!pets_house_id_fkey ( house_number, street )
    `)
    .eq('id', id)
    .single()

  if (refetchError || !pet) {
    return NextResponse.json({ error: 'Failed to retrieve updated pet' }, { status: 500 })
  }

  const row = pet as unknown as {
    id: string
    owner_id: string
    house_id: string | null
    name: string
    type: string
    breed: string
    photo_url: string
    vaccination_status: boolean
    created_at: string
    profiles: { full_name: string } | null
    houses: { house_number: string; street: string | null } | null
  }

  const result = {
    id:                row.id,
    ownerId:           row.owner_id,
    houseId:           row.house_id ?? undefined,
    name:              row.name,
    type:              row.type,
    breed:             row.breed,
    photoUrl:          row.photo_url,
    vaccinationStatus: row.vaccination_status,
    ownerName:         row.profiles?.full_name,
    houseNumber:       row.houses?.house_number,
    street:            row.houses?.street ?? undefined,
    registrationDate:  row.created_at,
  }

  await service.from('audit_logs').insert({
    user_id:     claims.userId,
    action:      'pet_updated',
    entity_type: 'pets',
    entity_id:   id,
    metadata:    { name: row.name },
  })

  return NextResponse.json({ pet: result })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const claims = await getCallerClaims()
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'Pet ID is required' }, { status: 400 })

  const service = createServiceClient()

  // Verify ownership before deleting
  const { data: pet, error: fetchError } = await service
    .from('pets')
    .select('id, owner_id, name')
    .eq('id', id)
    .single()

  if (fetchError || !pet) {
    return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
  }

  const row = pet as { id: string; owner_id: string; name: string }

  if (row.owner_id !== claims.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error: deleteError } = await service
    .from('pets')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return NextResponse.json({ error: 'Failed to delete pet' }, { status: 500 })
  }

  await service.from('audit_logs').insert({
    user_id:     claims.userId,
    action:      'pet_deleted',
    entity_type: 'pets',
    entity_id:   id,
    metadata:    { name: row.name },
  })

  return new NextResponse(null, { status: 204 })
}
