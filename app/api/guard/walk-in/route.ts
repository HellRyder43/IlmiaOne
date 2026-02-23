import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCallerClaims, requireAction } from '@/lib/server-auth'

export async function POST(req: NextRequest) {
  const claims = await getCallerClaims()
  const denied = requireAction(claims, 'log_walk_in')
  if (denied) return NextResponse.json(await denied.json(), { status: denied.status })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { visitorName, visitorType, visitReason, houseNumber, icNumber, vehicleNumber, phoneNumber } = body

  if (!visitorName || !visitorType || !visitReason || !houseNumber) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('visitor_logs')
    .insert({
      visitor_name: visitorName,
      visitor_type: visitorType,
      visit_reason: visitReason,
      house_number: houseNumber,
      ic_number: icNumber ?? null,
      vehicle_number: vehicleNumber ?? null,
      phone_number: phoneNumber ?? null,
      check_in_time: new Date().toISOString(),
      status: 'INSIDE',
      guard_id: user.id,
      entry_method: 'WALK_IN',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'visitor_walk_in',
    entity_type: 'visitor_logs',
    entity_id: data.id,
    metadata: {
      detail: `Guard logged walk-in entry for ${visitorName} visiting house ${houseNumber}`,
      visitorName,
      visitorType,
      houseNumber,
      entryMethod: 'WALK_IN',
    },
  }).then(() => {})

  return NextResponse.json(data)
}
