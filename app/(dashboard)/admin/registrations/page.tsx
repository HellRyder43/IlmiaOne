'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  CheckCircle2,
  XCircle,
  UserCheck,
  Clock,
  Eye,
  Mail,
  Hash,
  User,
  Home,
  Users,
  ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow, format } from 'date-fns'

interface PendingResident {
  id: string
  full_name: string
  email: string
  ic_number: string | null
  resident_type: string | null
  rejection_reason: string | null
  house_id: string | null
  created_at: string
  updated_at: string
  houses: { house_number: string; street: string | null; occupancy_status: string } | null
}

export default function RegistrationsPage() {
  const [residents, setResidents] = useState<PendingResident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [detailTarget, setDetailTarget] = useState<PendingResident | null>(null)
  const [coResidents, setCoResidents] = useState<{ full_name: string; email: string }[]>([])
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  const fetchPending = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, ic_number, resident_type, rejection_reason, house_id, created_at, updated_at, houses(house_number, street, occupancy_status)')
      .eq('status', 'PENDING_APPROVAL')
      .order('created_at', { ascending: true })

    setResidents((data as PendingResident[]) ?? [])
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchPending()
  }, [fetchPending])

  const openDetail = async (resident: PendingResident) => {
    setDetailTarget(resident)
    setShowRejectForm(false)
    setRejectReason('')
    setCoResidents([])

    if (resident.house_id) {
      setIsLoadingDetails(true)
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('house_id', resident.house_id)
        .eq('status', 'APPROVED')
        .eq('role', 'RESIDENT')
        .neq('id', resident.id)
      setCoResidents((data as { full_name: string; email: string }[]) ?? [])
      setIsLoadingDetails(false)
    }
  }

  const closeDetail = () => {
    setDetailTarget(null)
    setCoResidents([])
    setShowRejectForm(false)
    setRejectReason('')
  }

  const handleApprove = async (resident: PendingResident) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/residents/${resident.id}/approve`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Approval failed')
      }
      setResidents(prev => prev.filter(r => r.id !== resident.id))
      toast.success(`${resident.full_name} has been approved.`)
      closeDetail()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRejectSubmit = async () => {
    if (!detailTarget) return
    if (rejectReason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters.')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/residents/${detailTarget.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Rejection failed')
      }
      setResidents(prev => prev.filter(r => r.id !== detailTarget.id))
      toast.success(`${detailTarget.full_name}'s registration was rejected.`)
      closeDetail()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  function OccupancyBadge({ status }: { status: string }) {
    if (status === 'OCCUPIED') return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs font-medium">Occupied</Badge>
    if (status === 'VACANT') return <Badge className="bg-slate-100 text-slate-600 border-0 text-xs font-medium">Vacant</Badge>
    return <Badge className="bg-amber-100 text-amber-700 border-0 text-xs font-medium">Under Renovation</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Resident Registrations</h1>
        <p className="text-slate-500 mt-1">Review and approve or reject pending resident applications.</p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Pending Approval</CardTitle>
              <CardDescription className="mt-1">
                {isLoading ? 'Loading…' : `${residents.length} application${residents.length !== 1 ? 's' : ''} waiting for review`}
              </CardDescription>
            </div>
            {residents.length > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-0">
                {residents.length} pending
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading registrations…</div>
          ) : residents.length === 0 ? (
            <div className="py-16 text-center">
              <UserCheck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="font-medium text-slate-500">No pending registrations</p>
              <p className="text-sm text-slate-400 mt-1">All applications have been reviewed.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {residents.map(resident => (
                <div key={resident.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                    {resident.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900">{resident.full_name}</p>
                      {resident.resident_type && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {resident.resident_type.toLowerCase()}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{resident.email}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {resident.houses?.house_number && (
                        <span className="text-xs text-slate-500">
                          House {resident.houses.house_number}
                          {resident.houses.street && (
                            <span className="text-slate-400"> · {resident.houses.street}</span>
                          )}
                        </span>
                      )}
                      {resident.ic_number && (
                        <span className="text-xs text-slate-500">IC: ****{resident.ic_number}</span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(resident.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => openDetail(resident)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!detailTarget} onOpenChange={(open) => { if (!open) closeDetail() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Application Review</DialogTitle>
            {detailTarget && (
              <p className="text-sm text-slate-500 mt-0.5">
                Submitted {formatDistanceToNow(new Date(detailTarget.created_at), { addSuffix: true })}
              </p>
            )}
          </DialogHeader>

          {detailTarget && (
            <div className="space-y-4 py-1">
              {/* Applicant section */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-base shrink-0">
                  {detailTarget.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900">{detailTarget.full_name}</p>
                    {detailTarget.resident_type && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {detailTarget.resident_type.toLowerCase()}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{detailTarget.email}</span>
                    </div>
                    {detailTarget.ic_number && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>IC: ****{detailTarget.ic_number}</span>
                      </div>
                    )}
                    {detailTarget.resident_type && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="capitalize">{detailTarget.resident_type.toLowerCase()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{format(new Date(detailTarget.created_at), 'd MMM yyyy, h:mm a')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Property section */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <Home className="w-3.5 h-3.5" />
                  Property
                </div>
                {detailTarget.houses ? (
                  <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">House {detailTarget.houses.house_number}</span>
                      <OccupancyBadge status={detailTarget.houses.occupancy_status} />
                    </div>
                    {detailTarget.houses.street && (
                      <p className="text-sm text-slate-500">{detailTarget.houses.street}</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-500">No house assigned</div>
                )}

                {isLoadingDetails ? (
                  <p className="text-xs text-slate-400 px-1">Checking existing accounts…</p>
                ) : coResidents.length > 0 ? (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="text-sm font-medium text-blue-800">
                        {coResidents.length} other account{coResidents.length !== 1 ? 's' : ''} registered at this address
                      </span>
                    </div>
                    <ul className="space-y-1 pl-6">
                      {coResidents.map((cr, i) => (
                        <li key={i} className="text-xs text-blue-700">
                          <span className="font-medium">{cr.full_name}</span>
                          <span className="text-blue-500"> · {cr.email}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-blue-600 pl-0.5">This is expected if multiple household members are registered.</p>
                  </div>
                ) : null}
              </div>

              {/* Reject form (slides in) */}
              {showRejectForm && (
                <div className="space-y-2 pt-1">
                  <Label htmlFor="reject-reason" className="text-sm font-medium text-slate-700">
                    Reason for rejection <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="reject-reason"
                    placeholder="e.g. The house number provided does not match our records. Please verify and resubmit."
                    rows={3}
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    className="resize-none"
                    autoFocus
                  />
                  <p className="text-xs text-slate-400">{rejectReason.trim().length} / 10 min characters</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            {showRejectForm ? (
              <>
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => { setShowRejectForm(false); setRejectReason('') }}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleRejectSubmit}
                  disabled={isSubmitting || rejectReason.trim().length < 10}
                >
                  {isSubmitting ? 'Rejecting…' : 'Confirm Rejection'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 gap-1.5"
                  onClick={() => setShowRejectForm(true)}
                  disabled={isSubmitting}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  onClick={() => detailTarget && handleApprove(detailTarget)}
                  disabled={isSubmitting}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Approving…' : 'Approve'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
