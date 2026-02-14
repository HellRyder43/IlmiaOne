'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Search, Download, ArrowUpRight, ArrowDownRight, Car, User, Truck,
  Calendar, Hammer, Bike, HelpCircle, Smartphone, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useVisitorLogs } from '@/hooks/use-visitor-logs'
import { format } from 'date-fns'
import type { VisitorType } from '@/lib/types'

type FilterStatus = 'ALL' | 'INSIDE'

const TYPE_ICON: Record<VisitorType, React.ElementType> = {
  VISITOR: User,
  CONTRACTOR: Hammer,
  E_HAILING: Bike,
  COURIER: Truck,
  OTHERS: HelpCircle,
}

const TYPE_LABEL: Record<VisitorType, string> = {
  VISITOR: 'Visitor',
  CONTRACTOR: 'Contractor',
  E_HAILING: 'E-Hailing',
  COURIER: 'Courier',
  OTHERS: 'Others',
}

const ENTRY_METHOD_BADGE: Record<string, { label: string; className: string }> = {
  QR_SCAN: { label: 'QR Scan', className: 'bg-emerald-100 text-emerald-700 border-transparent' },
  WALK_IN: { label: 'Walk-In', className: 'bg-blue-100 text-blue-700 border-transparent' },
  MANUAL: { label: 'Manual', className: 'bg-slate-100 text-slate-600 border-transparent' },
  SELF_SERVICE: { label: 'Self-Service', className: 'bg-amber-100 text-amber-700 border-transparent' },
}

export default function EntryLogsPage() {
  const [filter, setFilter] = useState<FilterStatus>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [checkingOut, setCheckingOut] = useState<string | null>(null)

  const { logs, isLoading, fetchLogs, checkOut } = useVisitorLogs()

  useEffect(() => {
    fetchLogs({ status: filter, search: searchTerm })
  }, [filter, searchTerm, fetchLogs])

  const handleCheckOut = async (id: string, visitorName: string) => {
    setCheckingOut(id)
    try {
      await checkOut(id)
      toast.success(`${visitorName} checked out`)
    } catch {
      toast.error('Failed to check out visitor')
    } finally {
      setCheckingOut(null)
    }
  }

  const formatTime = (isoString: string) =>
    format(new Date(isoString), 'h:mm a')

  const formatDate = (isoString: string) => {
    const d = new Date(isoString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return format(d, 'dd MMM')
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Entry Logs</h2>
          <p className="text-slate-500 mt-1">Audit trail of all visitor movements (last 90 days).</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-white" disabled>
            <Calendar className="w-4 h-4" /> Date Range
          </Button>
          <Button variant="outline" className="gap-2 bg-white" disabled>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Filter Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg self-start">
            <button
              onClick={() => setFilter('ALL')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all',
                filter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              All Entries
            </button>
            <button
              onClick={() => setFilter('INSIDE')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all',
                filter === 'INSIDE' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-emerald-700',
              )}
            >
              Currently Inside
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, house no., or plate..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm shadow-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading logs…</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="font-medium">No records found.</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <>
            {/* ── Desktop table (md+) ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Visitor Details</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">House No.</th>
                    <th className="px-6 py-4">Entry Method</th>
                    <th className="px-6 py-4">Time In</th>
                    <th className="px-6 py-4">Time Out</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {logs.map(log => {
                    const TypeIcon = TYPE_ICON[log.visitorType as VisitorType] ?? User
                    const methodBadge = ENTRY_METHOD_BADGE[log.entryMethod] ?? ENTRY_METHOD_BADGE.MANUAL
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          {log.status === 'INSIDE' ? (
                            <Badge variant="default" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-transparent">Inside</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-500">Exited</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{log.visitorName}</p>
                          {log.vehicleNumber && (
                            <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                              <Car className="w-3 h-3" /> {log.vehicleNumber}
                            </p>
                          )}
                          {log.phoneNumber && (
                            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                              <Smartphone className="w-3 h-3" /> {log.phoneNumber}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-md bg-slate-100 text-slate-600">
                              <TypeIcon className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-xs font-medium text-slate-600">
                              {TYPE_LABEL[log.visitorType as VisitorType] ?? log.visitorType}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">No. {log.houseNumber}</td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={cn('text-[10px]', methodBadge.className)}>
                            {methodBadge.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-emerald-600 font-medium">
                          <div className="flex items-center gap-1.5">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            <div>
                              <p>{formatTime(log.checkInTime)}</p>
                              <p className="text-xs text-slate-400">{formatDate(log.checkInTime)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {log.checkOutTime ? (
                            <div className="flex items-center gap-1.5">
                              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                              <div>
                                <p>{formatTime(log.checkOutTime)}</p>
                                <p className="text-xs text-slate-400">{formatDate(log.checkOutTime)}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {log.status === 'INSIDE' && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={checkingOut === log.id}
                              className="h-8 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                              onClick={() => handleCheckOut(log.id, log.visitorName)}
                            >
                              {checkingOut === log.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : 'Check Out'
                              }
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards (< md) ── */}
            <div className="md:hidden divide-y divide-slate-100">
              {logs.map(log => {
                const TypeIcon = TYPE_ICON[log.visitorType as VisitorType] ?? User
                const methodBadge = ENTRY_METHOD_BADGE[log.entryMethod] ?? ENTRY_METHOD_BADGE.MANUAL
                const isInside = log.status === 'INSIDE'
                return (
                  <div key={log.id} className="p-4 space-y-3">
                    {/* Top row: name + status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{log.visitorName}</p>
                        <p className="text-sm text-slate-500 mt-0.5">No. {log.houseNumber}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {isInside ? (
                          <Badge variant="default" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-transparent">Inside</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-500">Exited</Badge>
                        )}
                      </div>
                    </div>

                    {/* Type + method badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-slate-100 rounded-md px-2 py-1">
                        <TypeIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs font-medium text-slate-600">
                          {TYPE_LABEL[log.visitorType as VisitorType] ?? log.visitorType}
                        </span>
                      </div>
                      <Badge variant="outline" className={cn('text-[10px]', methodBadge.className)}>
                        {methodBadge.label}
                      </Badge>
                    </div>

                    {/* Vehicle / phone */}
                    {(log.vehicleNumber || log.phoneNumber) && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {log.vehicleNumber && (
                          <p className="text-xs text-slate-500 font-mono flex items-center gap-1">
                            <Car className="w-3 h-3" /> {log.vehicleNumber}
                          </p>
                        )}
                        {log.phoneNumber && (
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Smartphone className="w-3 h-3" /> {log.phoneNumber}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Times + action */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1 text-emerald-600 font-medium">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          <span>{formatTime(log.checkInTime)}</span>
                          <span className="text-slate-400 font-normal">{formatDate(log.checkInTime)}</span>
                        </div>
                        {log.checkOutTime ? (
                          <div className="flex items-center gap-1 text-slate-500">
                            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatTime(log.checkOutTime)}</span>
                            <span className="text-slate-400">{formatDate(log.checkOutTime)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">No checkout</span>
                        )}
                      </div>

                      {isInside && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={checkingOut === log.id}
                          className="h-8 shrink-0 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                          onClick={() => handleCheckOut(log.id, log.visitorName)}
                        >
                          {checkingOut === log.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : 'Check Out'
                          }
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
