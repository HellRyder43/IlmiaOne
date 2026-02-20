'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Building2, Mail, Lock, User, Home, CreditCard,
  ArrowRight, Loader2, CheckCircle2, ChevronDown, Eye, EyeOff, Search,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').regex(/^[a-zA-Z\s\-'@]+$/, 'Name must contain letters only'),
  houseNumber: z.string().min(1, 'Please select your house'),
  icNumber: z.string().regex(/^\d{4}$/, 'Enter the last 4 digits of your IC number (numbers only)'),
  residentType: z.enum(['OWNER', 'TENANT'] as const, { message: 'Please select your resident type' }),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least 1 number'),
})

type LoginData = z.infer<typeof loginSchema>
type RegisterFormData = z.infer<typeof registerSchema>

function LoginForm({ onForgotPassword }: { onForgotPassword: () => void }) {
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true)
    try {
      await login(data)
    } catch (err) {
      setIsLoading(false)
      toast.error(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <div className="relative">
          <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="email"
            placeholder="Email Address"
            autoComplete="email"
            className={cn(
              'w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm shadow-sm',
              errors.email ? 'border-red-400' : 'border-slate-300'
            )}
            {...register('email')}
          />
        </div>
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <div className="relative">
          <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            autoComplete="current-password"
            className={cn(
              'w-full pl-10 pr-10 py-2.5 rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm shadow-sm',
              errors.password ? 'border-red-400' : 'border-slate-300'
            )}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(p => !p)}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
        >
          Forgot Password?
        </button>
      </div>

      <Button
        type="submit"
        className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11 text-base font-medium shadow-lg shadow-slate-900/10"
        disabled={isLoading}
      >
        {isLoading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing In...</>
        ) : (
          <>Sign In<ArrowRight className="w-4 h-4 ml-2" /></>
        )}
      </Button>
    </form>
  )
}

type HouseOption = { id: string; house_number: string; street: string | null }

function RegisterForm() {
  const { register: registerUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [housesData, setHousesData] = useState<HouseOption[]>([])
  const [houseOpen, setHouseOpen] = useState(false)
  const [houseSearch, setHouseSearch] = useState('')

  useEffect(() => {
    fetch('/api/houses').then(r => r.json()).then(setHousesData)
  }, [])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  const filteredHouses = housesData.filter(h => {
    const q = houseSearch.toLowerCase()
    return h.house_number.toLowerCase().includes(q) || (h.street ?? '').toLowerCase().includes(q)
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      await registerUser(data)
      setSuccess(true)
    } catch (err) {
      setIsLoading(false)
      toast.error(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Registration Submitted</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          Your account is pending approval from the Admin. You will be notified once approved.
          Please verify your email address in the meantime.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div>
        <div className="relative">
          <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Full Name"
            autoComplete="name"
            onInput={(e) => {
              const el = e.currentTarget
              el.value = el.value.replace(/[^a-zA-Z\s\-'@]/g, '')
            }}
            className={cn(
              'w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm shadow-sm',
              errors.fullName ? 'border-red-400' : 'border-slate-300'
            )}
            {...register('fullName')}
          />
        </div>
        {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
      </div>

      {/* House number combobox — full width */}
      <div>
        <Controller
          name="houseNumber"
          control={control}
          render={({ field }) => {
            const selected = housesData.find(h => h.house_number === field.value)
            return (
              <Popover open={houseOpen} onOpenChange={setHouseOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'relative w-full flex items-center gap-2 pl-10 pr-4 py-2.5 rounded-lg border bg-white text-left text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all',
                      errors.houseNumber ? 'border-red-400' : 'border-slate-300'
                    )}
                  >
                    <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    {selected ? (
                      <span className="text-slate-900">
                        No. {selected.house_number}
                        {selected.street && <span className="text-slate-400"> · {selected.street}</span>}
                      </span>
                    ) : (
                      <span className="text-slate-400">Select your house</span>
                    )}
                    <ChevronDown className="ml-auto w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <div className="flex items-center border-b border-slate-200 px-3">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      className="flex-1 py-2 pl-2 text-sm bg-transparent outline-none placeholder:text-slate-400"
                      placeholder="Search house number or street..."
                      value={houseSearch}
                      onChange={e => setHouseSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto py-1">
                    {filteredHouses.length === 0 ? (
                      <p className="px-3 py-4 text-xs text-slate-400 text-center">No houses found</p>
                    ) : (
                      filteredHouses.map(h => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => {
                            field.onChange(h.house_number)
                            setHouseOpen(false)
                            setHouseSearch('')
                          }}
                          className={cn(
                            'w-full flex flex-col items-start px-3 py-2 text-sm hover:bg-slate-50 transition-colors',
                            field.value === h.house_number && 'bg-emerald-50 text-emerald-700'
                          )}
                        >
                          <span className="font-medium">No. {h.house_number}</span>
                          {h.street && <span className="text-xs text-slate-400">{h.street}</span>}
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )
          }}
        />
        {errors.houseNumber && <p className="mt-1 text-xs text-red-600">{errors.houseNumber.message}</p>}
      </div>

      <div>
        <div className="relative">
          <CreditCard className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Last 4 digits of IC"
            inputMode="numeric"
            maxLength={4}
            className={cn(
              'w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm shadow-sm',
              errors.icNumber ? 'border-red-400' : 'border-slate-300'
            )}
            {...register('icNumber')}
          />
        </div>
        {errors.icNumber && <p className="mt-1 text-xs text-red-600">{errors.icNumber.message}</p>}
      </div>

      <div>
        <div className="relative">
          <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-slate-400 pointer-events-none" />
          <select
            className={cn(
              'w-full px-4 py-2.5 rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm shadow-sm appearance-none',
              errors.residentType ? 'border-red-400' : 'border-slate-300'
            )}
            {...register('residentType')}
          >
            <option value="">Resident Type</option>
            <option value="OWNER">Owner</option>
            <option value="TENANT">Tenant</option>
          </select>
        </div>
        {errors.residentType && <p className="mt-1 text-xs text-red-600">{errors.residentType.message}</p>}
      </div>

      <div>
        <div className="relative">
          <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="email"
            placeholder="Email Address"
            autoComplete="email"
            className={cn(
              'w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm shadow-sm',
              errors.email ? 'border-red-400' : 'border-slate-300'
            )}
            {...register('email')}
          />
        </div>
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <div className="relative">
          <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password (min 8 characters)"
            autoComplete="new-password"
            className={cn(
              'w-full pl-10 pr-10 py-2.5 rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm shadow-sm',
              errors.password ? 'border-red-400' : 'border-slate-300'
            )}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(p => !p)}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
      </div>

      <Button
        type="submit"
        className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11 text-base font-medium shadow-lg shadow-slate-900/10"
        disabled={isLoading}
      >
        {isLoading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating Account...</>
        ) : (
          <>Create Account<ArrowRight className="w-4 h-4 ml-2" /></>
        )}
      </Button>
    </form>
  )
}

function ForgotPasswordPanel({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setIsLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Check Your Email</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          If an account exists for <strong>{email}</strong>, a password reset link has been sent.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          Back to Sign In
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Reset Password</h3>
        <p className="text-sm text-slate-500">Enter your email and we&apos;ll send a reset link.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="email"
            required
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm shadow-sm"
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11 text-base font-medium"
          disabled={isLoading}
        >
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : 'Send Reset Link'}
        </Button>
      </form>
      <button
        type="button"
        onClick={onBack}
        className="block w-full text-center text-sm text-slate-500 hover:text-slate-700"
      >
        Back to Sign In
      </button>
    </div>
  )
}

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')

  return (
    <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row h-auto md:h-[700px]">

      {/* Left Side — Branding */}
      <div className="hidden md:flex flex-col justify-between w-1/2 bg-slate-900 p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1000&auto=format&fit=crop')] bg-cover opacity-20" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-900/50 to-slate-900" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-emerald-400 mb-6">
            <div className="w-10 h-10 bg-emerald-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-emerald-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Ilmia One</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Modern Living,<br />Simplified.
          </h1>
          <p className="text-slate-400 text-lg">
            Manage your bills, visitors, and community connection all in one place.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {['Secure Payment Gateway', 'Instant Visitor Passes', 'Community Updates'].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-slate-300">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="relative z-10 text-xs text-slate-500 mt-12">
          © 2026 Ilmia One Management. All rights reserved.
        </div>
      </div>

      {/* Right Side — Form */}
      <div className="flex-1 flex flex-col justify-center p-8 md:p-12">
        <div className="max-w-sm mx-auto w-full">
          {mode !== 'forgot' && (
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {mode === 'register' ? 'Create an Account' : 'Welcome Back'}
              </h2>
              <p className="text-slate-500 text-sm">
                {mode === 'register'
                  ? 'Join your community today.'
                  : 'Enter your credentials to access your account.'}
              </p>
            </div>
          )}

          {mode === 'login' && <LoginForm onForgotPassword={() => setMode('forgot')} />}
          {mode === 'register' && <RegisterForm />}
          {mode === 'forgot' && <ForgotPasswordPanel onBack={() => setMode('login')} />}

          {mode !== 'forgot' && (
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500">
                {mode === 'register' ? 'Already have an account?' : "Don't have an account?"}
                <button
                  onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
                  className="ml-1 font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                  type="button"
                >
                  {mode === 'register' ? 'Sign In' : 'Register Now'}
                </button>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
