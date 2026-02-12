'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ShieldCheck, User, Phone, MapPin, FileText, Car, CheckCircle2, Loader2, Truck, Hammer, Bike, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { VisitorType } from '@/lib/types'

const schema = z.object({
  visitorName: z.string().min(1, 'Visitor name is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  visitorType: z.enum(['VISITOR', 'CONTRACTOR', 'E_HAILING', 'COURIER', 'OTHERS']),
  houseNumber: z.string().min(1, 'House number is required'),
  visitReason: z.string().min(1, 'Reason is required'),
  vehicleNumber: z.string().optional(),
  icNumber: z.string().max(4, 'Enter last 4 digits only').optional(),
})

type FormData = z.infer<typeof schema>

interface HouseOption {
  id: string
  house_number: string
}

const VISITOR_TYPES: { value: VisitorType; label: string; Icon: React.ElementType }[] = [
  { value: 'VISITOR', label: 'Visitor', Icon: User },
  { value: 'CONTRACTOR', label: 'Contractor', Icon: Hammer },
  { value: 'E_HAILING', label: 'E-Hailing', Icon: Bike },
  { value: 'COURIER', label: 'Courier', Icon: Truck },
  { value: 'OTHERS', label: 'Others', Icon: HelpCircle },
]

export default function SelfRegisterPage() {
  const [houses, setHouses] = useState<HouseOption[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { visitorType: 'VISITOR' },
  })

  const selectedType = watch('visitorType')

  useEffect(() => {
    fetch('/api/houses')
      .then(r => r.json())
      .then(setHouses)
      .catch(() => { /* fail silently, user can type house number */ })
  }, [])

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/visitor/self-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Submission failed')
      }
      setSubmitted(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Entry Registered</h1>
          <p className="text-slate-500">
            Your visit has been recorded. The guard will be notified. You may proceed to your destination.
          </p>
          <div className="pt-2">
            <p className="text-xs text-slate-400">
              Ilmia One · Visitor Management System
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">Ilmia One</p>
            <p className="text-xs text-slate-500">Visitor Self-Registration</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-6 pb-16">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Register Your Visit</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Please fill in your details before entering the neighbourhood.
          </p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

              {/* Visitor Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    {...register('visitorName')}
                    placeholder="e.g. Ahmad bin Razak"
                    className="w-full pl-9 pr-4 h-11 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
                {errors.visitorName && (
                  <p className="text-xs text-red-500">{errors.visitorName.message}</p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    {...register('phoneNumber')}
                    type="tel"
                    placeholder="e.g. 0123456789"
                    className="w-full pl-9 pr-4 h-11 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="text-xs text-red-500">{errors.phoneNumber.message}</p>
                )}
              </div>

              {/* Visitor Type */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Visit Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {VISITOR_TYPES.map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setValue('visitorType', value)}
                      className={cn(
                        'flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-medium transition-all',
                        selectedType === value
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px] leading-tight text-center">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* House Number */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  House Number Visiting <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  {houses.length > 0 ? (
                    <select
                      {...register('houseNumber')}
                      className="w-full pl-9 pr-4 h-11 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none"
                    >
                      <option value="">Select house number</option>
                      {houses.map(h => (
                        <option key={h.id} value={h.house_number}>
                          No. {h.house_number}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      {...register('houseNumber')}
                      placeholder="e.g. 12"
                      className="w-full pl-9 pr-4 h-11 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    />
                  )}
                </div>
                {errors.houseNumber && (
                  <p className="text-xs text-red-500">{errors.houseNumber.message}</p>
                )}
              </div>

              {/* Reason for Visit */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Reason for Visit <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    {...register('visitReason')}
                    placeholder="e.g. Family visit, parcel delivery"
                    className="w-full pl-9 pr-4 h-11 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
                {errors.visitReason && (
                  <p className="text-xs text-red-500">{errors.visitReason.message}</p>
                )}
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Vehicle No. <span className="text-slate-400 font-normal">(optional)</span></label>
                  <div className="relative">
                    <Car className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      {...register('vehicleNumber')}
                      placeholder="e.g. WXX 1234"
                      className="w-full pl-9 pr-4 h-11 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all uppercase"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">IC No. (last 4) <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input
                    {...register('icNumber')}
                    placeholder="e.g. 1234"
                    maxLength={4}
                    className="w-full px-4 h-11 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono"
                  />
                  {errors.icNumber && (
                    <p className="text-xs text-red-500">{errors.icNumber.message}</p>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs text-slate-400 mb-4">
                  By submitting, you consent to your visit details being recorded as required under the neighbourhood&apos;s security policy.
                </p>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 text-base font-semibold bg-indigo-600 hover:bg-indigo-700"
                >
                  {isSubmitting
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                    : 'Register Visit'
                  }
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
