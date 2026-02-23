import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCallerClaims } from '@/lib/server-auth'
import { z } from 'zod'

const addMemberSchema = z.object({
  name:         z.string().min(1, 'Name is required').max(100),
  relationship: z.enum(['SPOUSE', 'CHILD', 'RELATIVE', 'TENANT']),
  phoneNumber:  z.string().max(20).optional().or(z.literal('')),
})

export async function POST(req: NextRequest) {
  const claims = await getCallerClaims()
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = addMemberSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    )
  }

  const { name, relationship, phoneNumber } = parsed.data

  const supabase = await createClient()

  // Always resolve house_id from the caller's profile — never trust client
  const { data: profile } = await supabase
    .from('profiles')
    .select('house_id')
    .eq('id', claims.userId)
    .single()

  if (!profile?.house_id) {
    return NextResponse.json(
      { error: 'No house assigned to your profile' },
      { status: 422 },
    )
  }

  const { data, error } = await supabase
    .from('house_members')
    .insert({
      house_id:     profile.house_id,
      name,
      relationship,
      phone_number: phoneNumber?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
  }

  supabase.from('audit_logs').insert({
    user_id: claims.userId,
    action: 'household_member_added',
    entity_type: 'house_members',
    entity_id: data.id,
    metadata: {
      detail: `Added ${name} (${relationship}) as a household member`,
      name,
      relationship,
    },
  }).then(() => {})

  return NextResponse.json(data, { status: 201 })
}
