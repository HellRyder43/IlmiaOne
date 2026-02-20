import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await supabase
    .from('houses')
    .select('id, house_number, street')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const sorted = (data ?? []).sort((a, b) => {
    const nA = parseInt(a.house_number), nB = parseInt(b.house_number)
    if (nA !== nB) return nA - nB
    return a.house_number < b.house_number ? -1 : 1
  })
  return NextResponse.json(sorted)
}
