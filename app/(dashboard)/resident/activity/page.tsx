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

const activities: Activity[] = [];

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
    const date = (activity.metadata?.['date'] as string | undefined) || 'Unknown';
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
        {Object.keys(groupedActivities).length > 0 ? (
          Object.entries(groupedActivities).map(([date, items]) => (
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
          ))
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-slate-500 font-medium">No recent activity.</p>
            <p className="text-xs text-slate-400 mt-1">Your activity history will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
