import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCallerClaims } from '@/lib/server-auth'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const claims = await getCallerClaims()
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()

  // RLS automatically blocks deleting rows from another house.
  // If no row is returned, treat as 404 (doesn't expose whether it belongs to another house).
  const { data, error } = await supabase
    .from('house_members')
    .delete()
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
