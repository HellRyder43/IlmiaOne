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

  return NextResponse.json(data)
}
