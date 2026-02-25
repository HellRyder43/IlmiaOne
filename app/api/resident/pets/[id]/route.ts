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
