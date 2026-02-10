'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Wallet, QrCode, Calendar, CheckCircle2, Scan, Download } from 'lucide-react';
import type { Invoice } from '@/lib/types';

// Mock data for Dashboard view only
const dashboardInvoices: Invoice[] = [
  { id: 'INV-2023-12', houseId: '', month: 'December 2023', amount: 145.50, status: 'PENDING', dueDate: '2023-12-31', breakdown: { maintenance: 130.00, sinkingFund: 13.00, water: 2.50 } },
  { id: 'INV-2023-11', houseId: '', month: 'November 2023', amount: 143.00, status: 'PAID', dueDate: '2023-11-30', breakdown: { maintenance: 130.00, sinkingFund: 13.00 } },
  { id: 'INV-2023-10', houseId: '', month: 'October 2023', amount: 143.00, status: 'PAID', dueDate: '2023-10-31', breakdown: { maintenance: 130.00, sinkingFund: 13.00 } },
];

export default function ResidentDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Welcome back, John 👋</h1>
        <p className="text-slate-500 mt-2">Here's what's happening in your neighbourhood today.</p>
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
             <p className="text-sm text-slate-500 mt-1 mb-4">"Gotong Royong" cleanup this Saturday!</p>
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
  );
}
