import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendAdminRegistrationNotification } from '@/lib/email'

function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const resubmitSchema = z.object({
  fullName: z.string().min(2),
  houseNumber: z.string().min(1),
  icNumber: z.string().regex(/^\d{4}$/),
  residentType: z.enum(['OWNER', 'TENANT']),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = resubmitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
  }
  const { fullName, houseNumber, icNumber, residentType } = parsed.data

  const service = createServiceClient()

  // Verify the resident is currently REJECTED
  const { data: profile, error: fetchError } = await service
    .from('profiles')
    .select('full_name, email, status')
    .eq('id', user.id)
    .single()

  if (fetchError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (profile.status !== 'REJECTED') {
    return NextResponse.json({ error: 'Only rejected profiles can resubmit' }, { status: 400 })
  }

  // Look up house_id from house_number
  const { data: house, error: houseError } = await service
    .from('houses')
    .select('id, street')
    .eq('house_number', houseNumber)
    .single()

  if (houseError || !house) {
    return NextResponse.json({ error: `House number "${houseNumber}" not found` }, { status: 400 })
  }

  // Update profile with corrected fields and reset status
  const { error: updateError } = await service
    .from('profiles')
    .update({
      full_name: fullName,
      house_id: house.id,
      ic_number: icNumber.slice(-4),
      resident_type: residentType,
      status: 'PENDING_APPROVAL',
      rejection_reason: null,
    })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to resubmit' }, { status: 500 })
  }

  // Notify all AJK profiles in-app
  const { data: admins } = await service
    .from('profiles')
    .select('id, email')
    .in('role', ['AJK_LEADER', 'AJK_COMMITTEE'])
    .eq('status', 'APPROVED')

  if (admins?.length) {
    await service.from('notifications').insert(
      admins.map((a: { id: string; email: string }) => ({
        user_id: a.id,
        title: 'Registration Resubmitted',
        message: `${fullName} from house ${houseNumber} has resubmitted their registration.`,
        type: 'REGISTRATION_PENDING',
      }))
    )

    // Email all admins
    for (const a of admins as { id: string; email: string }[]) {
      await sendAdminRegistrationNotification({
        residentName: fullName,
        houseNumber,
        street: house.street ?? undefined,
        residentEmail: profile.email,
        adminEmail: a.email,
      }).catch(err => console.error('[email] admin notification email failed:', err))
    }
  }

  service.from('audit_logs').insert({
    user_id: user.id,
    action: 'registration_resubmitted',
    entity_type: 'profiles',
    entity_id: user.id,
    metadata: {
      detail: `${fullName} resubmitted registration for house ${houseNumber} after rejection`,
      fullName,
      houseNumber,
      residentType,
    },
  }).then(({ error }) => { if (error) console.error('[audit_log] resubmit insert failed:', error.message) })

  return NextResponse.json({ success: true })
}
