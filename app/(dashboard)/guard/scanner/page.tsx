'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, Camera, Search, CheckCircle2, XCircle, AlertTriangle, ArrowRight, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';

type ScanState = 'IDLE' | 'SCANNING' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

interface ScanResult {
  visitorName: string;
  type: string;
  unit: string;
  plate: string;
  entryTime: string;
}

export default function ScannerPage() {
  const [scanState, setScanState] = useState<ScanState>('IDLE');
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Mock Scanning Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (scanState === 'SCANNING') {
      timer = setTimeout(() => {
        setScanState('PROCESSING');
      }, 2000);
    }
    if (scanState === 'PROCESSING') {
      timer = setTimeout(() => {
        // Randomly succeed or fail for demo
        const isSuccess = Math.random() > 0.2;
        if (isSuccess) {
          setScanResult({
            visitorName: 'Alice Smith',
            type: 'VISITOR',
            unit: 'No. 12',
            plate: 'WXX 1234',
            entryTime: 'Now'
          });
          setScanState('SUCCESS');
        } else {
          setScanState('ERROR');
        }
      }, 1500);
    }
    return () => clearTimeout(timer);
  }, [scanState]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode) setScanState('PROCESSING');
  };

  const resetScanner = () => {
    setScanState('IDLE');
    setScanResult(null);
    setManualCode('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Access Control Scanner</h2>
        <p className="text-slate-500">Scan QR code or enter pass ID manually.</p>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-lg relative min-h-[500px] flex flex-col">
        {/* Scanner Viewfinder Area */}
        {scanState === 'IDLE' || scanState === 'SCANNING' ? (
          <div className="flex-1 bg-slate-900 relative flex flex-col items-center justify-center p-6">
            {scanState === 'IDLE' ? (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Camera className="w-10 h-10" />
                </div>
                <Button
                  size="lg"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-lg h-14"
                  onClick={() => setScanState('SCANNING')}
                >
                  <QrCode className="w-6 h-6 mr-2" /> Start Camera
                </Button>
                <p className="text-slate-500 text-sm">Ensure adequate lighting for best results.</p>
              </div>
            ) : (
              // Scanning Animation State
              <div className="relative w-full max-w-xs aspect-square border-2 border-white/30 rounded-3xl overflow-hidden">
                <div className="absolute inset-0 border-2 border-emerald-500 rounded-3xl animate-pulse"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-[scan_2s_ease-in-out_infinite]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white/80 font-medium bg-black/50 px-3 py-1 rounded-full text-sm">Scanning...</p>
                </div>
                {/* Mock Camera Feed Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 -z-10"></div>
              </div>
            )}

            {/* Manual Entry Toggle Section */}
            {scanState === 'IDLE' && (
              <div className="absolute bottom-0 left-0 right-0 bg-white p-6 rounded-t-2xl border-t border-slate-200">
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Keyboard className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700">Manual Entry</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Pass ID (e.g. VIS-9921)"
                      className="flex-1 h-12 rounded-lg border border-slate-300 bg-white px-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all uppercase font-mono shadow-sm"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                    />
                    <Button type="submit" size="lg" className="h-12 w-12 p-0" disabled={!manualCode}>
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : null}

        {/* Processing State */}
        {scanState === 'PROCESSING' && (
          <div className="flex-1 flex flex-col items-center justify-center bg-white p-8 text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-semibold text-slate-900">Verifying Pass...</h3>
            <p className="text-slate-500">Checking validity and permissions</p>
          </div>
        )}

        {/* Success State */}
        {scanState === 'SUCCESS' && scanResult && (
          <div className="flex-1 flex flex-col bg-emerald-50 animate-in zoom-in-95 duration-300">
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600 shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold text-emerald-800 mb-1">Access Granted</h2>
              <p className="text-emerald-600 font-medium">Valid Pass</p>

              <div className="mt-8 bg-white p-6 rounded-xl shadow-sm w-full max-w-sm text-left border border-emerald-100">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Visitor Name</p>
                    <p className="text-lg font-bold text-slate-900">{scanResult.visitorName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Type</p>
                      <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">
                        {scanResult.type}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">House No.</p>
                      <p className="text-lg font-bold text-slate-900">{scanResult.unit}</p>
                    </div>
                  </div>
                  {scanResult.plate && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                      <span className="text-xs text-slate-500 uppercase">Vehicle No.</span>
                      <span className="font-mono font-bold text-slate-900">{scanResult.plate}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 bg-white border-t border-emerald-100">
              <Button onClick={resetScanner} className="w-full h-12 text-lg bg-slate-900 hover:bg-slate-800">
                Scan Next Visitor
              </Button>
            </div>
          </div>
        )}

        {/* Error State */}
        {scanState === 'ERROR' && (
          <div className="flex-1 flex flex-col bg-red-50 animate-in zoom-in-95 duration-300">
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600 shadow-sm">
                <XCircle className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold text-red-800 mb-1">Access Denied</h2>
              <p className="text-red-600 font-medium">Invalid or Expired Pass</p>

              <div className="mt-8 bg-white p-4 rounded-xl shadow-sm w-full max-w-sm border border-red-100 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-sm text-slate-600 text-left">
                  This pass expired on <span className="font-bold">Oct 24, 2023</span>. Do not allow entry. Contact unit owner for verification.
                </p>
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
  );
}
