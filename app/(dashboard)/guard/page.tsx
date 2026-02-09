'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, FileText, Users, Clock, AlertTriangle, ShieldCheck, Truck, Car } from 'lucide-react';
import Link from 'next/link';

export default function GuardDashboard() {
  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Guard Station Dashboard</h2>
          <p className="text-slate-500 mt-1">Shift A • Main Gate • {new Date().toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
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
            <p className="text-3xl font-bold text-slate-900">24</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2 text-slate-500">
              <Truck className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Deliveries</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">12</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2 text-slate-500">
              <Car className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Total Entries</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">86</p>
          </CardContent>
        </Card>
        <Card className="border-red-100 bg-red-50/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Overstayed</span>
            </div>
            <p className="text-3xl font-bold text-red-700">2</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Primary Actions */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-900">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4">
            <Link href="/guard/scanner">
              <Card className="hover:shadow-md transition-shadow hover:border-emerald-200 group cursor-pointer border-slate-200">
                <CardContent className="p-6 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Scan Entry</h4>
                    <p className="text-slate-500 mt-1">Open camera scanner for Visitor & Delivery passes.</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/guard/logs">
              <Card className="hover:shadow-md transition-shadow hover:border-blue-200 group cursor-pointer border-slate-200">
                <CardContent className="p-6 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">View Entry Logs</h4>
                    <p className="text-slate-500 mt-1">Check history, check-out visitors manually.</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Alerts / Notices */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-900">Important Notices</h3>
          <Card className="border-slate-200 shadow-sm h-full">
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                <div className="p-4 flex gap-4 hover:bg-slate-50">
                  <div className="mt-1">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Blacklisted Vehicle</p>
                    <p className="text-slate-600 text-sm mt-1">Plate <span className="font-mono font-bold bg-slate-100 px-1 rounded">WAA 1234</span> attempting entry. Deny access.</p>
                    <p className="text-xs text-slate-400 mt-2">Posted 2 hours ago</p>
                  </div>
                </div>
                <div className="p-4 flex gap-4 hover:bg-slate-50">
                  <div className="mt-1">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Road Repair Works</p>
                    <p className="text-slate-600 text-sm mt-1">Contractors paving the main road at Jalan Merbhau.</p>
                    <p className="text-xs text-slate-400 mt-2">Posted 4 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
