import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/login'
  if (!next.startsWith('/')) next = '/login'

  const supabase = await createClient()
  const forwardedHost = request.headers.get('x-forwarded-host')
  const redirectBase =
    process.env.NODE_ENV !== 'development' && forwardedHost
      ? `https://${forwardedHost}`
      : origin

  // Path 1: token_hash flow (custom email template — primary path)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) {
      return NextResponse.redirect(`${redirectBase}${next}`)
    }
  }

  // Path 2: PKCE code flow (old emails in flight + future fallback)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${redirectBase}${next}`)
    }
  }

  return NextResponse.redirect(`${redirectBase}/login`)
}
