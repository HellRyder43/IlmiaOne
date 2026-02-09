'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Download,
  History,
  AlertCircle,
  CheckCircle2,
  Wallet,
  Building2,
  Receipt,
  Landmark,
  FileText,
  Phone,
  Mail,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DetailedInvoice } from '@/lib/types';

const mockInvoices: DetailedInvoice[] = [
  {
    id: 'INV-2023-12',
    month: 'December 2023',
    amount: 145.50,
    status: 'PENDING',
    dueDate: '2023-12-31',
    breakdown: { maintenance: 130.00, sinkingFund: 13.00, water: 2.50 }
  },
  {
    id: 'INV-2023-11',
    month: 'November 2023',
    amount: 143.00,
    status: 'PAID',
    dueDate: '2023-11-30',
    breakdown: { maintenance: 130.00, sinkingFund: 13.00 }
  },
  {
    id: 'INV-2023-10',
    month: 'October 2023',
    amount: 143.00,
    status: 'PAID',
    dueDate: '2023-10-31',
    breakdown: { maintenance: 130.00, sinkingFund: 13.00 }
  },
  {
    id: 'INV-2023-09',
    month: 'September 2023',
    amount: 143.00,
    status: 'PAID',
    dueDate: '2023-09-30',
    breakdown: { maintenance: 130.00, sinkingFund: 13.00 }
  },
];

export default function BillingPage() {
  const [invoices, setInvoices] = useState<DetailedInvoice[]>(mockInvoices);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'FPX' | 'CARD' | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingInvoices = invoices.filter(i => i.status === 'PENDING' || i.status === 'OVERDUE');
  const historyInvoices = invoices.filter(i => i.status === 'PAID');

  const totalOutstanding = pendingInvoices.reduce((acc, curr) => acc + curr.amount, 0);

  const handlePay = (id: string) => {
    if (!selectedPaymentMethod) {
      alert("Please select a payment method first.");
      return;
    }
    setProcessingId(id);
    setTimeout(() => {
      setInvoices(prev => prev.map(inv =>
        inv.id === id ? { ...inv, status: 'PAID' as const } : inv
      ));
      setProcessingId(null);
      setSelectedPaymentMethod(null);
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Hub</h2>
          <p className="text-slate-500 mt-1">Manage your property payments and records.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" className="gap-2 text-slate-600 bg-white shadow-sm border-slate-200">
             <FileText className="w-4 h-4" /> Statement
           </Button>
           <Button variant="outline" className="gap-2 text-slate-600 bg-white shadow-sm border-slate-200">
             <AlertCircle className="w-4 h-4" /> Report Issue
           </Button>
        </div>
      </div>

      {/* Stats Overview Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Outstanding Card */}
        <div className={cn(
          "relative overflow-hidden rounded-2xl border p-6 shadow-sm transition-all",
          totalOutstanding > 0
            ? "bg-red-50/50 border-red-100"
            : "bg-emerald-50/50 border-emerald-100"
        )}>
          <div className="flex justify-between items-start mb-4">
            <div className={cn(
              "p-2.5 rounded-xl shadow-sm",
              totalOutstanding > 0 ? "bg-white text-red-600" : "bg-white text-emerald-600"
            )}>
              <Wallet className="w-6 h-6" />
            </div>
            {totalOutstanding > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Due Soon
              </span>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total Outstanding</p>
            <h3 className={cn("text-3xl font-bold tracking-tight", totalOutstanding > 0 ? "text-red-700" : "text-emerald-700")}>
              RM {totalOutstanding.toFixed(2)}
            </h3>
          </div>
        </div>

        {/* Monthly Commitment */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shadow-sm border border-blue-100">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Monthly Fee</p>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">RM 143.00</h3>
          </div>
        </div>

        {/* Last Payment */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 shadow-sm border border-purple-100">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Last Payment</p>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Nov 28</h3>
            <p className="text-xs text-slate-400">Receipt #992812</p>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">

        {/* Left Column: Bills & History (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Tabs Navigation */}
          <div className="flex p-1 bg-slate-100/80 rounded-xl backdrop-blur-sm w-fit">
            <button
              onClick={() => setActiveTab('pending')}
              className={cn(
                "px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2",
                activeTab === 'pending'
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              )}
            >
              <AlertCircle className="w-4 h-4" />
              Pending Bills
              {pendingInvoices.length > 0 && (
                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs ml-1">
                  {pendingInvoices.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                "px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2",
                activeTab === 'history'
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              )}
            >
              <History className="w-4 h-4" />
              History
            </button>
          </div>

          {/* Tab Content Area */}
          <div className="min-h-[400px]">
            {activeTab === 'pending' ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                {pendingInvoices.length > 0 ? (
                  pendingInvoices.map(invoice => (
                    <Card key={invoice.id} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row">
                        {/* Invoice Details */}
                        <div className="flex-1 p-6">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-xl font-bold text-slate-900">{invoice.month}</h4>
                                <Badge variant="warning">Unpaid</Badge>
                              </div>
                              <p className="text-sm text-slate-500">Due Date: <span className="font-medium text-slate-700">{new Date(invoice.dueDate).toLocaleDateString()}</span></p>
                            </div>
                            <div className="text-right">
                               <p className="text-sm text-slate-500">Total Amount</p>
                               <p className="text-2xl font-bold text-slate-900">RM {invoice.amount.toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="bg-slate-50 rounded-lg p-4 mb-6 space-y-2 border border-slate-100">
                            <div className="flex justify-between text-sm text-slate-600">
                              <span>Maintenance Fee</span>
                              <span>RM {invoice.breakdown.maintenance.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-600">
                              <span>Sinking Fund (10%)</span>
                              <span>RM {invoice.breakdown.sinkingFund.toFixed(2)}</span>
                            </div>
                            {invoice.breakdown.water && (
                               <div className="flex justify-between text-sm text-slate-600">
                                 <span>Water Charges</span>
                                 <span>RM {invoice.breakdown.water.toFixed(2)}</span>
                               </div>
                            )}
                          </div>

                          {/* Payment Method Selection */}
                          <div>
                             <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Select Payment Method</p>
                             <div className="grid grid-cols-2 gap-3">
                                <button
                                  onClick={() => setSelectedPaymentMethod('FPX')}
                                  className={cn(
                                    "flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all",
                                    selectedPaymentMethod === 'FPX'
                                      ? "bg-primary-50 border-primary-500 text-primary-700 ring-1 ring-primary-500"
                                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                  )}
                                >
                                  <Landmark className="w-4 h-4" /> FPX / Online Banking
                                </button>
                                <button
                                  onClick={() => setSelectedPaymentMethod('CARD')}
                                  className={cn(
                                    "flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all",
                                    selectedPaymentMethod === 'CARD'
                                      ? "bg-primary-50 border-primary-500 text-primary-700 ring-1 ring-primary-500"
                                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                  )}
                                >
                                  <CreditCard className="w-4 h-4" /> Credit / Debit Card
                                </button>
                             </div>
                          </div>
                        </div>

                        {/* Action Side */}
                        <div className="p-6 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-100 flex flex-col justify-center items-center md:w-56">
                           <Button
                             className="w-full h-11 shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all hover:scale-[1.02]"
                             onClick={() => handlePay(invoice.id)}
                             disabled={!!processingId || !selectedPaymentMethod}
                           >
                             {processingId === invoice.id ? 'Processing...' : 'Pay Now'}
                           </Button>
                           <p className="text-[10px] text-slate-400 text-center mt-3 flex items-center gap-1">
                             <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Secured by HerePay
                           </p>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">All caught up!</h3>
                    <p className="text-slate-500 mt-2">You have no pending maintenance fees.</p>
                  </div>
                )}
              </div>
            ) : (
              <Card className="overflow-hidden border-slate-200 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                      <tr>
                        <th className="px-6 py-4">Invoice ID</th>
                        <th className="px-6 py-4">Month</th>
                        <th className="px-6 py-4">Date Paid</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {historyInvoices.map(invoice => (
                        <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-slate-500">{invoice.id}</td>
                          <td className="px-6 py-4 font-medium text-slate-900">{invoice.month}</td>
                          <td className="px-6 py-4 text-slate-600">Nov 28, 2023</td>
                          <td className="px-6 py-4 font-medium">RM {invoice.amount.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right">
                            <button className="inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700 font-medium text-xs hover:underline px-3 py-1.5 rounded hover:bg-primary-50 transition-colors">
                              <Receipt className="w-3.5 h-3.5" /> Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Right Column: Account & Support (1/3) */}
        <div className="space-y-6">

          {/* Digital Membership Card Style */}
          <div className="rounded-2xl overflow-hidden shadow-lg relative group">
             {/* Abstract Background */}
             <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800"></div>
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>

             <CardContent className="relative p-6 text-white min-h-[200px] flex flex-col justify-between">
                <div className="flex justify-between items-start">
                   <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                      <Building2 className="w-5 h-5 text-white" />
                   </div>
                   <span className="text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded-full backdrop-blur-sm">
                      Active Resident
                   </span>
                </div>

                <div className="space-y-4">
                   <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">House Number</p>
                      <p className="text-2xl font-mono font-bold tracking-tight">No. 12, Jln Merbhau</p>
                   </div>

                   <div className="flex justify-between items-end border-t border-white/10 pt-4">
                      <div>
                         <p className="text-xs text-slate-400">Account Name</p>
                         <p className="font-medium">John Doe</p>
                      </div>
                      <div className="text-right">
                         <p className="text-xs text-slate-400">JMB Reference</p>
                         <p className="font-mono text-sm">CIMB-8821</p>
                      </div>
                   </div>
                </div>
             </CardContent>
          </div>

          {/* Helper Links */}
          <Card className="border-none shadow-none bg-transparent">
             <h4 className="font-semibold text-slate-900 mb-3 px-1">Support & Help</h4>
             <div className="space-y-2">
                <button className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:border-primary-200 hover:shadow-sm transition-all group text-left">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 text-slate-500 rounded-lg group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                         <Phone className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Contact Treasury</span>
                   </div>
                   <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:border-primary-200 hover:shadow-sm transition-all group text-left">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 text-slate-500 rounded-lg group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                         <Mail className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Email Management</span>
                   </div>
                   <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
             </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
