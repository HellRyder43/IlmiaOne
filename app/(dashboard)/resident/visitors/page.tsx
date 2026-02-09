'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Share2,
  Clock,
  CalendarDays,
  User,
  Truck,
  Hammer,
  X,
  Copy,
  QrCode,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VisitorPass } from '@/lib/types';

const mockPasses: VisitorPass[] = [
  { id: 'v1', visitorName: 'Alice Smith', type: 'VISITOR', date: '2023-10-25', status: 'ACTIVE', qrCodeUrl: '' },
  { id: 'v2', visitorName: 'PosLaju Courier', type: 'DELIVERY', date: '2023-10-24', status: 'USED', qrCodeUrl: '' },
  { id: 'v3', visitorName: 'AirCond Service', type: 'CONTRACTOR', date: '2023-10-20', status: 'EXPIRED', qrCodeUrl: '' },
];

export default function VisitorsPage() {
  const [passes, setPasses] = useState<VisitorPass[]>(mockPasses);
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [newPass, setNewPass] = useState({
    name: '',
    type: 'VISITOR' as const,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const pass: VisitorPass = {
      id: Math.random().toString(36).substr(2, 9),
      visitorName: newPass.name,
      type: newPass.type,
      date: newPass.date,
      status: 'ACTIVE',
      qrCodeUrl: 'mock-url'
    };
    setPasses([pass, ...passes]);
    setIsCreating(false);
    setNewPass({ name: '', type: 'VISITOR', date: new Date().toISOString().split('T')[0], notes: '' });
  };

  const handleCopy = (id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DELIVERY': return <Truck className="w-4 h-4" />;
      case 'CONTRACTOR': return <Hammer className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DELIVERY': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'CONTRACTOR': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-purple-100 text-purple-700 border-purple-200';
    }
  };

  const filteredPasses = passes.filter(pass => {
    if (filter === 'ACTIVE') return pass.status === 'ACTIVE';
    if (filter === 'HISTORY') return pass.status !== 'ACTIVE';
    return true;
  });

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Visitor Access</h2>
          <p className="text-slate-500 mt-1">Generate QR codes for secure entry.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-lg flex">
             <button
               onClick={() => setFilter('ACTIVE')}
               className={cn(
                 "px-4 py-2 rounded-md text-sm font-medium transition-all",
                 filter === 'ACTIVE' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
               )}
             >
               Active
             </button>
             <button
               onClick={() => setFilter('HISTORY')}
               className={cn(
                 "px-4 py-2 rounded-md text-sm font-medium transition-all",
                 filter === 'HISTORY' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
               )}
             >
               History
             </button>
          </div>
          <Button onClick={() => setIsCreating(true)} className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> New Pass
          </Button>
        </div>
      </div>

      {/* Create Pass Form */}
      {isCreating && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <Card className="border-primary-100 bg-gradient-to-br from-white to-primary-50/30 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary-500"></div>
            <CardContent className="pt-8 pb-8 px-8">
              <div className="flex justify-between items-start mb-6">
                 <div>
                   <h3 className="text-lg font-bold text-slate-900">New Visitor Registration</h3>
                   <p className="text-slate-500 text-sm">Fill in the details to generate a single-use QR code.</p>
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-red-500">
                   <X className="w-5 h-5" />
                 </Button>
              </div>

              <form onSubmit={handleCreate} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Visitor Name</label>
                    <div className="relative">
                      <input
                        required
                        type="text"
                        className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm"
                        placeholder="e.g., John Doe"
                        value={newPass.name}
                        onChange={e => setNewPass({...newPass, name: e.target.value})}
                      />
                      <User className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-medium text-slate-700">Visitor Type</label>
                     <div className="grid grid-cols-3 gap-3">
                        {(['VISITOR', 'DELIVERY', 'CONTRACTOR'] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setNewPass({...newPass, type})}
                            className={cn(
                              "flex flex-col items-center justify-center gap-1 py-2 rounded-lg border text-xs font-medium transition-all",
                              newPass.type === type
                                ? "bg-primary-50 border-primary-500 text-primary-700"
                                : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            {getTypeIcon(type)}
                            <span className="capitalize">{type.toLowerCase()}</span>
                          </button>
                        ))}
                     </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Expected Arrival Date</label>
                    <div className="relative">
                      <input
                        required
                        type="date"
                        className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm"
                        value={newPass.date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setNewPass({...newPass, date: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-medium text-slate-700">Notes (Optional)</label>
                     <input
                        type="text"
                        className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm"
                        placeholder="e.g., Car Plate WXX 1234"
                        value={newPass.notes}
                        onChange={e => setNewPass({...newPass, notes: e.target.value})}
                      />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                   <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                   <Button type="submit" className="px-8 bg-slate-900 hover:bg-slate-800">Generate Pass</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!isCreating && filteredPasses.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <QrCode className="w-8 h-8 text-slate-400" />
           </div>
           <h3 className="text-lg font-medium text-slate-900">No {filter.toLowerCase()} passes found</h3>
           <p className="text-slate-500 mt-1 max-w-sm mx-auto">
             {filter === 'ACTIVE'
               ? "You don't have any active visitor passes. Create one to invite guests!"
               : "No history available yet."}
           </p>
           {filter === 'ACTIVE' && (
             <Button onClick={() => setIsCreating(true)} className="mt-6">
               Create First Pass
             </Button>
           )}
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPasses.map((pass) => (
          <div key={pass.id} className="group relative flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Status Strip */}
            <div className={cn(
              "h-1.5 w-full",
              pass.status === 'ACTIVE' ? "bg-green-500" : "bg-slate-300"
            )} />

            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                 <div className={cn(
                   "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border",
                   getTypeColor(pass.type)
                 )}>
                    {getTypeIcon(pass.type)}
                    {pass.type}
                 </div>

                 <Badge variant={pass.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-[10px]">
                   {pass.status}
                 </Badge>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-1">{pass.visitorName}</h3>
              <div className="flex items-center text-slate-500 text-sm mb-6">
                 <CalendarDays className="w-4 h-4 mr-2" />
                 {new Date(pass.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </div>

              {/* Action Row */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-2 text-xs h-9" onClick={() => handleCopy(pass.id)}>
                   {copiedId === pass.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                   {copiedId === pass.id ? "Copied" : "Copy Link"}
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-2 text-xs h-9">
                   <Share2 className="w-3.5 h-3.5" /> Share
                </Button>
              </div>
            </div>

            {/* Ticket Perforation */}
            <div className="relative h-px bg-slate-200 mx-4">
               <div className="absolute -left-6 -top-2 w-4 h-4 rounded-full bg-slate-50 border-r border-slate-200"></div>
               <div className="absolute -right-6 -top-2 w-4 h-4 rounded-full bg-slate-50 border-l border-slate-200"></div>
            </div>

            {/* QR Section */}
            <div className="bg-slate-50 p-6 flex items-center justify-between">
               <div className="text-xs text-slate-400">
                  <p className="font-mono">ID: {pass.id.toUpperCase()}</p>
                  <p className="mt-1">Valid for single entry</p>
               </div>
               <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center">
                  <QrCode className="w-full h-full text-slate-900" />
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
