'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import {
  QrCode, Camera, CheckCircle2, XCircle, AlertTriangle,
  Loader2, ShieldOff, ClipboardList, Search, ChevronDown,
  User, Hammer, Bike, Truck, HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import dynamic from 'next/dynamic'
import type { IDetectedBarcode } from '@yudiel/react-qr-scanner'

const Scanner = dynamic(() => import('@yudiel/react-qr-scanner').then(m => m.Scanner), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-black">
      <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
    </div>
  ),
})

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

type ScanState = 'IDLE' | 'SCANNING' | 'VERIFYING' | 'VERIFIED' | 'CONFIRMING' | 'SUCCESS' | 'ERROR'

interface PreRegData {
  id: string
  visitor_name: string
  visitor_type: string
  visit_reason: string
  house_id: string
  vehicle_number?: string | null
  phone_number?: string | null
  expected_date: string
  expires_at: string
}

interface HouseOption {
  id: string
  house_number: string
  street: string | null
}

interface VerifiedPass {
  preReg: PreRegData
  houseNumber: string
}

const VISITOR_TYPES = [
  { value: 'VISITOR',    label: 'Visitor',    Icon: User },
  { value: 'CONTRACTOR', label: 'Contractor', Icon: Hammer },
  { value: 'E_HAILING',  label: 'E-Hailing',  Icon: Bike },
  { value: 'COURIER',    label: 'Courier',     Icon: Truck },
  { value: 'OTHERS',     label: 'Others',      Icon: HelpCircle },
] as const

const TYPE_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  VISITOR:    { bg: 'bg-blue-500/20',   text: 'text-blue-300',   dot: 'bg-blue-400' },
  CONTRACTOR: { bg: 'bg-orange-500/20', text: 'text-orange-300', dot: 'bg-orange-400' },
  E_HAILING:  { bg: 'bg-purple-500/20', text: 'text-purple-300', dot: 'bg-purple-400' },
  COURIER:    { bg: 'bg-amber-500/20',  text: 'text-amber-300',  dot: 'bg-amber-400' },
  OTHERS:     { bg: 'bg-slate-700/60',  text: 'text-slate-300',  dot: 'bg-slate-400' },
}

const TYPE_LABEL: Record<string, string> = {
  VISITOR: 'Visitor', CONTRACTOR: 'Contractor',
  E_HAILING: 'E-Hailing', COURIER: 'Courier', OTHERS: 'Others',
}

const STATUS_PILL: Record<ScanState, { label: string; cls: string }> = {
  IDLE:       { label: 'Ready',          cls: 'bg-emerald-100 text-emerald-700' },
  SCANNING:   { label: 'Scanning…',      cls: 'bg-blue-100 text-blue-700' },
  VERIFYING:  { label: 'Verifying…',     cls: 'bg-amber-100 text-amber-700' },
  CONFIRMING: { label: 'Logging…',       cls: 'bg-amber-100 text-amber-700' },
  VERIFIED:   { label: 'Pass Found',     cls: 'bg-amber-100 text-amber-700' },
  SUCCESS:    { label: 'Access Granted', cls: 'bg-emerald-100 text-emerald-700' },
  ERROR:      { label: 'Access Denied',  cls: 'bg-red-100 text-red-700' },
}

/* ─── Walk-In Form (extracted to avoid double-registering hooks) ────────── */
interface WalkInFormProps {
  form: ReturnType<typeof useForm<WalkInFormData>>
  houses: HouseOption[]
  isSubmitting: boolean
  onSubmit: (data: WalkInFormData) => Promise<void>
  onCancel?: () => void
  showCancel?: boolean
  successVisible?: boolean
}

function WalkInForm({
  form, houses, isSubmitting, onSubmit, onCancel, showCancel, successVisible,
}: WalkInFormProps) {
  const [houseOpen, setHouseOpen] = useState(false)
  const [houseSearch, setHouseSearch] = useState('')

  const filteredHouses = houses.filter(h => {
    const q = houseSearch.toLowerCase()
    return h.house_number.toLowerCase().includes(q) || (h.street ?? '').toLowerCase().includes(q)
  })

  const selectedType = form.watch('visitorType')

  return (
    <div className="relative">
      {/* Inline success flash (desktop panel only) */}
      {successVisible && (
        <div className="absolute inset-0 bg-white/96 flex flex-col items-center justify-center gap-3 z-10 rounded-b-xl anim-fade-up">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-900 text-sm">Entry Logged</p>
            <p className="text-xs text-slate-500 mt-0.5">Walk-in recorded successfully</p>
          </div>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Visitor Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">
            Visitor Name <span className="text-red-500">*</span>
          </label>
          <input
            {...form.register('visitorName')}
            placeholder="e.g. Ahmad bin Razak"
            className="w-full h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
          />
          {form.formState.errors.visitorName && (
            <p className="text-xs text-red-500">{form.formState.errors.visitorName.message}</p>
          )}
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
                onClick={() => form.setValue('visitorType', value, { shouldValidate: true })}
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
            control={form.control}
            render={({ field }) => {
              const selected = houses.find(h => h.house_number === field.value)
              return (
                <Popover open={houseOpen} onOpenChange={setHouseOpen} modal={false}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        'w-full flex items-center gap-2 px-3 h-11 rounded-lg border bg-white text-left text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all',
                        form.formState.errors.houseNumber ? 'border-red-400' : 'border-slate-300',
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
          {form.formState.errors.houseNumber && (
            <p className="text-xs text-red-500">{form.formState.errors.houseNumber.message}</p>
          )}
        </div>

        {/* Visit Reason */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">
            Reason for Visit <span className="text-red-500">*</span>
          </label>
          <input
            {...form.register('visitReason')}
            placeholder="e.g. Social visit, maintenance work"
            className="w-full h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
          />
          {form.formState.errors.visitReason && (
            <p className="text-xs text-red-500">{form.formState.errors.visitReason.message}</p>
          )}
        </div>

        {/* Optional: IC + Vehicle */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">IC No. (last 4)</label>
            <input
              {...form.register('icNumber')}
              placeholder="1234"
              maxLength={4}
              className="w-full h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono"
            />
            {form.formState.errors.icNumber && (
              <p className="text-xs text-red-500">{form.formState.errors.icNumber.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Vehicle No.</label>
            <input
              {...form.register('vehicleNumber')}
              placeholder="WXX 1234"
              className="w-full h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all uppercase"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Phone Number</label>
          <input
            {...form.register('phoneNumber')}
            type="tel"
            placeholder="e.g. 0123456789"
            className="w-full h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {showCancel && onCancel && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              'bg-slate-900 hover:bg-slate-800 text-white',
              showCancel ? 'flex-1' : 'w-full',
            )}
          >
            {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Logging…</> : 'Log Entry'}
          </Button>
        </div>
      </form>
    </div>
  )
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */
export default function ScannerPage() {
  const { hasPermission } = useAuth()
  const canScan = hasPermission('scan_qr')

  const [scanState, setScanState] = useState<ScanState>('IDLE')
  const [verifiedPass, setVerifiedPass] = useState<VerifiedPass | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [cameraError, setCameraError] = useState(false)
  const [isManualOpen, setIsManualOpen] = useState(false)
  const [houses, setHouses] = useState<HouseOption[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [walkInSuccess, setWalkInSuccess] = useState(false)

  const supabase = createClient()

  const walkInForm = useForm<WalkInFormData>({
    resolver: zodResolver(walkInSchema),
    defaultValues: { visitorType: 'VISITOR' },
  })

  useEffect(() => {
    fetch('/api/houses')
      .then(r => r.json())
      .then((data: HouseOption[]) => setHouses(data))
      .catch(() => {})
  }, [])

  const verifyQrCode = async (qrCode: string) => {
    setScanState('VERIFYING')
    setErrorMessage('')
    const trimmed = qrCode.trim()

    const { data: preReg, error } = await supabase
      .from('visitor_pre_registrations')
      .select('*')
      .eq('qr_code', trimmed)
      .single()

    if (error || !preReg) {
      setErrorMessage('Invalid pass. No matching pre-registration found.')
      setScanState('ERROR')
      return
    }
    if (preReg.status === 'USED') {
      setErrorMessage('This pass has already been used.')
      setScanState('ERROR')
      return
    }
    if (preReg.status === 'EXPIRED' || new Date(preReg.expires_at) < new Date()) {
      setErrorMessage(`Pass expired on ${new Date(preReg.expires_at).toLocaleDateString('en-MY')}.`)
      setScanState('ERROR')
      return
    }

    const { data: houseData } = await supabase
      .from('houses')
      .select('house_number')
      .eq('id', preReg.house_id)
      .single()

    setVerifiedPass({
      preReg,
      houseNumber: (houseData as { house_number: string } | null)?.house_number ?? '—',
    })
    setScanState('VERIFIED')
  }

  const confirmEntry = async () => {
    if (!verifiedPass) return
    setScanState('CONFIRMING')
    try {
      const res = await fetch('/api/guard/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preRegistrationId: verifiedPass.preReg.id }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Failed to confirm entry')
      }
      setScanState('SUCCESS')
      toast.success(`Entry confirmed for ${verifiedPass.preReg.visitor_name}`)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to confirm entry')
      setScanState('ERROR')
    }
  }

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
      walkInForm.reset({ visitorType: 'VISITOR' })
      setIsManualOpen(false)
      setWalkInSuccess(true)
      setTimeout(() => setWalkInSuccess(false), 2000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to log entry')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetScanner = () => {
    setScanState('IDLE')
    setVerifiedPass(null)
    setErrorMessage('')
    setCameraError(false)
  }

  const status = STATUS_PILL[scanState]

  if (!canScan) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-20">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Access Control Scanner</h1>
          <p className="text-slate-500 text-sm mt-1">Scan QR passes or log walk-in visitors.</p>
        </div>
        <Card className="border-slate-200 shadow-sm">
          <div className="flex flex-col items-center justify-center p-16 text-center gap-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <ShieldOff className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Permission Required</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-xs">
                Your role does not have permission to scan QR passes.
                Contact the AJK Leader to enable this access.
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes scanLine {
          0%, 100% { top: 6%; }
          50% { top: 88%; }
        }
        @keyframes cornerPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        .anim-scan-line  { animation: scanLine 2.4s cubic-bezier(0.4,0,0.6,1) infinite; }
        .anim-corner     { animation: cornerPulse 1.4s ease-in-out infinite; }
        .anim-fade-up    { animation: fadeSlideUp 0.25s ease-out both; }
        .anim-scale-in   { animation: scaleIn 0.2s ease-out both; }
      `}</style>

      <div className="pb-20">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Access Control Scanner</h1>
            <p className="text-slate-500 text-sm mt-0.5">Scan QR passes or log walk-in visitors.</p>
          </div>
          <span className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0 mt-1',
            status.cls,
          )}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {status.label}
          </span>
        </div>

        {/* ── Two-column layout ───────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ══ SCANNER PANEL ══════════════════════════════════════════════ */}
          <div className="w-full lg:flex-1 min-w-0">
            <div
              className="bg-slate-950 rounded-2xl overflow-hidden shadow-2xl relative w-full"
              style={{ minHeight: 480 }}
            >

              {/* IDLE ─────────────────────────────────────────────────────── */}
              {scanState === 'IDLE' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-7 p-8 anim-fade-up">
                  {/* Glow + camera icon */}
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-40 h-40 rounded-full bg-emerald-500/10 blur-2xl" />
                    <div className="absolute w-28 h-28 rounded-full border border-emerald-500/15 bg-emerald-500/5" />
                    <div className="w-20 h-20 bg-slate-800/80 border border-slate-700 rounded-full flex items-center justify-center z-10 shadow-lg">
                      <Camera className="w-9 h-9 text-slate-400" />
                    </div>
                  </div>

                  <div className="text-center space-y-1.5">
                    <p className="text-slate-200 font-semibold text-lg">Ready to scan</p>
                    <p className="text-slate-500 text-sm">Ensure adequate lighting for best results</p>
                  </div>

                  <Button
                    size="lg"
                    disabled={cameraError}
                    onClick={() => { setCameraError(false); setScanState('SCANNING') }}
                    className="bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white font-semibold px-10 h-12 rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
                  >
                    <QrCode className="w-5 h-5 mr-2" />
                    {cameraError ? 'Camera Unavailable' : 'Activate Scanner'}
                  </Button>

                  <button
                    onClick={() => setIsManualOpen(true)}
                    className="lg:hidden flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm transition-colors"
                  >
                    <ClipboardList className="w-4 h-4" />
                    Log walk-in manually instead
                  </button>
                </div>
              )}

              {/* SCANNING ────────────────────────────────────────────────── */}
              {scanState === 'SCANNING' && (
                <div className="absolute inset-0 flex flex-col">
                  <div className="flex-1 relative overflow-hidden">
                    <Scanner
                      onScan={(detectedCodes: IDetectedBarcode[]) => {
                        if (detectedCodes.length > 0 && scanState === 'SCANNING') {
                          verifyQrCode(detectedCodes[0].rawValue)
                        }
                      }}
                      onError={() => {
                        setCameraError(true)
                        setScanState('IDLE')
                        toast.error('Camera access denied. Use manual entry instead.')
                      }}
                      styles={{ container: { width: '100%', height: '100%', minHeight: 400 } }}
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Dark vignette */}
                      <div className="absolute inset-0 bg-black/50" />

                      {/* Scan frame */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-60 h-60">
                          {/* Corner brackets */}
                          {(['tl','tr','bl','br'] as const).map(corner => (
                            <div
                              key={corner}
                              className={cn(
                                'anim-corner absolute w-10 h-10',
                                corner === 'tl' && 'top-0 left-0 border-l-2 border-t-2 rounded-tl-xl border-emerald-400',
                                corner === 'tr' && 'top-0 right-0 border-r-2 border-t-2 rounded-tr-xl border-emerald-400',
                                corner === 'bl' && 'bottom-0 left-0 border-l-2 border-b-2 rounded-bl-xl border-emerald-400',
                                corner === 'br' && 'bottom-0 right-0 border-r-2 border-b-2 rounded-br-xl border-emerald-400',
                              )}
                            />
                          ))}

                          {/* Scan line */}
                          <div
                            className="anim-scan-line absolute left-1 right-1 h-px"
                            style={{ background: 'linear-gradient(to right, transparent, #34d399 40%, #34d399 60%, transparent)' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom bar */}
                  <div className="px-5 py-4 bg-slate-900/95 backdrop-blur-sm flex items-center justify-between gap-4 border-t border-slate-800">
                    <p className="text-slate-400 text-sm">Align QR code within the frame</p>
                    <Button
                      onClick={resetScanner}
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 h-9 px-4"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* VERIFYING / CONFIRMING ──────────────────────────────────── */}
              {(scanState === 'VERIFYING' || scanState === 'CONFIRMING') && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-8 text-center anim-fade-up">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-20 h-20 rounded-full bg-indigo-500/15 blur-xl" />
                    <Loader2 className="w-12 h-12 text-indigo-400 animate-spin relative z-10" />
                  </div>
                  <div>
                    <p className="text-slate-100 font-semibold text-xl">
                      {scanState === 'VERIFYING' ? 'Verifying Pass…' : 'Logging Entry…'}
                    </p>
                    <p className="text-slate-500 text-sm mt-1">
                      {scanState === 'VERIFYING'
                        ? 'Checking validity and permissions'
                        : 'Creating visitor log record'}
                    </p>
                  </div>
                </div>
              )}

              {/* VERIFIED ────────────────────────────────────────────────── */}
              {scanState === 'VERIFIED' && verifiedPass && (
                <div className="absolute inset-0 flex flex-col anim-scale-in">
                  <div className="flex-1 flex flex-col items-center justify-center gap-5 p-6 overflow-y-auto">
                    {/* Header */}
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                        <QrCode className="w-7 h-7 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest">Valid Pass</p>
                        <p className="text-slate-400 text-sm mt-0.5">Review and confirm entry</p>
                      </div>
                    </div>

                    {/* Visitor card */}
                    <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                      {/* Name row */}
                      <div className="px-5 py-4 border-b border-slate-800">
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Visitor</p>
                        <p className="text-white text-xl font-bold leading-tight">
                          {verifiedPass.preReg.visitor_name}
                        </p>
                      </div>

                      {/* Type + House */}
                      <div className="grid grid-cols-2 divide-x divide-slate-800 border-b border-slate-800">
                        <div className="px-4 py-3">
                          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1.5">Type</p>
                          {(() => {
                            const badge = TYPE_BADGE[verifiedPass.preReg.visitor_type] ?? TYPE_BADGE['OTHERS']
                            return (
                              <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', badge.bg, badge.text)}>
                                <span className={cn('w-1.5 h-1.5 rounded-full', badge.dot)} />
                                {TYPE_LABEL[verifiedPass.preReg.visitor_type] ?? verifiedPass.preReg.visitor_type}
                              </span>
                            )
                          })()}
                        </div>
                        <div className="px-4 py-3">
                          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Destination</p>
                          <p className="text-white font-bold text-xl">No. {verifiedPass.houseNumber}</p>
                        </div>
                      </div>

                      {/* Purpose */}
                      <div className="px-5 py-3 border-b border-slate-800">
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Purpose</p>
                        <p className="text-slate-300 text-sm">{verifiedPass.preReg.visit_reason}</p>
                      </div>

                      {/* Vehicle (optional) */}
                      {verifiedPass.preReg.vehicle_number && (
                        <div className="px-5 py-3 flex items-center justify-between">
                          <p className="text-slate-500 text-xs uppercase tracking-wide">Vehicle</p>
                          <p className="font-mono font-bold text-white text-sm tracking-wider">
                            {verifiedPass.preReg.vehicle_number}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="px-5 py-4 bg-slate-900/80 border-t border-slate-800 grid grid-cols-2 gap-3">
                    <Button
                      onClick={resetScanner}
                      className="h-12 bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                    >
                      <XCircle className="w-4 h-4 mr-1.5" />
                      Deny Entry
                    </Button>
                    <Button
                      onClick={confirmEntry}
                      className="h-12 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold shadow-md shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Confirm Entry
                    </Button>
                  </div>
                </div>
              )}

              {/* SUCCESS ─────────────────────────────────────────────────── */}
              {scanState === 'SUCCESS' && verifiedPass && (
                <div className="absolute inset-0 flex flex-col anim-scale-in">
                  <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-32 h-32 rounded-full bg-emerald-500/15 blur-2xl" />
                      <div className="w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center z-10">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                      </div>
                    </div>

                    <div>
                      <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest">Entry Logged</p>
                      <h2 className="text-white text-3xl font-bold mt-1">Access Granted</h2>
                    </div>

                    <div className="bg-slate-900/80 border border-emerald-500/25 rounded-xl px-8 py-5 space-y-1 w-full max-w-xs">
                      <p className="text-slate-400 text-xs uppercase tracking-wide">Visitor</p>
                      <p className="text-white font-bold text-lg">{verifiedPass.preReg.visitor_name}</p>
                      <p className="text-slate-500 text-sm">→ House No. {verifiedPass.houseNumber}</p>
                    </div>
                  </div>

                  <div className="px-5 py-4 bg-slate-900/80 border-t border-emerald-500/20">
                    <Button
                      onClick={resetScanner}
                      className="w-full h-12 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Scan Next Visitor
                    </Button>
                  </div>
                </div>
              )}

              {/* ERROR ───────────────────────────────────────────────────── */}
              {scanState === 'ERROR' && (
                <div className="absolute inset-0 flex flex-col anim-scale-in">
                  <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-32 h-32 rounded-full bg-red-500/15 blur-2xl" />
                      <div className="w-24 h-24 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center z-10">
                        <XCircle className="w-12 h-12 text-red-400" />
                      </div>
                    </div>

                    <div>
                      <p className="text-red-400 text-xs font-semibold uppercase tracking-widest">Entry Blocked</p>
                      <h2 className="text-white text-3xl font-bold mt-1">Access Denied</h2>
                    </div>

                    <div className="bg-slate-900/80 border border-red-500/25 rounded-xl p-4 w-full max-w-xs flex items-start gap-3 text-left">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-slate-300 text-sm">
                        {errorMessage || 'This pass is invalid. Do not allow entry. Contact the resident for verification.'}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 py-4 bg-slate-900/80 border-t border-red-500/20">
                    <Button
                      onClick={resetScanner}
                      className="w-full h-12 bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              )}

            </div>

            {/* Mobile walk-in entry button */}
            <div className="lg:hidden mt-4">
              <Button
                variant="outline"
                className="w-full h-12 border-slate-200 text-slate-700"
                onClick={() => setIsManualOpen(true)}
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Log Walk-In Entry
              </Button>
            </div>
          </div>

          {/* ══ WALK-IN FORM PANEL (desktop only) ══════════════════════════ */}
          <div className="hidden lg:block w-[380px] shrink-0">
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 bg-white border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900 text-sm leading-snug">Log Walk-In Entry</h2>
                  <p className="text-slate-400 text-xs">For visitors without a QR pass</p>
                </div>
              </div>

              <div className="p-5">
                <WalkInForm
                  form={walkInForm}
                  houses={houses}
                  isSubmitting={isSubmitting}
                  onSubmit={onSubmitWalkIn}
                  successVisible={walkInSuccess}
                />
              </div>
            </Card>
          </div>

        </div>
      </div>

      {/* Mobile walk-in dialog */}
      <Dialog open={isManualOpen} onOpenChange={setIsManualOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register Walk-In Visitor</DialogTitle>
            <DialogDescription>Fill in the visitor details to log their entry.</DialogDescription>
          </DialogHeader>
          <div className="pt-1">
            <WalkInForm
              form={walkInForm}
              houses={houses}
              isSubmitting={isSubmitting}
              onSubmit={onSubmitWalkIn}
              onCancel={() => setIsManualOpen(false)}
              showCancel
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
