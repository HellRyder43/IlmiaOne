import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getCallerClaims } from '@/lib/server-auth'

function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function DELETE() {
  const claims = await getCallerClaims()
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  const { data: request } = await service
    .from('house_change_requests')
    .select('id')
    .eq('resident_id', claims.userId)
    .eq('status', 'PENDING')
    .maybeSingle()

  if (!request) {
    return NextResponse.json({ error: 'No pending house change request found' }, { status: 404 })
  }

  const { error } = await service
    .from('house_change_requests')
    .delete()
    .eq('id', request.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to cancel request' }, { status: 500 })
  }

  await service.from('audit_logs').insert({
    user_id:     claims.userId,
    action:      'house_change_cancelled',
    entity_type: 'house_change_requests',
    entity_id:   request.id,
    metadata:    { detail: 'Resident cancelled their pending house change request' },
  })

  return NextResponse.json({ success: true })
}
