import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getCallerClaims, requireAction } from '@/lib/server-auth'
import type { RolePermissions } from '@/lib/types'

function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// PUT /api/admin/roles/:id — update a role
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const claims = await getCallerClaims()
  const denied = requireAction(claims, 'manage_roles')
  if (denied) return NextResponse.json(await denied.json(), { status: denied.status })

  const { id } = await params
  const service = createServiceClient()

  const { data: existing, error: fetchError } = await service
    .from('roles')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 })
  }

  const body = await request.json() as {
    displayName?:  string
    description?:  string
    color?:        string
    permissions?:  RolePermissions
  }

  // System roles: block display name changes — it is immutable for system roles
  // The 'value' field is always immutable (FK cascade makes it technically possible but dangerous)
  if (existing.is_system && body.displayName !== undefined) {
    return NextResponse.json(
      { error: 'System role display names cannot be changed' },
      { status: 403 },
    )
  }

  const updatePayload: Record<string, unknown> = {}

  if (body.displayName !== undefined) {
    if (!body.displayName.trim()) {
      return NextResponse.json({ error: 'Display name cannot be empty' }, { status: 400 })
    }
    updatePayload.display_name = body.displayName.trim()
  }

  if (body.description !== undefined) {
    updatePayload.description = body.description?.trim() ?? null
  }

  if (body.color !== undefined) {
    updatePayload.color = body.color
  }

  if (body.permissions !== undefined) {
    if (!Array.isArray(body.permissions.routes) || !Array.isArray(body.permissions.actions)) {
      return NextResponse.json({ error: 'Invalid permissions format' }, { status: 400 })
    }
    updatePayload.permissions = body.permissions
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data, error } = await service
    .from('roles')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await service.from('audit_logs').insert({
    user_id: claims!.userId,
    action: 'role_updated',
    entity_type: 'roles',
    entity_id: data.id,
    metadata: {
      detail: `Updated role "${data.display_name}"`,
      roleValue: data.value,
      changes: Object.keys(updatePayload),
    },
  })

  return NextResponse.json({
    id:          data.id,
    value:       data.value,
    displayName: data.display_name,
    description: data.description,
    isSystem:    data.is_system,
    color:       data.color,
    permissions: data.permissions,
    createdAt:   data.created_at,
    updatedAt:   data.updated_at,
  })
}

// DELETE /api/admin/roles/:id — delete a custom role
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const claims = await getCallerClaims()
  const denied = requireAction(claims, 'manage_roles')
  if (denied) return NextResponse.json(await denied.json(), { status: denied.status })

  const { id } = await params
  const service = createServiceClient()

  const { data: role, error: fetchError } = await service
    .from('roles')
    .select('value, is_system')
    .eq('id', id)
    .single()

  if (fetchError || !role) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 })
  }

  if (role.is_system) {
    return NextResponse.json({ error: 'System roles cannot be deleted' }, { status: 403 })
  }

  // Block deletion if any users are assigned this role
  const { count } = await service
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', role.value)

  if (count && count > 0) {
    return NextResponse.json(
      { error: `Cannot delete role — ${count} user${count === 1 ? ' is' : 's are'} currently assigned this role` },
      { status: 409 },
    )
  }

  const { error } = await service.from('roles').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await service.from('audit_logs').insert({
    user_id: claims!.userId,
    action: 'role_deleted',
    entity_type: 'roles',
    entity_id: id,
    metadata: {
      detail: `Deleted role "${role.value}"`,
      roleValue: role.value,
    },
  })

  return NextResponse.json({ success: true })
}
