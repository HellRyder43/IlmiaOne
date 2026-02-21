import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getCallerClaims, requireAction } from '@/lib/server-auth'
import type { HouseChangeRequest } from '@/lib/types'

function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function GET() {
  const claims = await getCallerClaims()
  const denied = requireAction(claims, 'approve_registrations')
  if (denied) return NextResponse.json(await denied.json(), { status: denied.status })

  const service = createServiceClient()

  const { data, error } = await service
    .from('house_change_requests')
    .select(`
      id,
      resident_id,
      current_house_id,
      requested_house_id,
      status,
      rejection_reason,
      reviewed_by,
      reviewed_at,
      created_at,
      profiles!house_change_requests_resident_id_fkey(full_name, email),
      current_house:houses!house_change_requests_current_house_id_fkey(house_number),
      requested_house:houses!house_change_requests_requested_house_id_fkey(house_number, street, occupancy_status)
    `)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const requests: HouseChangeRequest[] = ((data ?? []) as unknown as Array<{
    id: string
    resident_id: string
    current_house_id: string | null
    requested_house_id: string
    status: string
    rejection_reason: string | null
    reviewed_by: string | null
    reviewed_at: string | null
    created_at: string
    profiles: { full_name: string; email: string } | null
    current_house: { house_number: string } | null
    requested_house: { house_number: string; street: string | null; occupancy_status: string } | null
  }>).map(row => ({
    id:                   row.id,
    residentId:           row.resident_id,
    residentName:         row.profiles?.full_name,
    residentEmail:        row.profiles?.email,
    currentHouseId:       row.current_house_id,
    currentHouseNumber:   row.current_house?.house_number ?? null,
    requestedHouseId:     row.requested_house_id,
    requestedHouseNumber: row.requested_house?.house_number ?? '',
    status:               row.status as HouseChangeRequest['status'],
    rejectionReason:      row.rejection_reason ?? undefined,
    reviewedBy:           row.reviewed_by ?? undefined,
    reviewedAt:           row.reviewed_at ?? undefined,
    createdAt:            row.created_at,
  }))

  return NextResponse.json(requests)
}
