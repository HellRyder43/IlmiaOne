import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { preRegistrationId } = await req.json()
  if (!preRegistrationId) {
    return NextResponse.json({ error: 'Missing preRegistrationId' }, { status: 400 })
  }

  const { data: preReg, error: preRegError } = await supabase
    .from('visitor_pre_registrations')
    .select('*')
    .eq('id', preRegistrationId)
    .single()

  if (preRegError || !preReg) {
    return NextResponse.json({ error: 'Pass not found' }, { status: 404 })
  }

  if (preReg.status !== 'ACTIVE') {
    return NextResponse.json(
      { error: preReg.status === 'USED' ? 'Pass already used' : 'Pass has expired' },
      { status: 400 },
    )
  }

  if (new Date(preReg.expires_at) < new Date()) {
    await supabase
      .from('visitor_pre_registrations')
      .update({ status: 'EXPIRED' })
      .eq('id', preRegistrationId)
    return NextResponse.json({ error: 'Pass has expired' }, { status: 400 })
  }

  const { data: house } = await supabase
    .from('houses')
    .select('house_number')
    .eq('id', preReg.house_id)
    .single()

  const { data: log, error: logError } = await supabase
    .from('visitor_logs')
    .insert({
      pre_registration_id: preRegistrationId,
      visitor_name: preReg.visitor_name,
      visitor_type: preReg.visitor_type,
      visit_reason: preReg.visit_reason,
      house_number: house?.house_number ?? '',
      vehicle_number: preReg.vehicle_number ?? null,
      phone_number: preReg.phone_number ?? null,
      check_in_time: new Date().toISOString(),
      status: 'INSIDE',
      guard_id: user.id,
      entry_method: 'QR_SCAN',
    })
    .select()
    .single()

  if (logError) return NextResponse.json({ error: logError.message }, { status: 500 })

  await supabase
    .from('visitor_pre_registrations')
    .update({ status: 'USED' })
    .eq('id', preRegistrationId)

  return NextResponse.json(log)
}
