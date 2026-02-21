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

// GET /api/admin/roles — list all roles
export async function GET() {
  const claims = await getCallerClaims()
  const denied = requireAction(claims, 'manage_roles')
  if (denied) return NextResponse.json(await denied.json(), { status: denied.status })

  const service = createServiceClient()
  const { data, error } = await service
    .from('roles')
    .select('*')
    .order('is_system', { ascending: false })
    .order('display_name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const roles = (data ?? []).map(r => ({
    id:          r.id,
    value:       r.value,
    displayName: r.display_name,
    description: r.description,
    isSystem:    r.is_system,
    color:       r.color,
    permissions: r.permissions as RolePermissions,
    createdAt:   r.created_at,
    updatedAt:   r.updated_at,
  }))

  return NextResponse.json(roles)
}

// POST /api/admin/roles — create a new custom role
export async function POST(request: Request) {
  const claims = await getCallerClaims()
  const denied = requireAction(claims, 'manage_roles')
  if (denied) return NextResponse.json(await denied.json(), { status: denied.status })

  const body = await request.json() as {
    value:        string
    displayName:  string
    description?: string
    color?:       string
    permissions:  RolePermissions
  }

  const { value, displayName, permissions } = body

  // Validate role value: uppercase letters, digits, underscores; must start with a letter
  if (!value || !/^[A-Z][A-Z0-9_]*$/.test(value)) {
    return NextResponse.json(
      { error: 'Role key must be uppercase letters, digits, and underscores (e.g. MY_ROLE)' },
      { status: 400 },
    )
  }

  if (!displayName?.trim()) {
    return NextResponse.json({ error: 'Display name is required' }, { status: 400 })
  }

  if (!permissions || !Array.isArray(permissions.routes) || !Array.isArray(permissions.actions)) {
    return NextResponse.json({ error: 'Invalid permissions format' }, { status: 400 })
  }

  const service = createServiceClient()

  // Check uniqueness
  const { data: existing } = await service
    .from('roles')
    .select('id')
    .eq('value', value)
    .single()

  if (existing) {
    return NextResponse.json({ error: `Role key "${value}" is already in use` }, { status: 409 })
  }

  const { data, error } = await service
    .from('roles')
    .insert({
      value,
      display_name: displayName.trim(),
      description:  body.description?.trim() ?? null,
      color:        body.color ?? 'slate',
      is_system:    false,
      permissions,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await service.from('audit_logs').insert({
    user_id: claims!.userId,
    action: 'role_created',
    entity_type: 'roles',
    entity_id: data.id,
    metadata: {
      detail: `Created role "${data.display_name}" (${data.value})`,
      roleValue: data.value,
      displayName: data.display_name,
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
  }, { status: 201 })
}
