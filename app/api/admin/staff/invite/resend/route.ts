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

// POST /api/admin/staff/invite/resend — resend a single-use invite link to an invited user
export async function POST(request: Request) {
  const claims = await getCallerClaims()
  const denied = requireAction(claims, 'manage_users')
  if (denied) return NextResponse.json(await denied.json(), { status: denied.status })

  const body = await request.json() as { userId?: string }
  const userId = body.userId?.trim() ?? ''

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  const service = createServiceClient()

  // Fetch profile
  const { data: profile, error: profileError } = await service
    .from('profiles')
    .select('full_name, email, role, created_via, status')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (profile.created_via !== 'INVITED') {
    return NextResponse.json({ error: 'This user was not created via invite' }, { status: 400 })
  }

  // Fetch role display name
  const { data: roleRecord } = await service
    .from('roles')
    .select('display_name')
    .eq('value', profile.role)
    .single()

  const roleDisplayName = roleRecord?.display_name ?? profile.role

  // Generate fresh single-use recovery link
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ilmiaone.org'
  const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
    type: 'recovery',
    email: profile.email,
    options: {
      redirectTo: `${siteUrl}/auth/reset-password`,
    },
  })

  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.json(
      { error: linkError?.message ?? 'Failed to generate invite link' },
      { status: 500 }
    )
  }

  // Send invite email (non-blocking)
  sendStaffInviteEmail({
    fullName: profile.full_name,
    email: profile.email,
    roleDisplayName,
    inviteLink: linkData.properties.action_link,
  }).catch(err => console.error('[email] resend invite email failed:', err))

  // Audit log
  service.from('audit_logs').insert({
    user_id: claims!.userId,
    action: 'invite_resent',
    entity_type: 'profiles',
    entity_id: userId,
    metadata: {
      email: profile.email,
      role: profile.role,
      fullName: profile.full_name,
      detail: `Resent invite to ${profile.full_name} (${profile.email})`,
    },
  }).then(({ error }) => { if (error) console.error('[audit_log] invite_resent log failed:', error.message) })

  return NextResponse.json({ success: true, emailSent: true })
}
