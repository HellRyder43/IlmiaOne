'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search, Download, AlertTriangle, Mail, MessageCircle,
  FileWarning, ArrowUpRight, ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock Data
interface Defaulter {
  id: string;
  unit: string;
  owner: string;
  monthsOverdue: number;
  totalAmount: number;
  lastPayment: string;
  status: 'REMINDER_SENT' | 'NOTICE_ISSUED' | 'LEGAL_ACTION' | 'NO_ACTION';
  contact: string;
}

const mockDefaulters: Defaulter[] = [
  { id: '1', unit: 'No. 12', owner: 'Lim Wei Meng', monthsOverdue: 8, totalAmount: 1144.00, lastPayment: '2023-04-15', status: 'LEGAL_ACTION', contact: '+6012...' },
  { id: '2', unit: 'No. 5', owner: 'Sarah Ahmad', monthsOverdue: 4, totalAmount: 572.00, lastPayment: '2023-08-10', status: 'NOTICE_ISSUED', contact: '+6017...' },
  { id: '3', unit: 'No. 88', owner: 'John Doe', monthsOverdue: 3, totalAmount: 429.00, lastPayment: '2023-09-22', status: 'REMINDER_SENT', contact: '+6013...' },
  { id: '4', unit: 'No. 2', owner: 'Raj Kumar', monthsOverdue: 2, totalAmount: 286.00, lastPayment: '2023-10-05', status: 'NO_ACTION', contact: '+6019...' },
  { id: '5', unit: 'No. 20', owner: 'Tan Ah Hock', monthsOverdue: 2, totalAmount: 286.00, lastPayment: '2023-10-12', status: 'REMINDER_SENT', contact: '+6011...' },
  { id: '6', unit: 'No. 15', owner: 'Muthu Sammy', monthsOverdue: 1, totalAmount: 143.00, lastPayment: '2023-11-01', status: 'NO_ACTION', contact: '+6016...' },
];

export default function Defaulters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL'>('ALL');

  const filteredData = mockDefaulters.filter(d => {
    const matchesSearch = d.unit.includes(searchTerm) || d.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'CRITICAL' ? d.monthsOverdue >= 3 : true;
    return matchesSearch && matchesFilter;
  });

  const totalArrears = mockDefaulters.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const criticalCount = mockDefaulters.filter(d => d.monthsOverdue >= 3).length;

  const getSeverityColor = (months: number) => {
    if (months >= 6) return 'bg-red-100 text-red-700 border-red-200';
    if (months >= 3) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Defaulter Management</h2>
          <p className="text-slate-500 mt-1">Track outstanding arrears and manage collections.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2 bg-white">
             <Download className="w-4 h-4" /> Export List
           </Button>
           <Button className="gap-2 bg-red-600 hover:bg-red-700 text-white">
             <FileWarning className="w-4 h-4" /> Batch Notice
           </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-red-100 bg-red-50/30 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-red-600 uppercase tracking-wide">Total Arrears</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-2">RM {totalArrears.toLocaleString()}</h3>
                <p className="text-xs text-slate-500 mt-1">Accumulated from {mockDefaulters.length} houses</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg text-red-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Critical Defaulters</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-2">{criticalCount} Houses</h3>
                <p className="text-xs text-orange-600 mt-1 font-medium flex items-center">
                  <ArrowUpRight className="w-3 h-3 mr-1" /> &gt; 3 Months Overdue
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Collection Rate</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-2">82%</h3>
                <p className="text-xs text-slate-500 mt-1">Current Month Performance</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>
            {/* Simple progress bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4">
              <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '82%' }}></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div className="flex items-center gap-4">
             <h3 className="font-bold text-slate-900 text-lg">Defaulter List</h3>
             <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setFilter('ALL')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    filter === 'ALL' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('CRITICAL')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    filter === 'CRITICAL' ? "bg-white text-red-700 shadow-sm" : "text-slate-500 hover:text-red-700"
                  )}
                >
                  Critical Only
                </button>
             </div>
           </div>

           <div className="relative w-full max-w-sm">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input
               type="text"
               placeholder="Search house no. or owner..."
               className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm shadow-sm"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">House No.</th>
                <th className="px-6 py-4">Owner Name</th>
                <th className="px-6 py-4 text-center">Overdue</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4">Last Payment</th>
                <th className="px-6 py-4">Action Taken</th>
                <th className="px-6 py-4 text-center">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                   <td className="px-6 py-4 font-bold text-slate-900">{item.unit}</td>
                   <td className="px-6 py-4">
                     <div className="font-medium text-slate-900">{item.owner}</div>
                     <div className="text-xs text-slate-400">{item.contact}</div>
                   </td>
                   <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border",
                        getSeverityColor(item.monthsOverdue)
                      )}>
                        {item.monthsOverdue}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">mths</span>
                   </td>
                   <td className="px-6 py-4 text-right font-bold text-red-600">
                     RM {item.totalAmount.toLocaleString()}
                   </td>
                   <td className="px-6 py-4 text-slate-500 text-xs">
                     {item.lastPayment}
                   </td>
                   <td className="px-6 py-4">
                      <Badge variant="outline" className={cn(
                        "text-[10px]",
                        item.status === 'LEGAL_ACTION' ? "border-red-200 bg-red-50 text-red-700" :
                        item.status === 'NOTICE_ISSUED' ? "border-orange-200 bg-orange-50 text-orange-700" :
                        "border-slate-200 bg-slate-50 text-slate-600"
                      )}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                   </td>
                   <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="outline" size="icon" className="h-8 w-8 text-indigo-600 border-indigo-100 hover:bg-indigo-50" title="Send WhatsApp">
                           <MessageCircle className="w-4 h-4" />
                         </Button>
                         <Button variant="outline" size="icon" className="h-8 w-8 text-slate-600 hover:bg-slate-50" title="Send Email">
                           <Mail className="w-4 h-4" />
                         </Button>
                         <Button variant="outline" size="icon" className="h-8 w-8 text-red-600 border-red-100 hover:bg-red-50" title="Issue Notice">
                           <FileWarning className="w-4 h-4" />
                         </Button>
                      </div>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              No results found matching your criteria.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
