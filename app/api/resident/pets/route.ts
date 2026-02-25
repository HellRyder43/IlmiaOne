import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getCallerClaims } from '@/lib/server-auth'
import type { Pet } from '@/lib/types'

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

  const service = createServiceClient()

  const { data, error } = await service
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
      houses!pets_house_id_fkey ( house_number )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch pets' }, { status: 500 })
  }

  const pets: Pet[] = ((data ?? []) as unknown as {
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
    houses: { house_number: string } | null
  }[]).map(row => ({
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
    registrationDate:  row.created_at,
  }))

  return NextResponse.json({ pets })
}

export async function POST(req: NextRequest) {
  const claims = await getCallerClaims()
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    name?: string
    type?: string
    breed?: string
    vaccinationStatus?: boolean
    photoUrl?: string
  }

  const { name, type, breed, vaccinationStatus, photoUrl } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Pet name is required' }, { status: 400 })
  if (!type?.trim()) return NextResponse.json({ error: 'Pet type is required' }, { status: 400 })

  const service = createServiceClient()

  // Fetch caller's house_id from their profile
  const { data: profile, error: profileError } = await service
    .from('profiles')
    .select('house_id')
    .eq('id', claims.userId)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const { data: pet, error: insertError } = await service
    .from('pets')
    .insert({
      owner_id:           claims.userId,
      house_id:           (profile as { house_id: string | null }).house_id ?? null,
      name:               name.trim(),
      type:               type.trim(),
      breed:              breed?.trim() ?? '',
      photo_url:          photoUrl ?? '',
      vaccination_status: vaccinationStatus ?? false,
    })
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
      houses!pets_house_id_fkey ( house_number )
    `)
    .single()

  if (insertError || !pet) {
    return NextResponse.json({ error: 'Failed to register pet' }, { status: 500 })
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
    houses: { house_number: string } | null
  }

  const result: Pet = {
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
    registrationDate:  row.created_at,
  }

  await service.from('audit_logs').insert({
    user_id:     claims.userId,
    action:      'pet_registered',
    entity_type: 'pets',
    entity_id:   row.id,
    metadata:    { name: row.name, type: row.type, breed: row.breed },
  })

  return NextResponse.json({ pet: result }, { status: 201 })
}
