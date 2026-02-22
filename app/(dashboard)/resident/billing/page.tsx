'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Wallet,
  Building2,
  Receipt,
  Landmark,
  History,
  Lock,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Invoice } from '@/lib/types';

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'FPX' | 'CARD' | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingInvoices = invoices.filter(i => i.status === 'PENDING' || i.status === 'OVERDUE');
  const historyInvoices = invoices.filter(i => i.status === 'PAID');

  const totalOutstanding = pendingInvoices.reduce((acc, curr) => acc + curr.amount, 0);

  const handlePay = (id: string) => {
    if (!selectedPaymentMethod) {
      alert('Please select a payment method first.');
      return;
    }
    setProcessingId(id);
    setTimeout(() => {
      setInvoices(prev =>
        prev.map(inv => (inv.id === id ? { ...inv, status: 'PAID' as const } : inv))
      );
      setProcessingId(null);
      setSelectedPaymentMethod(null);
    }, 2000);
  };

  const formatMonth = (month: string) => {
    const [year, m] = month.split('-');
    const date = new Date(Number(year), Number(m) - 1);
    return date.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Maintenance Fee</h2>
        <p className="text-slate-500 mt-1">View and pay your monthly maintenance fees.</p>
      </div>

      {/* Summary Strip — 3 stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Outstanding Balance */}
        <Card
          className={cn(
            'border shadow-sm',
            totalOutstanding > 0 ? 'bg-red-50/50 border-red-100' : 'bg-emerald-50/50 border-emerald-100'
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  totalOutstanding > 0 ? 'bg-white text-red-600' : 'bg-white text-emerald-600'
                )}
              >
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Outstanding</p>
                <p
                  className={cn(
                    'text-xl font-bold',
                    totalOutstanding > 0 ? 'text-red-700' : 'text-emerald-700'
                  )}
                >
                  RM {totalOutstanding.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Fee */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Monthly Fee</p>
                <p className="text-xl font-bold text-slate-900">RM 70.00</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Payment */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Last Payment</p>
                {historyInvoices.length > 0 ? (
                  <p className="text-xl font-bold text-slate-900">
                    {formatMonth(historyInvoices[0].month)}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400">No payments yet</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex p-1 bg-slate-100 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('pending')}
          className={cn(
            'px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 flex items-center gap-2',
            activeTab === 'pending'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <AlertCircle className="w-4 h-4" />
          Pending
          {pendingInvoices.length > 0 && (
            <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {pendingInvoices.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            'px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 flex items-center gap-2',
            activeTab === 'history'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <History className="w-4 h-4" />
          Payment History
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === 'pending' ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
            {pendingInvoices.length > 0 ? (
              pendingInvoices.map(invoice => (
                <Card key={invoice.id} className="border-slate-200 shadow-sm">
                  <CardContent className="p-5 space-y-4">
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-slate-900">
                        {formatMonth(invoice.month)}
                      </h4>
                      <Badge
                        variant={invoice.status === 'OVERDUE' ? 'destructive' : 'secondary'}
                        className={cn(
                          invoice.status === 'OVERDUE'
                            ? 'bg-red-100 text-red-700 hover:bg-red-100 border-transparent'
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-transparent'
                        )}
                      >
                        {invoice.status === 'OVERDUE' ? 'Overdue' : 'Pending'}
                      </Badge>
                    </div>

                    <p className="text-sm text-slate-500">
                      Due: {new Date(invoice.dueDate).toLocaleDateString('en-MY', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>

                    {/* Breakdown */}
                    <div className="bg-slate-50 rounded-lg p-4 space-y-2 border border-slate-100">
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
                      <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between text-sm font-semibold text-slate-900">
                        <span>Total</span>
                        <span>RM {invoice.amount.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase mb-2">
                        Payment Method
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setSelectedPaymentMethod('FPX')}
                          className={cn(
                            'flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all',
                            selectedPaymentMethod === 'FPX'
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          )}
                        >
                          <Landmark className="w-4 h-4" /> FPX / Online Banking
                        </button>
                        <button
                          onClick={() => setSelectedPaymentMethod('CARD')}
                          className={cn(
                            'flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all',
                            selectedPaymentMethod === 'CARD'
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          )}
                        >
                          <CreditCard className="w-4 h-4" /> Credit / Debit Card
                        </button>
                      </div>
                    </div>

                    {/* Pay Button */}
                    <Button
                      className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all"
                      onClick={() => handlePay(invoice.id)}
                      disabled={!!processingId || !selectedPaymentMethod}
                    >
                      {processingId === invoice.id
                        ? 'Processing...'
                        : `Pay RM ${invoice.amount.toFixed(2)}`}
                    </Button>
                    <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
                      <Lock className="w-3 h-3" /> Secured by HerePay
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              /* Empty state */
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">You&apos;re all caught up!</h3>
                <p className="text-slate-500 mt-1 text-sm">No pending maintenance fees.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            {historyInvoices.length > 0 ? (
              <>
                {/* Desktop table */}
                <Card className="border-slate-200 shadow-sm hidden md:block overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr>
                          <th className="px-5 py-3">Month</th>
                          <th className="px-5 py-3">Date Paid</th>
                          <th className="px-5 py-3">Amount</th>
                          <th className="px-5 py-3 text-right">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {historyInvoices.map(invoice => (
                          <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3 font-medium text-slate-900">
                              {formatMonth(invoice.month)}
                            </td>
                            <td className="px-5 py-3 text-slate-600">
                              {invoice.dueDate
                                ? new Date(invoice.dueDate).toLocaleDateString('en-MY', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </td>
                            <td className="px-5 py-3 font-medium text-slate-900">
                              RM {invoice.amount.toFixed(2)}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <button className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-medium text-xs hover:underline px-2 py-1 rounded hover:bg-indigo-50 transition-colors">
                                <Download className="w-3.5 h-3.5" /> Receipt
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Mobile cards */}
                <div className="space-y-3 md:hidden">
                  {historyInvoices.map(invoice => (
                    <Card key={invoice.id} className="border-slate-200 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-slate-900">
                            {formatMonth(invoice.month)}
                          </span>
                          <span className="font-semibold text-slate-900">
                            RM {invoice.amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500">
                            Paid:{' '}
                            {invoice.dueDate
                              ? new Date(invoice.dueDate).toLocaleDateString('en-MY', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                          </span>
                          <button className="inline-flex items-center gap-1 text-indigo-600 text-xs font-medium hover:underline">
                            <Download className="w-3.5 h-3.5" /> Receipt
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              /* Empty state */
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-7 h-7 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No payment history yet</h3>
                <p className="text-slate-500 mt-1 text-sm">
                  Your completed payments will appear here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
