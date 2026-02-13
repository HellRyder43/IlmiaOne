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
    .select('id, house_number')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const sorted = (data ?? []).sort((a, b) => parseInt(a.house_number) - parseInt(b.house_number))
  return NextResponse.json(sorted)
}
