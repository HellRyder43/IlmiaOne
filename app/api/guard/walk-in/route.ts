import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
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

  return NextResponse.json(data)
}
