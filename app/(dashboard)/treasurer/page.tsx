'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownRight, DollarSign, Users, AlertCircle, FileText, Info } from 'lucide-react';

export default function TreasurerOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Treasurer Dashboard</h1>
        <p className="text-slate-500 mt-2">Welcome back. Here is the financial health of the community.</p>
      </div>

      {/* Mock Data Banner */}
      <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Info className="h-4 w-4 shrink-0" />
        <span>This page currently shows mock data. Live billing &amp; payment features will be available soon.</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Funds Available</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-2">RM 245,890.00</h3>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 mt-2 bg-emerald-50 px-2 py-1 rounded-full">
                  <ArrowUpRight className="w-3 h-3" /> +4.5% this month
                </span>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Collection Rate (Dec)</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-2">82%</h3>
                <p className="text-xs text-slate-500 mt-2">156/190 Houses Paid</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '82%' }}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
           <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Pending Actions</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-2">5</h3>
                <p className="text-xs text-slate-500 mt-2">Invoices awaiting approval</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
           <Card>
             <CardHeader className="flex flex-row items-center justify-between">
               <CardTitle>Recent Transactions</CardTitle>
               <Link href="/treasurer/reports"><Button variant="ghost" size="sm" className="text-primary-600">View All</Button></Link>
             </CardHeader>
             <CardContent>
               <div className="space-y-4">
                 {[1,2,3,4].map((i) => (
                   <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${i % 2 === 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                           {i % 2 === 0 ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                           <p className="font-medium text-slate-900">{i % 2 === 0 ? 'Security Services - Invoice #9921' : 'Maintenance Fee - House No. 12'}</p>
                           <p className="text-xs text-slate-500">Today, 10:30 AM</p>
                        </div>
                      </div>
                      <span className={`font-bold ${i % 2 === 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {i % 2 === 0 ? '-' : '+'} RM {i % 2 === 0 ? '450.00' : '145.00'}
                      </span>
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
           <Card className="bg-slate-50 border-slate-200">
             <CardHeader>
               <CardTitle className="text-lg">Quick Actions</CardTitle>
             </CardHeader>
             <CardContent className="space-y-3">
               <Button className="w-full justify-start gap-2 bg-white text-slate-900 border border-slate-200 hover:bg-slate-100 shadow-sm">
                 <FileText className="w-4 h-4 text-slate-500" /> Generate Invoice
               </Button>
               <Button className="w-full justify-start gap-2 bg-white text-slate-900 border border-slate-200 hover:bg-slate-100 shadow-sm">
                 <DollarSign className="w-4 h-4 text-slate-500" /> Record Expense
               </Button>
               <Link href="/treasurer/defaulters" className="block">
                 <Button className="w-full justify-start gap-2 bg-white text-slate-900 border border-slate-200 hover:bg-slate-100 shadow-sm">
                   <Users className="w-4 h-4 text-slate-500" /> Manage Defaulters
                 </Button>
               </Link>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
