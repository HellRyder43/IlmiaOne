'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowRight,
  Wallet,
  QrCode,
  Calendar,
  CheckCircle2,
  Scan,
  Download,
  AlertTriangle,
  Info,
  Home,
  ChevronDown,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import type { Invoice } from '@/lib/types'

// Mock data for Dashboard view only
const dashboardInvoices: Invoice[] = [
  { id: 'INV-2023-12', houseId: '', month: 'December 2023', amount: 145.50, status: 'PENDING', dueDate: '2023-12-31', breakdown: { maintenance: 130.00, sinkingFund: 13.00, water: 2.50 } },
  { id: 'INV-2023-11', houseId: '', month: 'November 2023', amount: 143.00, status: 'PAID', dueDate: '2023-11-30', breakdown: { maintenance: 130.00, sinkingFund: 13.00 } },
  { id: 'INV-2023-10', houseId: '', month: 'October 2023', amount: 143.00, status: 'PAID', dueDate: '2023-10-31', breakdown: { maintenance: 130.00, sinkingFund: 13.00 } },
]

const resubmitSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  houseNumber: z.string().min(1, 'House number is required'),
  icNumber: z.string().min(4, 'IC number is required'),
  residentType: z.enum(['OWNER', 'TENANT']),
})

type ResubmitFormData = z.infer<typeof resubmitSchema>
type HouseOption = { id: string; house_number: string; street: string | null }

function ResubmitDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: { name: string; houseNumber?: string; icNumber?: string; residentType?: string }
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [housesData, setHousesData] = useState<HouseOption[]>([])
  const [houseOpen, setHouseOpen] = useState(false)
  const [houseSearch, setHouseSearch] = useState('')

  useEffect(() => {
    fetch('/api/houses').then(r => r.json()).then(setHousesData)
  }, [])

  const form = useForm<ResubmitFormData>({
    resolver: zodResolver(resubmitSchema),
    defaultValues: {
      fullName: user.name ?? '',
      houseNumber: user.houseNumber ?? '',
      icNumber: user.icNumber ?? '',
      residentType: (user.residentType as 'OWNER' | 'TENANT') ?? 'OWNER',
    },
  })

  const onSubmit = async (data: ResubmitFormData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth/resubmit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: data.fullName,
          houseNumber: data.houseNumber,
          icNumber: data.icNumber,
          residentType: data.residentType,
        }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Resubmission failed')
      }
      toast.success('Resubmission sent! The committee will review your application.')
      onOpenChange(false)
      // Reload to reflect new status
      window.location.reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit & Resubmit Registration</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-500 -mt-2">Review your details and resubmit for approval.</p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* House number searchable dropdown */}
            <div>
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                House Number
              </label>
              <div className="mt-2">
                <Controller
                  control={form.control}
                  name="houseNumber"
                  render={({ field, fieldState }) => {
                    const selected = housesData.find(h => h.house_number === field.value)
                    const filtered = housesData.filter(h => {
                      const q = houseSearch.toLowerCase()
                      return h.house_number.toLowerCase().includes(q) || (h.street ?? '').toLowerCase().includes(q)
                    })
                    return (
                      <>
                        <Popover open={houseOpen} onOpenChange={setHouseOpen}>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className={cn(
                                'relative w-full flex items-center gap-2 pl-10 pr-4 py-2.5 rounded-lg border bg-white text-left text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all',
                                fieldState.error ? 'border-red-400' : 'border-slate-300'
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
                              {filtered.length === 0 ? (
                                <p className="px-3 py-4 text-xs text-slate-400 text-center">No houses found</p>
                              ) : (
                                filtered.map(h => (
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
                                      field.value === h.house_number && 'bg-indigo-50 text-indigo-700'
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
                        {fieldState.error && (
                          <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>
                        )}
                      </>
                    )
                  }}
                />
              </div>
            </div>
            <FormField
              control={form.control}
              name="icNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IC Number (last 4 digits)</FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="residentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resident Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="OWNER">Owner</SelectItem>
                      <SelectItem value="TENANT">Tenant</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting…' : 'Resubmit'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default function ResidentDashboard() {
  const { user } = useAuth()
  const [resubmitOpen, setResubmitOpen] = useState(false)

  // Rejected users only see the rejection banner — nothing else
  if (user?.status === 'REJECTED') {
    return (
      <>
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800 font-semibold">Registration Not Approved</AlertTitle>
          <AlertDescription className="mt-1">
            <p className="text-red-700 text-sm mb-3">
              {user.rejectionReason
                ? `Reason: ${user.rejectionReason}`
                : 'Your registration was not approved by the committee.'}
            </p>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => setResubmitOpen(true)}
            >
              Edit &amp; Resubmit
            </Button>
          </AlertDescription>
        </Alert>
        <ResubmitDialog open={resubmitOpen} onOpenChange={setResubmitOpen} user={user} />
      </>
    )
  }

  return (
    <div className="space-y-8">
      {user?.status === 'PENDING_APPROVAL' && (
        <Alert className="border-amber-200 bg-amber-50">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 font-semibold">Registration Pending</AlertTitle>
          <AlertDescription className="text-amber-700 text-sm">
            Your registration is pending approval by the committee. You will be notified once it is reviewed.
          </AlertDescription>
        </Alert>
      )}

      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, {user?.name?.split(' ')[0] ?? 'Resident'} 👋
        </h1>
        <p className="text-slate-500 mt-2">Here&apos;s what&apos;s happening in your neighbourhood today.</p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/resident/billing" className="group">
           <Card className="h-full hover:shadow-md transition-shadow">
             <CardContent className="pt-6">
               <div className="w-12 h-12 bg-indigo-100 rounded-lg shadow-sm flex items-center justify-center mb-4 text-indigo-600 group-hover:scale-110 transition-transform">
                 <Wallet className="w-6 h-6" />
               </div>
               <h3 className="font-semibold text-slate-900">Pay Maintenance</h3>
               <p className="text-sm text-slate-500 mt-1 mb-4">You have 1 pending invoice due soon.</p>
               <div className="flex items-center text-indigo-600 text-sm font-medium">
                 View Invoices <ArrowRight className="w-4 h-4 ml-1" />
               </div>
             </CardContent>
           </Card>
        </Link>

        <Link href="/resident/visitors" className="group">
           <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
             <CardContent className="pt-6">
               <div className="w-12 h-12 bg-indigo-100 rounded-lg shadow-sm flex items-center justify-center mb-4 text-indigo-600 group-hover:scale-110 transition-transform">
                 <QrCode className="w-6 h-6" />
               </div>
               <h3 className="font-semibold text-slate-900">Invite Visitor</h3>
               <p className="text-sm text-slate-500 mt-1 mb-4">Create a QR pass for guests or deliveries.</p>
               <div className="flex items-center text-indigo-600 text-sm font-medium">
                 Create Pass <ArrowRight className="w-4 h-4 ml-1" />
               </div>
             </CardContent>
           </Card>
        </Link>

        <Card className="h-full">
           <CardContent className="pt-6">
             <div className="w-12 h-12 bg-emerald-100 rounded-lg shadow-sm flex items-center justify-center mb-4 text-emerald-600">
               <Calendar className="w-6 h-6" />
             </div>
             <h3 className="font-semibold text-slate-900">Community Event</h3>
             <p className="text-sm text-slate-500 mt-1 mb-4">&quot;Gotong Royong&quot; cleanup this Saturday!</p>
             <div className="text-xs text-slate-400">Oct 28, 2023 • 9:00 AM</div>
           </CardContent>
        </Card>
      </div>

      {/* Simplified Invoice Table for Dashboard Overview */}
      <Card className="overflow-hidden border border-slate-200 shadow-sm bg-white">
        <CardHeader className="border-b border-slate-100 px-6 py-5 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold text-slate-900">Latest Invoices</CardTitle>
          <Link href="/resident/billing" className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold transition-colors">
            View All Billing
          </Link>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-xs uppercase font-semibold text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-4">Month</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dashboardInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{invoice.month}</td>
                  <td className="px-6 py-4 text-slate-600">RM {invoice.amount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        invoice.status === 'PAID'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {invoice.status === 'PAID' ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {invoice.status === 'PAID' ? (
                      <button className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors ml-auto">
                        <Download className="w-3.5 h-3.5" />
                        Receipt
                      </button>
                    ) : (
                      <Link href="/resident/billing">
                        <Button
                          size="sm"
                          className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 shadow-sm border-transparent"
                        >
                           Pay Now
                        </Button>
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Activity Section */}
      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 px-6 py-5 space-y-0">
           <CardTitle className="text-lg font-bold text-slate-900">Recent Activity</CardTitle>
           <Link href="/resident/activity" className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold transition-colors">
             View All
           </Link>
        </CardHeader>
        <CardContent className="p-0">
           <div className="divide-y divide-slate-100">
             <div className="flex items-center p-6 hover:bg-slate-50/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                   <Scan className="w-5 h-5" />
                </div>
                <div className="ml-4 flex-1">
                   <p className="text-sm font-medium text-slate-900">Visitor Arrived</p>
                   <p className="text-xs text-slate-500 mt-0.5">GrabFood Driver (Ali)</p>
                </div>
                <span className="text-xs text-slate-400 font-medium">10 mins ago</span>
             </div>

             <div className="flex items-center p-6 hover:bg-slate-50/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                   <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="ml-4 flex-1">
                   <p className="text-sm font-medium text-slate-900">Payment Success</p>
                   <p className="text-xs text-slate-500 mt-0.5">January Maintenance Fees</p>
                </div>
                <span className="text-xs text-slate-400 font-medium">2 days ago</span>
             </div>

             <div className="flex items-center p-6 hover:bg-slate-50/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                   <Calendar className="w-5 h-5" />
                </div>
                <div className="ml-4 flex-1">
                   <p className="text-sm font-medium text-slate-900">Visitor Registered</p>
                   <p className="text-xs text-slate-500 mt-0.5">Sarah (Sister)</p>
                </div>
                <span className="text-xs text-slate-400 font-medium">3 days ago</span>
             </div>
           </div>
        </CardContent>
      </Card>

    </div>
  )
}
