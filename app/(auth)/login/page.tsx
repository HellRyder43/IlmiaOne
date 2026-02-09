'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Building2, Mail, Lock, User, Home, CreditCard, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    houseNumber: '',
    icNumber: ''
  })

  const { login, register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted', { email: formData.email, isRegister })
    setIsLoading(true)
    setError(null)

    try {
      if (isRegister) {
        console.log('Attempting registration...')
        await register({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          houseNumber: formData.houseNumber,
          icNumber: formData.icNumber
        })
      } else {
        console.log('Attempting login...')
        await login({
          email: formData.email,
          password: formData.password
        })
      }
      console.log('Authentication successful')
      // Redirect is handled in auth.tsx
    } catch (err) {
      console.error('Authentication error:', err)
      setIsLoading(false)
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row h-auto md:h-[700px]">

        {/* Left Side - Visual / Branding */}
        <div className="hidden md:flex flex-col justify-between w-1/2 bg-slate-900 p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1000&auto=format&fit=crop')] bg-cover opacity-20"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-900/50 to-slate-900"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 text-emerald-400 mb-6">
              <div className="w-10 h-10 bg-emerald-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-emerald-500/30">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold tracking-tight">Ilmia One</span>
            </div>
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Modern Living,<br/>Simplified.
            </h1>
            <p className="text-slate-400 text-lg">
              Manage your bills, visitors, and community connection all in one place.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3 text-sm text-slate-300">
               <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                 <CheckCircle2 className="w-4 h-4 text-emerald-400" />
               </div>
               <span>Secure Payment Gateway</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
               <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                 <CheckCircle2 className="w-4 h-4 text-emerald-400" />
               </div>
               <span>Instant Visitor Passes</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
               <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                 <CheckCircle2 className="w-4 h-4 text-emerald-400" />
               </div>
               <span>Community Updates</span>
            </div>
          </div>

          <div className="relative z-10 text-xs text-slate-500 mt-12">
            © 2026 Ilmia One Management. All rights reserved.
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex flex-col justify-center p-8 md:p-12 relative">
          <div className="max-w-sm mx-auto w-full">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {isRegister ? 'Create an Account' : 'Welcome Back'}
              </h2>
              <p className="text-slate-500 text-sm">
                {isRegister
                  ? 'Join your community today.'
                  : 'Enter your credentials to access your account.'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      name="fullName"
                      required
                      type="text"
                      placeholder="Full Name"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm shadow-sm"
                      value={formData.fullName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Home className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <input
                        name="houseNumber"
                        required
                        type="text"
                        placeholder="House No."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm shadow-sm"
                        value={formData.houseNumber}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <input
                        name="icNumber"
                        required
                        type="text"
                        placeholder="IC Number"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm shadow-sm"
                        value={formData.icNumber}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    name="email"
                    required
                    type="email"
                    placeholder="Email Address"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm shadow-sm"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    name="password"
                    required
                    type="password"
                    placeholder="Password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm shadow-sm"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {!isRegister && (
                 <div className="flex justify-end">
                   <button type="button" className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
                     Forgot Password?
                   </button>
                 </div>
              )}

              <Button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11 text-base font-medium shadow-lg shadow-slate-900/10"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isRegister ? 'Creating Account...' : 'Signing In...'}
                  </>
                ) : (
                  <>
                    {isRegister ? 'Create Account' : 'Sign In'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500">
                {isRegister ? "Already have an account?" : "Don't have an account?"}
                <button
                  onClick={() => {
                    setIsRegister(!isRegister)
                    setError(null)
                  }}
                  className="ml-1 font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                  type="button"
                >
                  {isRegister ? 'Sign In' : 'Register Now'}
                </button>
              </p>
            </div>

            {!isRegister && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-semibold text-blue-900 mb-2">Demo Credentials:</p>
                <div className="text-xs text-blue-700 space-y-1">
                  <div><strong>Resident:</strong> resident@ilmiaone.com / resident123</div>
                  <div><strong>Treasurer:</strong> treasurer@ilmiaone.com / treasurer123</div>
                  <div><strong>Guard:</strong> guard@ilmiaone.com / guard123</div>
                  <div><strong>Admin:</strong> admin@ilmiaone.com / admin123</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  )
}
