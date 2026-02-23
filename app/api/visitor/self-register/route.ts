import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { visitorName, phoneNumber, visitorType, houseNumber, visitReason, vehicleNumber, icNumber } = body

  if (!visitorName || !phoneNumber || !visitorType || !houseNumber || !visitReason) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await supabase
    .from('visitor_logs')
    .insert({
      visitor_name: visitorName,
      visitor_type: visitorType,
      visit_reason: visitReason,
      house_number: houseNumber,
      phone_number: phoneNumber,
      ic_number: icNumber ?? null,
      vehicle_number: vehicleNumber ?? null,
      check_in_time: new Date().toISOString(),
      status: 'INSIDE',
      guard_id: null,
      entry_method: 'SELF_SERVICE',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  supabase.from('audit_logs').insert({
    user_id: null,
    action: 'visitor_self_checkin',
    entity_type: 'visitor_logs',
    entity_id: data.id,
    metadata: {
      detail: `Self-service check-in by ${visitorName} for house ${houseNumber}`,
      visitorName,
      visitorType,
      houseNumber,
      entryMethod: 'SELF_SERVICE',
    },
  }).then(({ error }) => { if (error) console.error('[audit_log] insert failed:', error.message) })

  return NextResponse.json(data)
}
