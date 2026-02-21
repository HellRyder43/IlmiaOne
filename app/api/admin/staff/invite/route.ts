import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getCallerClaims, requireAction } from '@/lib/server-auth'
import { sendStaffInviteEmail } from '@/lib/email'

function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST /api/admin/staff/invite — create a pre-approved staff account and send an invite email
export async function POST(request: Request) {
  const claims = await getCallerClaims()
  const denied = requireAction(claims, 'manage_users')
  if (denied) return NextResponse.json(await denied.json(), { status: denied.status })

  const body = await request.json() as { email?: string; fullName?: string; role?: string }
  const email = body.email?.trim().toLowerCase() ?? ''
  const fullName = body.fullName?.trim() ?? ''
  const role = body.role?.trim() ?? ''

  // Basic validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }
  if (!fullName) {
    return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
  }
  if (!role || role === 'RESIDENT') {
    return NextResponse.json({ error: 'A non-resident staff role is required' }, { status: 400 })
  }

  const service = createServiceClient()

  // Verify role exists and get display name for the email
  const { data: roleRecord } = await service
    .from('roles')
    .select('value, display_name')
    .eq('value', role)
    .single()

  if (!roleRecord) {
    return NextResponse.json({ error: `Role "${role}" does not exist` }, { status: 400 })
  }

  // Check for existing profile with this email
  const { data: existingProfile } = await service
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existingProfile) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
  }

  // Create auth user with email pre-confirmed, no password
  const { data: authData, error: authError } = await service.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (authError) {
    if (authError.message.toLowerCase().includes('already been registered')) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  const newUser = authData.user

  // Insert profile with APPROVED status
  const { error: profileError } = await service.from('profiles').insert({
    id: newUser.id,
    full_name: fullName,
    email,
    role,
    status: 'APPROVED',
    house_id: null,
  })

  if (profileError) {
    // Rollback: delete the auth user we just created
    await service.auth.admin.deleteUser(newUser.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // Generate password-set link (recovery type lands on /auth/reset-password)
  const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
    type: 'recovery',
    email,
  })

  if (linkError || !linkData?.properties?.action_link) {
    // Account was created — return partial success with warning
    return NextResponse.json(
      { success: true, userId: newUser.id, emailSent: false, warning: 'Account created but invite email could not be sent. Share the reset password link manually.' },
      { status: 201 }
    )
  }

  // Send invite email non-blocking
  sendStaffInviteEmail({
    fullName,
    email,
    roleDisplayName: roleRecord.display_name,
    inviteLink: linkData.properties.action_link,
  }).catch(() => {})

  // Audit log
  await service.from('audit_logs').insert({
    user_id: claims!.userId,
    action: 'staff_invited',
    entity_type: 'profile',
    entity_id: newUser.id,
    metadata: { email, role },
  })

  return NextResponse.json({ success: true, userId: newUser.id, emailSent: true }, { status: 201 })
}
