'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus, Share2, Clock, CalendarDays, User, Truck, Hammer, X, QrCode,
  Loader2, Download, Bike, HelpCircle, XCircle, Home, Car, Phone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { useAuth } from '@/hooks/index'
import { usePreRegistrations } from '@/hooks/use-pre-registrations'
import type { VisitorType, VisitorPass } from '@/lib/types'
import QRCode from 'react-qr-code'

const preRegSchema = z.object({
  visitorName: z.string().min(1, 'Visitor name is required'),
  visitorType: z.enum(['VISITOR', 'CONTRACTOR', 'E_HAILING', 'COURIER', 'OTHERS']),
  visitReason: z.string().min(1, 'Reason for visit is required'),
  expectedDate: z.string().min(1, 'Expected date is required'),
  phoneNumber: z.string().optional(),
  vehicleNumber: z.string().optional(),
})

type PreRegFormData = z.infer<typeof preRegSchema>

const TYPE_COLORS: Record<VisitorType, string> = {
  VISITOR: 'bg-purple-100 text-purple-700 border-purple-200',
  CONTRACTOR: 'bg-blue-100 text-blue-700 border-blue-200',
  E_HAILING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  COURIER: 'bg-orange-100 text-orange-700 border-orange-200',
  OTHERS: 'bg-slate-100 text-slate-600 border-slate-200',
}

const TYPE_ICONS: Record<VisitorType, React.ElementType> = {
  VISITOR: User,
  CONTRACTOR: Hammer,
  E_HAILING: Bike,
  COURIER: Truck,
  OTHERS: HelpCircle,
}

const VISITOR_TYPE_OPTIONS: { value: VisitorType; label: string }[] = [
  { value: 'VISITOR', label: 'Visitor' },
  { value: 'CONTRACTOR', label: 'Contractor' },
  { value: 'E_HAILING', label: 'E-Hailing' },
  { value: 'COURIER', label: 'Courier' },
  { value: 'OTHERS', label: 'Others' },
]

function svgToCanvas(svgEl: Element, size: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve) => {
    const svgData = new XMLSerializer().serializeToString(svgEl)
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)
      resolve(canvas)
    }
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`
  })
}

async function generatePassImage(pass: VisitorPass, houseNumber: string): Promise<Blob> {
  const W = 480
  const H = 700
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  // Indigo header
  ctx.fillStyle = '#4f46e5'
  ctx.fillRect(0, 0, W, 80)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('ILMIA ONE', W / 2, 35)
  ctx.font = '14px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#c7d2fe'
  ctx.fillText('Visitor Pass', W / 2, 58)

  // QR code — render from hidden SVG
  const svgEl = document.getElementById(`qr-${pass.qrCode}`)
  if (svgEl) {
    const qrCanvas = await svgToCanvas(svgEl, 240)
    const qrX = (W - 240) / 2
    const qrY = 100
    // White border around QR
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(qrX - 16, qrY - 16, 272, 272)
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 1
    ctx.strokeRect(qrX - 16, qrY - 16, 272, 272)
    ctx.drawImage(qrCanvas, qrX, qrY, 240, 240)
  }

  // Detail rows
  ctx.textAlign = 'left'
  let y = 380
  const labelX = 48
  const valueX = 48

  const drawRow = (label: string, value: string) => {
    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px system-ui, -apple-system, sans-serif'
    ctx.fillText(label.toUpperCase(), labelX, y)
    y += 18
    ctx.fillStyle = '#1e293b'
    ctx.font = '15px system-ui, -apple-system, sans-serif'
    ctx.fillText(value, valueX, y)
    y += 30
  }

  drawRow('Visitor Name', pass.visitorName)
  drawRow('Type', VISITOR_TYPE_OPTIONS.find(t => t.value === pass.visitorType)?.label ?? pass.visitorType)
  drawRow('Expected Date', format(new Date(pass.expectedDate), 'd MMM yyyy'))
  drawRow('House No.', `No. ${houseNumber}`)
  if (pass.visitReason) drawRow('Reason', pass.visitReason)

  // Footer
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, H - 50, W, 50)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '11px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Show this QR to the guard at the guardhouse entrance', W / 2, H - 22)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png')
  })
}

async function handleShare(pass: VisitorPass, houseNumber: string) {
  try {
    const blob = await generatePassImage(pass, houseNumber)
    const file = new File([blob], `visitor-pass-${pass.visitorName.replace(/\s+/g, '-').toLowerCase()}.png`, { type: 'image/png' })

    // Tier 1: Native share with image file (mobile)
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: `Visitor Pass — ${pass.visitorName}`,
        text: `Visitor pass for ${pass.visitorName} on ${format(new Date(pass.expectedDate), 'd MMM yyyy')}`,
        files: [file],
      })
      return
    }

    // Tier 2: Native share text-only
    if (navigator.share) {
      await navigator.share({
        title: `Visitor Pass — ${pass.visitorName}`,
        text: `Visitor pass for ${pass.visitorName} on ${format(new Date(pass.expectedDate), 'd MMM yyyy')}. Pass code: ${pass.qrCode}`,
      })
      return
    }

    // Tier 3: Direct image download (desktop fallback)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = file.name
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Pass image downloaded')
  } catch (err) {
    // User cancelled share sheet — not an error
    if (err instanceof Error && err.name === 'AbortError') return
    toast.error('Failed to share pass')
  }
}

function handleDownloadQr(qrCode: string, visitorName: string) {
  const svgEl = document.getElementById(`qr-${qrCode}`)
  if (!svgEl) return

  const svgData = new XMLSerializer().serializeToString(svgEl)
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  const img = new Image()
  img.onload = () => {
    if (ctx) {
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, 256, 256)
      ctx.drawImage(img, 0, 0, 256, 256)
    }
    const link = document.createElement('a')
    link.download = `visitor-pass-${visitorName.replace(/\s+/g, '-').toLowerCase()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }
  img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`
}

export default function VisitorsPage() {
  const { user } = useAuth()
  const { passes, isLoading, createPass, revokePass } = usePreRegistrations(user?.id ?? null)

  const [isCreating, setIsCreating] = useState(false)
  const [filter, setFilter] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE')
  const [revoking, setRevoking] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPass, setSelectedPass] = useState<VisitorPass | null>(null)
  const [isSharing, setIsSharing] = useState(false)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<PreRegFormData>({
    resolver: zodResolver(preRegSchema),
    defaultValues: {
      visitorType: 'VISITOR',
      expectedDate: new Date().toISOString().split('T')[0],
    },
  })

  const selectedType = watch('visitorType')

  const onSubmit = async (data: PreRegFormData) => {
    if (!user?.houseId) {
      toast.error('Your house profile is not set up. Contact the administrator.')
      return
    }
    setIsSubmitting(true)
    try {
      await createPass({ ...data, houseId: user.houseId })
      toast.success(`Visitor pass created for ${data.visitorName}`)
      reset({ visitorType: 'VISITOR', expectedDate: new Date().toISOString().split('T')[0] })
      setIsCreating(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create pass')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRevoke = async (id: string) => {
    setRevoking(id)
    try {
      await revokePass(id)
      toast.success('Visitor pass revoked')
      if (selectedPass?.id === id) setSelectedPass(null)
    } catch {
      toast.error('Failed to revoke pass')
    } finally {
      setRevoking(null)
    }
  }

  const onShare = useCallback(async (pass: VisitorPass) => {
    setIsSharing(true)
    try {
      await handleShare(pass, user?.houseNumber ?? '—')
    } finally {
      setIsSharing(false)
    }
  }, [user?.houseNumber])

  const filteredPasses = passes.filter(pass =>
    filter === 'ACTIVE' ? pass.status === 'ACTIVE' : pass.status !== 'ACTIVE',
  )

  const getTypeIcon = (type: VisitorType) => {
    const Icon = TYPE_ICONS[type] ?? User
    return <Icon className="w-4 h-4" />
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Visitor Access</h2>
          <p className="text-slate-500 mt-1">Generate QR passes for your visitors.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-lg flex">
            <button
              onClick={() => setFilter('ACTIVE')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all',
                filter === 'ACTIVE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('HISTORY')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all',
                filter === 'HISTORY' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              History
            </button>
          </div>
          <Button onClick={() => setIsCreating(true)} className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> New Pass
          </Button>
        </div>
      </div>

      {/* Create Pass Form */}
      {isCreating && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
            <CardContent className="pt-8 pb-8 px-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">New Visitor Pass</h3>
                  <p className="text-slate-500 text-sm">Fill in the details to generate a QR code.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-red-500">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Visitor Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Visitor Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        {...register('visitorName')}
                        onInput={(e) => {
                          const el = e.currentTarget
                          el.value = el.value.replace(/(?:^|\s)\S/g, c => c.toUpperCase())
                        }}
                        className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                        placeholder="e.g. John Doe"
                      />
                      <User className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" />
                    </div>
                    {errors.visitorName && <p className="text-xs text-red-500">{errors.visitorName.message}</p>}
                  </div>

                  {/* Visitor Type */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Visitor Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {VISITOR_TYPE_OPTIONS.map(({ value, label }) => {
                        const Icon = TYPE_ICONS[value]
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setValue('visitorType', value)}
                            className={cn(
                              'flex flex-col items-center justify-center gap-1 py-2 rounded-lg border text-xs font-medium transition-all',
                              selectedType === value
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50',
                            )}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span className="text-[10px] leading-tight text-center">{label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Expected Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Expected Arrival Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('expectedDate')}
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                    />
                    {errors.expectedDate && <p className="text-xs text-red-500">{errors.expectedDate.message}</p>}
                  </div>

                  {/* Visit Reason */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Reason for Visit <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('visitReason')}
                      className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                      placeholder="e.g. Family visit, delivery"
                    />
                    {errors.visitReason && <p className="text-xs text-red-500">{errors.visitReason.message}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Phone Number <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
                    <input
                      {...register('phoneNumber')}
                      type="tel"
                      placeholder="e.g. 0123456789"
                      className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                    />
                  </div>

                  {/* Vehicle */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Vehicle No. <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
                    <input
                      {...register('vehicleNumber')}
                      placeholder="e.g. WXX 1234"
                      className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm uppercase"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => { reset(); setIsCreating(false) }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="px-8 bg-slate-900 hover:bg-slate-800 text-white">
                    {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</> : 'Generate Pass'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading passes…</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isCreating && filteredPasses.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">
            No {filter === 'ACTIVE' ? 'active' : 'past'} passes
          </h3>
          <p className="text-slate-500 mt-1 max-w-sm mx-auto">
            {filter === 'ACTIVE'
              ? "You don't have any active visitor passes. Create one to invite guests!"
              : 'No history available yet.'}
          </p>
          {filter === 'ACTIVE' && (
            <Button onClick={() => setIsCreating(true)} className="mt-6">
              Create First Pass
            </Button>
          )}
        </div>
      )}

      {/* Pass Cards Grid */}
      {!isLoading && filteredPasses.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPasses.map(pass => (
            <div
              key={pass.id}
              onClick={() => setSelectedPass(pass)}
              className="group relative flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            >
              {/* Status strip */}
              <div className={cn(
                'h-1.5 w-full',
                pass.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300',
              )} />

              <div className="p-6 flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border',
                    TYPE_COLORS[pass.visitorType],
                  )}>
                    {getTypeIcon(pass.visitorType)}
                    {VISITOR_TYPE_OPTIONS.find(t => t.value === pass.visitorType)?.label ?? pass.visitorType}
                  </div>
                  <div className="flex items-center gap-2">
                    {pass.status === 'ACTIVE' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRevoke(pass.id) }}
                        disabled={revoking === pass.id}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                        title="Revoke pass"
                      >
                        {revoking === pass.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <XCircle className="w-4 h-4" />
                        }
                      </button>
                    )}
                    <Badge
                      variant={pass.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className={cn(
                        'text-[10px]',
                        pass.status === 'ACTIVE' && 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-transparent',
                      )}
                    >
                      {pass.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">{pass.visitorName}</h3>
                  {pass.visitReason && (
                    <p className="text-sm text-slate-500 mt-0.5">{pass.visitReason}</p>
                  )}
                </div>

                <div className="flex items-center text-slate-500 text-sm">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  {format(new Date(pass.expectedDate), 'EEEE, d MMM yyyy')}
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-400">
                    Expires {format(new Date(pass.expiresAt), 'd MMM yyyy, h:mm a')}
                  </span>
                </div>
              </div>

              {/* Ticket perforation */}
              <div className="relative h-px bg-slate-200 mx-4">
                <div className="absolute -left-6 -top-2 w-4 h-4 rounded-full bg-slate-50 border-r border-slate-200" />
                <div className="absolute -right-6 -top-2 w-4 h-4 rounded-full bg-slate-50 border-l border-slate-200" />
              </div>

              {/* QR Section */}
              <div className="bg-slate-50 p-5 flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-9"
                    onClick={(e) => { e.stopPropagation(); handleDownloadQr(pass.qrCode, pass.visitorName) }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download QR
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-9 w-full"
                    onClick={(e) => { e.stopPropagation(); onShare(pass) }}
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </Button>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                  <QRCode
                    id={`qr-${pass.qrCode}`}
                    value={pass.qrCode}
                    size={80}
                    style={{ height: 'auto', maxWidth: '100%', width: '80px' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pass Detail Dialog */}
      <Dialog open={!!selectedPass} onOpenChange={(open) => { if (!open) setSelectedPass(null) }}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          {selectedPass && (
            <>
              {/* Status color strip */}
              <div className={cn(
                'h-2 w-full',
                selectedPass.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300',
              )} />

              <DialogHeader className="px-6 pt-5 pb-0">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl font-bold text-slate-900">
                    {selectedPass.visitorName}
                  </DialogTitle>
                  <Badge
                    variant={selectedPass.status === 'ACTIVE' ? 'default' : 'secondary'}
                    className={cn(
                      'text-xs',
                      selectedPass.status === 'ACTIVE' && 'bg-emerald-100 text-emerald-700 border-transparent',
                    )}
                  >
                    {selectedPass.status}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="px-6 pb-6 space-y-5">
                {/* Large QR code */}
                <div className="flex justify-center py-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <QRCode
                      id={`qr-dialog-${selectedPass.qrCode}`}
                      value={selectedPass.qrCode}
                      size={200}
                      style={{ height: 'auto', maxWidth: '100%', width: '200px' }}
                    />
                  </div>
                </div>

                {/* Detail rows */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border',
                      TYPE_COLORS[selectedPass.visitorType],
                    )}>
                      {getTypeIcon(selectedPass.visitorType)}
                      {VISITOR_TYPE_OPTIONS.find(t => t.value === selectedPass.visitorType)?.label ?? selectedPass.visitorType}
                    </div>
                  </div>

                  <div className="grid gap-2.5 text-sm">
                    <div className="flex items-center gap-3 text-slate-600">
                      <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{format(new Date(selectedPass.expectedDate), 'EEEE, d MMM yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Expires {format(new Date(selectedPass.expiresAt), 'd MMM yyyy, h:mm a')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <Home className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>House No. {user?.houseNumber ?? '—'}</span>
                    </div>
                    {selectedPass.visitReason && (
                      <div className="flex items-start gap-3 text-slate-600">
                        <QrCode className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span>{selectedPass.visitReason}</span>
                      </div>
                    )}
                    {selectedPass.vehicleNumber && (
                      <div className="flex items-center gap-3 text-slate-600">
                        <Car className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-mono">{selectedPass.vehicleNumber}</span>
                      </div>
                    )}
                    {selectedPass.phoneNumber && (
                      <div className="flex items-center gap-3 text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{selectedPass.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    disabled={isSharing}
                    onClick={() => onShare(selectedPass)}
                  >
                    {isSharing
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Share2 className="w-4 h-4" />
                    }
                    Share Pass
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => {
                      const svgEl = document.getElementById(`qr-dialog-${selectedPass.qrCode}`)
                      if (!svgEl) return
                      const svgData = new XMLSerializer().serializeToString(svgEl)
                      const canvas = document.createElement('canvas')
                      canvas.width = 256
                      canvas.height = 256
                      const ctx = canvas.getContext('2d')
                      const img = new Image()
                      img.onload = () => {
                        if (ctx) {
                          ctx.fillStyle = 'white'
                          ctx.fillRect(0, 0, 256, 256)
                          ctx.drawImage(img, 0, 0, 256, 256)
                        }
                        const link = document.createElement('a')
                        link.download = `visitor-pass-${selectedPass.visitorName.replace(/\s+/g, '-').toLowerCase()}.png`
                        link.href = canvas.toDataURL('image/png')
                        link.click()
                      }
                      img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Download QR
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
