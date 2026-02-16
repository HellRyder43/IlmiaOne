'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Building2, Lock, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const resetPasswordSchema = z
  .object({
    password: z.string()
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
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordData>({ resolver: zodResolver(resetPasswordSchema) })

  const onSubmit = async (data: ResetPasswordData) => {
    setIsLoading(true)
    const { error } = await supabase.auth.updateUser({ password: data.password })
    setIsLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Password updated successfully')
    router.push('/login')
  }

  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 md:p-12">
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
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
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
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
        </div>

        <Button
          type="submit"
          className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11 text-base font-medium shadow-lg shadow-slate-900/10"
          disabled={isLoading}
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</>
          ) : (
            <>Update Password<ArrowRight className="w-4 h-4 ml-2" /></>
          )}
        </Button>
      </form>
    </div>
  )
}
