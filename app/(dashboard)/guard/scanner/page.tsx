'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  QrCode, Camera, CheckCircle2, XCircle, AlertTriangle,
  ArrowRight, Keyboard, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import type { IDetectedBarcode } from '@yudiel/react-qr-scanner'

const Scanner = dynamic(() => import('@yudiel/react-qr-scanner').then(m => m.Scanner), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-slate-900 rounded-lg">
      <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
    </div>
  ),
})

const manualSchema = z.object({
  passCode: z.string().min(1, 'Enter a pass code'),
})

type ManualFormData = z.infer<typeof manualSchema>

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

interface HouseData {
  house_number: string
}

interface VerifiedPass {
  preReg: PreRegData
  houseNumber: string
}

export default function ScannerPage() {
  const [scanState, setScanState] = useState<ScanState>('IDLE')
  const [verifiedPass, setVerifiedPass] = useState<VerifiedPass | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [cameraError, setCameraError] = useState(false)

  const { register, handleSubmit, reset: resetForm, formState: { errors } } = useForm<ManualFormData>({
    resolver: zodResolver(manualSchema),
  })

  const supabase = createClient()

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

    const { data: house } = await supabase
      .from('houses')
      .select('house_number')
      .eq('id', preReg.house_id)
      .single<HouseData>()

    setVerifiedPass({ preReg, houseNumber: house?.house_number ?? '—' })
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

  const handleManualSubmit = async (data: ManualFormData) => {
    await verifyQrCode(data.passCode)
    resetForm()
  }

  const resetScanner = () => {
    setScanState('IDLE')
    setVerifiedPass(null)
    setErrorMessage('')
    setCameraError(false)
  }

  const typeLabel: Record<string, string> = {
    VISITOR: 'Visitor',
    CONTRACTOR: 'Contractor',
    E_HAILING: 'E-Hailing',
    COURIER: 'Courier',
    OTHERS: 'Others',
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Access Control Scanner</h2>
        <p className="text-slate-500">Scan a visitor QR pass or enter the code manually.</p>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-lg relative min-h-[480px] flex flex-col">

        {/* IDLE STATE */}
        {scanState === 'IDLE' && (
          <div className="flex-1 bg-slate-900 relative flex flex-col items-center justify-center p-6 gap-6">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Camera className="w-10 h-10" />
              </div>
              <Button
                size="lg"
                disabled={cameraError}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-lg h-14"
                onClick={() => { setCameraError(false); setScanState('SCANNING') }}
              >
                <QrCode className="w-6 h-6 mr-2" />
                {cameraError ? 'Camera Unavailable' : 'Start Camera'}
              </Button>
              <p className="text-slate-400 text-sm">Ensure adequate lighting for best results.</p>
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-white p-6 rounded-t-2xl border-t border-slate-200">
              <form onSubmit={handleSubmit(handleManualSubmit)} className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Keyboard className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">Manual Code Entry</span>
                </div>
                <div className="flex gap-2">
                  <input
                    {...register('passCode')}
                    placeholder="Paste or type the pass UUID"
                    className="flex-1 h-12 rounded-lg border border-slate-300 bg-white px-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono text-sm"
                  />
                  <Button type="submit" size="lg" className="h-12 w-12 p-0">
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
                {errors.passCode && <p className="text-xs text-red-500">{errors.passCode.message}</p>}
              </form>
            </div>
          </div>
        )}

        {/* SCANNING STATE */}
        {scanState === 'SCANNING' && (
          <div className="flex-1 bg-slate-900 flex flex-col">
            <div className="flex-1 relative">
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
                styles={{ container: { width: '100%', minHeight: '360px' } }}
              />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-56 border-2 border-emerald-400 rounded-2xl">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-2xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-2xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-2xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-2xl" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-white">
              <Button onClick={resetScanner} variant="outline" className="w-full h-11">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* VERIFYING / CONFIRMING STATE */}
        {(scanState === 'VERIFYING' || scanState === 'CONFIRMING') && (
          <div className="flex-1 flex flex-col items-center justify-center bg-white p-8 text-center animate-in fade-in duration-300">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">
              {scanState === 'VERIFYING' ? 'Verifying Pass…' : 'Logging Entry…'}
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              {scanState === 'VERIFYING' ? 'Checking validity and permissions' : 'Creating visitor log'}
            </p>
          </div>
        )}

        {/* VERIFIED STATE — show details, await guard confirmation */}
        {scanState === 'VERIFIED' && verifiedPass && (
          <div className="flex-1 flex flex-col bg-amber-50 animate-in zoom-in-95 duration-300">
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-600">
                <QrCode className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-amber-800 mb-1">Valid Pass</h2>
              <p className="text-amber-600 text-sm font-medium">Confirm to log entry</p>

              <div className="mt-6 bg-white p-6 rounded-xl shadow-sm w-full max-w-sm text-left border border-amber-100 space-y-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Visitor Name</p>
                  <p className="text-lg font-bold text-slate-900">{verifiedPass.preReg.visitor_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Type</p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {typeLabel[verifiedPass.preReg.visitor_type] ?? verifiedPass.preReg.visitor_type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">House No.</p>
                    <p className="text-lg font-bold text-slate-900">No. {verifiedPass.houseNumber}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Reason</p>
                  <p className="text-sm text-slate-700">{verifiedPass.preReg.visit_reason}</p>
                </div>
                {verifiedPass.preReg.vehicle_number && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                    <span className="text-xs text-slate-500 uppercase">Vehicle No.</span>
                    <span className="font-mono font-bold text-slate-900">{verifiedPass.preReg.vehicle_number}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 bg-white border-t border-amber-100 flex gap-3">
              <Button onClick={resetScanner} variant="outline" className="flex-1 h-12 border-slate-300">
                Deny / Cancel
              </Button>
              <Button onClick={confirmEntry} className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                Confirm Entry
              </Button>
            </div>
          </div>
        )}

        {/* SUCCESS STATE */}
        {scanState === 'SUCCESS' && verifiedPass && (
          <div className="flex-1 flex flex-col bg-emerald-50 animate-in zoom-in-95 duration-300">
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600 shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold text-emerald-800 mb-1">Access Granted</h2>
              <p className="text-emerald-600 font-medium">Entry logged successfully</p>

              <div className="mt-8 bg-white p-6 rounded-xl shadow-sm w-full max-w-sm text-left border border-emerald-100 space-y-3">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Visitor</p>
                  <p className="text-lg font-bold text-slate-900">{verifiedPass.preReg.visitor_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Type</p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {typeLabel[verifiedPass.preReg.visitor_type]}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">House No.</p>
                    <p className="text-lg font-bold text-slate-900">No. {verifiedPass.houseNumber}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white border-t border-emerald-100">
              <Button onClick={resetScanner} className="w-full h-12 text-lg bg-slate-900 hover:bg-slate-800 text-white">
                Scan Next Visitor
              </Button>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {scanState === 'ERROR' && (
          <div className="flex-1 flex flex-col bg-red-50 animate-in zoom-in-95 duration-300">
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600 shadow-sm">
                <XCircle className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold text-red-800 mb-1">Access Denied</h2>
              <p className="text-red-600 font-medium">Pass invalid or expired</p>

              <div className={cn(
                'mt-8 bg-white p-4 rounded-xl shadow-sm w-full max-w-sm border border-red-100 flex items-start gap-3',
              )}>
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600 text-left">{errorMessage || 'This pass is invalid. Do not allow entry. Contact the resident for verification.'}</p>
              </div>
            </div>
            <div className="p-4 bg-white border-t border-red-100">
              <Button onClick={resetScanner} variant="outline" className="w-full h-12 text-lg border-slate-300 text-slate-700 hover:bg-slate-50">
                Try Again
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
