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

// PUT /api/admin/users/:id/role — change a user's role
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const claims = await getCallerClaims()
  const denied = requireAction(claims, 'assign_user_role')
  if (denied) return NextResponse.json(await denied.json(), { status: denied.status })

  const { id } = await params

  // Prevent changing your own role
  if (claims!.userId === id) {
    return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 })
  }

  const { role } = await request.json() as { role: string }

  if (!role?.trim()) {
    return NextResponse.json({ error: 'Role is required' }, { status: 400 })
  }

  const service = createServiceClient()

  // Verify the target role exists in the roles table
  const { data: roleRecord } = await service
    .from('roles')
    .select('value')
    .eq('value', role)
    .single()

  if (!roleRecord) {
    return NextResponse.json({ error: `Role "${role}" does not exist` }, { status: 400 })
  }

  // Verify the target user exists
  const { data: profile, error: profileError } = await service
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (profile.role === role) {
    return NextResponse.json({ error: 'User already has this role' }, { status: 400 })
  }

  const { error } = await service
    .from('profiles')
    .update({ role })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await service.from('audit_logs').insert({
    user_id: claims!.userId,
    action: 'user_role_assigned',
    entity_type: 'profiles',
    entity_id: id,
    metadata: {
      detail: `Changed ${profile.full_name}'s role from ${profile.role} to ${role}`,
      userId: id,
      fromRole: profile.role,
      toRole: role,
    },
  })

  return NextResponse.json({ success: true, userId: id, newRole: role })
}
