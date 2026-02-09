'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import {
  Scan,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Wallet,
  User,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Activity } from '@/lib/types';

const activities: Activity[] = [
  { id: '1', type: 'VISITOR', title: 'Visitor Arrived', description: 'GrabFood Driver (Ali) has entered the guard house.', timestamp: '10:42 AM', metadata: { date: 'Today' } },
  { id: '2', type: 'SYSTEM', title: 'Login Detected', description: 'New login from iPhone 13.', timestamp: '09:15 AM', metadata: { date: 'Today' } },
  { id: '3', type: 'PAYMENT', title: 'Payment Successful', description: 'Maintenance Fees (Dec 2023) - RM 145.50', timestamp: '02:30 PM', metadata: { date: 'Yesterday' } },
  { id: '4', type: 'VISITOR', title: 'Visitor Registered', description: 'Pass created for Sarah (Sister).', timestamp: '11:00 AM', metadata: { date: 'Yesterday' } },
  { id: '5', type: 'MAINTENANCE', title: 'Community Notice', description: 'Water disruption alert for Jalan Merbhau.', timestamp: '09:00 AM', metadata: { date: 'Yesterday' } },
  { id: '6', type: 'MAINTENANCE', title: 'Event Reminder', description: 'Gotong Royong is happening this Saturday!', timestamp: '5:00 PM', metadata: { date: 'Oct 25' } },
  { id: '7', type: 'DOCUMENT', title: 'Invoice Generated', description: 'November 2023 Maintenance Fee is now available.', timestamp: '10:00 AM', metadata: { date: 'Oct 01' } },
];

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'VISITOR': return { icon: Scan, bg: 'bg-indigo-50', color: 'text-indigo-600' };
    case 'PAYMENT': return { icon: Wallet, bg: 'bg-emerald-50', color: 'text-emerald-600' };
    case 'MAINTENANCE': return { icon: AlertCircle, bg: 'bg-amber-50', color: 'text-amber-600' };
    case 'DOCUMENT': return { icon: Calendar, bg: 'bg-purple-50', color: 'text-purple-600' };
    default: return { icon: User, bg: 'bg-slate-100', color: 'text-slate-600' };
  }
};

export default function ActivityLogPage() {
  // Group activities by date
  const groupedActivities = activities.reduce((groups, activity) => {
    const date = activity.metadata?.date || 'Unknown';
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, Activity[]>);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Activity Log</h2>
          <p className="text-slate-500 mt-1">History of notifications, payments, and events.</p>
        </div>
        <div className="relative w-full md:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
           <input
             type="text"
             placeholder="Search activity..."
             className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm shadow-sm"
           />
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedActivities).map(([date, items]) => (
          <div key={date} className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider pl-1">{date}</h3>
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                {items.map((item) => {
                  const style = getActivityIcon(item.type);
                  const Icon = style.icon;
                  return (
                    <div key={item.id} className="p-4 flex items-start hover:bg-slate-50 transition-colors">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-1", style.bg, style.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <span className="text-xs text-slate-400 font-mono">{item.timestamp}</span>
                        </div>
                        <p className="text-sm text-slate-600 mt-0.5">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
