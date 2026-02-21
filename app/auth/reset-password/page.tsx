'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Building2, Lock, Loader2, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type PageState = 'loading' | 'form' | 'expired' | 'invalid'

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least 1 number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ResetPasswordData = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const [pageState, setPageState] = useState<PageState>('loading')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordData>({ resolver: zodResolver(resetPasswordSchema) })

  useEffect(() => {
    // Check URL hash for error fragments (e.g. expired or invalid token)
    const hash = window.location.hash
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash.replace('#', ''))
      const errorCode = params.get('error_code')
      setPageState(errorCode === 'otp_expired' ? 'expired' : 'invalid')
      return
    }

    // Determine the flow type from the hash (recovery, invite, signup)
    const hashParams = new URLSearchParams(hash.replace('#', ''))
    const type = hashParams.get('type')
    const isValidType = type === 'recovery' || type === 'invite' || type === 'signup'

    const showForm = () => setPageState('form')

    // Race-condition-safe: Supabase may have already exchanged the hash tokens
    // for a session before this effect runs (PASSWORD_RECOVERY fires early).
    // onAuthStateChange immediately emits INITIAL_SESSION with the current state,
    // so we catch both "already done" and "in-flight" cases here.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'PASSWORD_RECOVERY') {
          showForm()
        } else if (event === 'SIGNED_IN' && isValidType) {
          showForm()
        } else if (event === 'INITIAL_SESSION' && session && isValidType) {
          // Supabase finished exchanging the hash before our listener registered
          showForm()
        }
      }
    )

    // Belt-and-suspenders: if there is already an active session and the hash
    // looks like a valid recovery/invite link, show the form immediately.
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      if (session && isValidType) {
        showForm()
      }
    })

    // Final fallback: if nothing resolved after 5 seconds, show invalid state
    const timer = setTimeout(() => {
      setPageState((current) => (current === 'loading' ? 'invalid' : current))
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [supabase])

  const onSubmit = async (data: ResetPasswordData) => {
    setIsSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password: data.password })
    setIsSubmitting(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Password updated successfully')
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 md:p-12">
        {/* Loading state */}
        {pageState === 'loading' && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Verifying link…</h2>
            <p className="text-slate-500 text-sm">Please wait while we verify your link.</p>
          </div>
        )}

        {/* Expired token */}
        {pageState === 'expired' && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Link expired</h2>
            <p className="text-slate-500 text-sm mb-6">
              This link has expired. Password reset and invite links are only valid for a limited time.
              Please request a new one.
            </p>
            <Link href="/login">
              <Button variant="outline" className="w-full h-11">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </div>
        )}

        {/* Invalid / no token */}
        {pageState === 'invalid' && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Invalid link</h2>
            <p className="text-slate-500 text-sm mb-6">
              This link is invalid or has already been used. Please request a new password reset from the login page.
            </p>
            <Link href="/login">
              <Button variant="outline" className="w-full h-11">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </div>
        )}

        {/* Password form */}
        {pageState === 'form' && (
          <>
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Set New Password</h2>
              <p className="text-slate-500 text-sm">Enter your new password below.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    placeholder="New Password"
                    autoComplete="new-password"
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 h-11 rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm shadow-sm',
                      errors.password ? 'border-red-400' : 'border-slate-300'
                    )}
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    autoComplete="new-password"
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 h-11 rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm shadow-sm',
                      errors.confirmPassword ? 'border-red-400' : 'border-slate-300'
                    )}
                    {...register('confirmPassword')}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11 text-base font-medium shadow-lg shadow-slate-900/10"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating…
                  </>
                ) : (
                  <>
                    Update Password
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
