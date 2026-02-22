import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCallerClaims, requireAction } from '@/lib/server-auth'

export async function POST(req: NextRequest) {
  const claims = await getCallerClaims()
  const denied = requireAction(claims, 'scan_qr')
  if (denied) return NextResponse.json(await denied.json(), { status: denied.status })

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
      status: 'DENIED',
      guard_id: user.id,
      entry_method: 'QR_SCAN',
    })
    .select()
    .single()

  if (logError) return NextResponse.json({ error: logError.message }, { status: 500 })

  return NextResponse.json(log)
}
