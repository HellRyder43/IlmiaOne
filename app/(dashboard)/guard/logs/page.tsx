'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, ArrowUpRight, ArrowDownRight, Car, User, Truck, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock Data
interface LogEntry {
  id: number;
  name: string;
  type: 'VISITOR' | 'DELIVERY' | 'CONTRACTOR';
  unit: string;
  plate: string;
  timeIn: string;
  timeOut: string;
  status: 'INSIDE' | 'EXITED';
  date: string;
}

const logData: LogEntry[] = [
  { id: 1, name: 'Alice Smith', type: 'VISITOR', unit: 'No. 12', plate: 'WXX 1234', timeIn: '10:30 AM', timeOut: '-', status: 'INSIDE', date: 'Today' },
  { id: 2, name: 'FoodPanda', type: 'DELIVERY', unit: 'No. 5', plate: 'VAA 9988', timeIn: '10:15 AM', timeOut: '10:25 AM', status: 'EXITED', date: 'Today' },
  { id: 3, name: 'Tan Ah Hock', type: 'CONTRACTOR', unit: 'No. 88', plate: 'BGT 5544', timeIn: '09:00 AM', timeOut: '-', status: 'INSIDE', date: 'Today' },
  { id: 4, name: 'Sarah J.', type: 'VISITOR', unit: 'No. 2', plate: '-', timeIn: '08:45 AM', timeOut: '10:00 AM', status: 'EXITED', date: 'Today' },
  { id: 5, name: 'GrabExpress', type: 'DELIVERY', unit: 'No. 10', plate: 'WYY 7766', timeIn: '04:30 PM', timeOut: '04:45 PM', status: 'EXITED', date: 'Yesterday' },
];

export default function EntryLogsPage() {
  const [filter, setFilter] = useState<'ALL' | 'INSIDE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logData.filter(log => {
    const matchesFilter = filter === 'INSIDE' ? log.status === 'INSIDE' : true;
    const matchesSearch =
      log.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.unit.includes(searchTerm) ||
      log.plate.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    return status === 'INSIDE'
      ? <Badge variant="default" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-transparent">Inside</Badge>
      : <Badge variant="secondary" className="bg-slate-100 text-slate-500">Exited</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DELIVERY': return <Truck className="w-3.5 h-3.5" />;
      case 'CONTRACTOR': return <Car className="w-3.5 h-3.5" />;
      default: return <User className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Entry Logs</h2>
          <p className="text-slate-500 mt-1">Audit trail of all visitor movements.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-white">
            <Calendar className="w-4 h-4" /> Select Date
          </Button>
          <Button variant="outline" className="gap-2 bg-white">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setFilter('ALL')}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                filter === 'ALL' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              All Entries
            </button>
            <button
              onClick={() => setFilter('INSIDE')}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                filter === 'INSIDE' ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-emerald-700"
              )}
            >
              Currently Inside
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, house no., or plate..."
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
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Visitor Details</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">House No.</th>
                <th className="px-6 py-4">Time In</th>
                <th className="px-6 py-4">Time Out</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    {getStatusBadge(log.status)}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{log.name}</p>
                    {log.plate !== '-' && (
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{log.plate}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-md bg-slate-100 text-slate-600">
                        {getTypeIcon(log.type)}
                      </span>
                      <span className="text-xs font-medium text-slate-600">{log.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">{log.unit}</td>
                  <td className="px-6 py-4 text-emerald-600 font-medium">
                    <div className="flex items-center gap-1.5">
                      <ArrowDownRight className="w-3.5 h-3.5" /> {log.timeIn}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {log.timeOut !== '-' ? (
                      <div className="flex items-center gap-1.5">
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" /> {log.timeOut}
                      </div>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {log.status === 'INSIDE' && (
                      <Button variant="outline" size="sm" className="h-8 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                        Check Out
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              No records found.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
