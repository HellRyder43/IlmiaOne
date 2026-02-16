'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { CheckCircle2, XCircle, UserCheck, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'

interface PendingResident {
  id: string
  full_name: string
  email: string
  ic_number: string | null
  resident_type: string | null
  created_at: string
  houses: { house_number: string } | null
}

export default function RegistrationsPage() {
  const [residents, setResidents] = useState<PendingResident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [rejectTarget, setRejectTarget] = useState<PendingResident | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  const fetchPending = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, ic_number, resident_type, created_at, houses(house_number)')
      .eq('status', 'PENDING_APPROVAL')
      .order('created_at', { ascending: true })

    setResidents((data as PendingResident[]) ?? [])
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchPending()
  }, [fetchPending])

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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRejectSubmit = async () => {
    if (!rejectTarget) return
    if (rejectReason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters.')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/residents/${rejectTarget.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Rejection failed')
      }
      setResidents(prev => prev.filter(r => r.id !== rejectTarget.id))
      toast.success(`${rejectTarget.full_name}'s registration was rejected.`)
      setRejectTarget(null)
      setRejectReason('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
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
                        <span className="text-xs text-slate-500">House {resident.houses.house_number}</span>
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

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                      onClick={() => handleApprove(resident)}
                      disabled={isSubmitting}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 gap-1.5"
                      onClick={() => { setRejectTarget(resident); setRejectReason('') }}
                      disabled={isSubmitting}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => { if (!open) { setRejectTarget(null); setRejectReason('') } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Registration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {rejectTarget && (
              <p className="text-sm text-slate-600">
                You are rejecting <span className="font-semibold text-slate-900">{rejectTarget.full_name}</span>&apos;s registration. They will be notified by email with your reason.
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Reason for rejection <span className="text-red-500">*</span></Label>
              <Textarea
                id="reject-reason"
                placeholder="e.g. The house number provided does not match our records. Please verify and resubmit."
                rows={4}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="resize-none"
              />
              <p className="text-xs text-slate-400">{rejectReason.trim().length} / 10 min characters</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setRejectTarget(null); setRejectReason('') }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleRejectSubmit}
              disabled={isSubmitting || rejectReason.trim().length < 10}
            >
              {isSubmitting ? 'Rejecting…' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
