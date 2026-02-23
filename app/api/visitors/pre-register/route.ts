import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { visitorName, visitorType, visitReason, expectedDate, phoneNumber, vehicleNumber, houseId } = body

  if (!visitorName || !visitorType || !visitReason || !expectedDate || !houseId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const qrCode = crypto.randomUUID()
  // Expire at 23:59:59 MYT (UTC+8) on the expected date
  const expiresAt = `${expectedDate}T15:59:59Z`

  const { data, error } = await supabase
    .from('visitor_pre_registrations')
    .insert({
      resident_id: user.id,
      house_id: houseId,
      visitor_name: visitorName,
      visitor_type: visitorType,
      visit_reason: visitReason,
      expected_date: expectedDate,
      phone_number: phoneNumber ?? null,
      vehicle_number: vehicleNumber ?? null,
      qr_code: qrCode,
      status: 'ACTIVE',
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'visitor_pass_created',
    entity_type: 'visitor_pre_registrations',
    entity_id: data.id,
    metadata: {
      detail: `Created visitor pass for ${visitorName} (${visitorType}) expected on ${expectedDate}`,
      visitorName,
      visitorType,
      expectedDate,
      houseId,
    },
  }).then(({ error }) => { if (error) console.error('[audit_log] insert failed:', error.message) })

  return NextResponse.json(data)
}
