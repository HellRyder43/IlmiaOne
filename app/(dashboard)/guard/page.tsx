'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import {
  QrCode, FileText, Users, AlertTriangle, ShieldCheck,
  Truck, Car, UserPlus, Loader2, Hammer, Bike, HelpCircle, User,
  Search, ChevronDown,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useGuardStats } from '@/hooks/use-visitor-logs'
import type { VisitorType } from '@/lib/types'

const walkInSchema = z.object({
  visitorName: z.string().min(1, 'Visitor name is required'),
  icNumber: z.string().max(4, 'Last 4 digits only').optional(),
  visitorType: z.enum(['VISITOR', 'CONTRACTOR', 'E_HAILING', 'COURIER', 'OTHERS']),
  visitReason: z.string().min(1, 'Reason for visit is required'),
  houseNumber: z.string().min(1, 'House number is required'),
  vehicleNumber: z.string().optional(),
  phoneNumber: z.string().optional(),
})

type WalkInFormData = z.infer<typeof walkInSchema>

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

export default function GuardDashboard() {
  const { stats, isLoading: statsLoading, refresh } = useGuardStats()
  const [isWalkInOpen, setIsWalkInOpen] = useState(false)
  const [houses, setHouses] = useState<HouseOption[]>([])
  const [houseOpen, setHouseOpen] = useState(false)
  const [houseSearch, setHouseSearch] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, setValue, watch, reset, control, formState: { errors } } = useForm<WalkInFormData>({
    resolver: zodResolver(walkInSchema),
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
      .catch(() => {})
  }, [])

  const onSubmitWalkIn = async (data: WalkInFormData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/guard/walk-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Failed to log entry')
      }
      toast.success(`Walk-in entry logged for ${data.visitorName}`)
      reset()
      setIsWalkInOpen(false)
      refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to log entry')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Guard Station Dashboard</h2>
          <p className="text-slate-500 mt-1">Main Gate · {new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-semibold">System Online</span>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2 text-slate-500">
              <Users className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Visitors Inside</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {statsLoading ? <span className="text-slate-300">—</span> : stats.visitorsInside}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2 text-slate-500">
              <Truck className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Deliveries</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {statsLoading ? <span className="text-slate-300">—</span> : stats.deliveriesToday}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2 text-slate-500">
              <Car className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Total Entries</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {statsLoading ? <span className="text-slate-300">—</span> : stats.totalEntriesToday}
            </p>
          </CardContent>
        </Card>
        <Card className={cn('shadow-sm', stats.overstayedVisitors > 0 ? 'border-red-100 bg-red-50/50' : 'border-slate-200')}>
          <CardContent className="p-6">
            <div className={cn('flex items-center gap-3 mb-2', stats.overstayedVisitors > 0 ? 'text-red-600' : 'text-slate-500')}>
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Overstayed</span>
            </div>
            <p className={cn('text-3xl font-bold', stats.overstayedVisitors > 0 ? 'text-red-700' : 'text-slate-900')}>
              {statsLoading ? <span className="text-slate-300">—</span> : stats.overstayedVisitors}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Quick Actions</h3>
          <div className="space-y-3">
            <button onClick={() => setIsWalkInOpen(true)} className="w-full text-left">
              <Card className="hover:shadow-md transition-shadow hover:border-amber-200 group cursor-pointer border-slate-200">
                <CardContent className="p-6 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                    <UserPlus className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 group-hover:text-amber-700 transition-colors">Register Walk-In</h4>
                    <p className="text-slate-500 mt-1">Log a visitor manually without a QR pass.</p>
                  </div>
                </CardContent>
              </Card>
            </button>

            <Link href="/guard/scanner" className="block">
              <Card className="hover:shadow-md transition-shadow hover:border-emerald-200 group cursor-pointer border-slate-200">
                <CardContent className="p-6 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Scan QR Pass</h4>
                    <p className="text-slate-500 mt-1">Verify a pre-registered visitor&apos;s QR code.</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/guard/logs" className="block">
              <Card className="hover:shadow-md transition-shadow hover:border-indigo-200 group cursor-pointer border-slate-200">
                <CardContent className="p-6 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">View Entry Logs</h4>
                    <p className="text-slate-500 mt-1">Check history and check-out visitors.</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Notices */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Important Notices</h3>
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                <div className="p-4 flex gap-4 hover:bg-slate-50">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Self-Service Entries</p>
                    <p className="text-slate-600 text-sm mt-1">
                      Review unverified self-service entries in the Entry Logs when you return from patrol.
                    </p>
                  </div>
                </div>
                <div className="p-4 flex gap-4 hover:bg-slate-50">
                  <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Neighbourhood Security</p>
                    <p className="text-slate-600 text-sm mt-1">
                      Deny access to visitors without a valid QR pass or walk-in registration.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Walk-In Dialog */}
      <Dialog open={isWalkInOpen} onOpenChange={setIsWalkInOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register Walk-In Visitor</DialogTitle>
            <DialogDescription>
              Fill in the visitor details to log their entry.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmitWalkIn)} className="space-y-4 mt-2">
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

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Phone Number</label>
              <input
                {...register('phoneNumber')}
                type="tel"
                placeholder="e.g. 0123456789"
                className="w-full h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => { reset(); setIsWalkInOpen(false) }}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white">
                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logging...</> : 'Log Entry'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
