'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { ShieldCheck, CheckCircle2, Loader2, Truck, Hammer, Bike, HelpCircle, User, Search, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import type { VisitorType } from '@/lib/types'

const schema = z.object({
  visitorName: z.string().min(1, 'Visitor name is required'),
  visitorType: z.enum(['VISITOR', 'CONTRACTOR', 'E_HAILING', 'COURIER', 'OTHERS']),
  houseNumber: z.string().min(1, 'House number is required'),
  visitReason: z.string().min(1, 'Reason for visit is required'),
  icNumber: z.string().max(4, 'Last 4 digits only').optional(),
  vehicleNumber: z.string().optional(),
  phoneNumber: z.string().min(1, 'Phone number is required'),
})

type FormData = z.infer<typeof schema>

interface HouseOption {
  id: string
  house_number: string
  street: string | null
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
  const [houseOpen, setHouseOpen] = useState(false)
  const [houseSearch, setHouseSearch] = useState('')

  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { visitorType: 'VISITOR' },
  })

  const selectedType = watch('visitorType')

  const filteredHouses = houses.filter(h => {
    const q = houseSearch.toLowerCase()
    return h.house_number.toLowerCase().includes(q) || (h.street ?? '').toLowerCase().includes(q)
  })

  useEffect(() => {
    fetch('/api/houses')
      .then(r => r.json())
      .then(setHouses)
      .catch(() => { /* fail silently */ })
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* Visitor Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Visitor Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('visitorName')}
                  placeholder="e.g. Ahmad bin Razak"
                  className="w-full h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
                {errors.visitorName && <p className="text-xs text-red-500">{errors.visitorName.message}</p>}
              </div>

              {/* Visitor Type */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Visitor Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {VISITOR_TYPES.map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setValue('visitorType', value)}
                      className={cn(
                        'flex flex-col items-center gap-1 py-2 rounded-lg border text-xs font-medium transition-all',
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
                  House Number <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="houseNumber"
                  control={control}
                  render={({ field }) => {
                    const selected = houses.find(h => h.house_number === field.value)
                    return (
                      <Popover open={houseOpen} onOpenChange={setHouseOpen} modal={false}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              'w-full flex items-center gap-2 px-3 h-11 rounded-lg border bg-white text-left text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all',
                              errors.houseNumber ? 'border-red-400' : 'border-slate-300',
                            )}
                          >
                            {selected ? (
                              <span className="text-slate-900 flex-1">
                                No. {selected.house_number}
                                {selected.street && <span className="text-slate-400"> · {selected.street}</span>}
                              </span>
                            ) : (
                              <span className="text-slate-400 flex-1">Select house</span>
                            )}
                            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <div className="flex items-center border-b border-slate-200 px-3">
                            <Search className="w-4 h-4 text-slate-400 shrink-0" />
                            <input
                              className="flex-1 py-2 pl-2 text-sm bg-transparent outline-none placeholder:text-slate-400"
                              placeholder="Search house number..."
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
                                    field.value === h.house_number && 'bg-indigo-50 text-indigo-700',
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
                {errors.houseNumber && <p className="text-xs text-red-500">{errors.houseNumber.message}</p>}
              </div>

              {/* Reason for Visit */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Reason for Visit <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('visitReason')}
                  placeholder="e.g. Social visit, maintenance work"
                  className="w-full h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
                {errors.visitReason && <p className="text-xs text-red-500">{errors.visitReason.message}</p>}
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">IC No. (last 4)</label>
                  <input
                    {...register('icNumber')}
                    placeholder="1234"
                    maxLength={4}
                    className="w-full h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono"
                  />
                  {errors.icNumber && <p className="text-xs text-red-500">{errors.icNumber.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Vehicle No.</label>
                  <input
                    {...register('vehicleNumber')}
                    placeholder="WXX 1234"
                    className="w-full h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all uppercase"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('phoneNumber')}
                  type="tel"
                  placeholder="e.g. 0123456789"
                  className="w-full h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
                {errors.phoneNumber && <p className="text-xs text-red-500">{errors.phoneNumber.message}</p>}
              </div>

              <div className="pt-2">
                <p className="text-xs text-slate-400 mb-4">
                  By submitting, you consent to your visit details being recorded as required under the neighbourhood&apos;s security policy.
                </p>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 text-base font-semibold bg-slate-900 hover:bg-slate-800 text-white"
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
