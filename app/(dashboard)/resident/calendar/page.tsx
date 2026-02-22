'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  List,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/lib/types';

// --- Mock Data ---
const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth();

const events: CalendarEvent[] = [];

// --- Helper Functions ---
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const getBadgeVariant = (category: string) => {
  switch (category) {
    case 'COMMUNITY_EVENT': return 'default'; // Purple/Primary
    case 'MAINTENANCE': return 'warning'; // Yellow
    case 'NOTICE': return 'secondary'; // Gray
    default: return 'secondary';
  }
};

const getBadgeColor = (category: string) => {
  switch (category) {
    case 'COMMUNITY_EVENT': return 'bg-primary-100 text-primary-700';
    case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800';
    case 'NOTICE': return 'bg-slate-100 text-slate-800';
    default: return 'bg-slate-100 text-slate-800';
  }
};

export default function CommunityCalendarPage() {
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);

  // Calendar Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days = [];
  // Add empty slots for previous month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  // Add days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const selectedEvents = selectedDate
    ? events.filter(e => isSameDay(new Date(e.date), selectedDate))
    : [];

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Community Calendar</h2>
          <p className="text-slate-500">Events, notices, and important dates.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg self-start">
          <button
            onClick={() => setView('calendar')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              view === 'calendar' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <CalendarIcon className="w-4 h-4" /> Calendar
          </button>
          <button
            onClick={() => setView('list')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              view === 'list' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <List className="w-4 h-4" /> List View
          </button>
        </div>
      </div>

      {view === 'calendar' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <Card className="lg:col-span-2 border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {monthNames[month]} {year}
              </h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-fr">
              {days.map((date, index) => {
                if (!date) return <div key={`empty-${index}`} className="h-32 bg-slate-50/30 border-b border-r border-slate-100" />;

                const dayEvents = events.filter(e => isSameDay(new Date(e.date), date));
                const isToday = isSameDay(date, new Date());
                const isSelected = selectedDate && isSameDay(date, selectedDate);

                return (
                  <div
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      "min-h-[8rem] p-2 border-b border-r border-slate-100 transition-colors cursor-pointer relative group",
                      isSelected ? "bg-primary-50/30" : "hover:bg-slate-50",
                      isToday && "bg-slate-50"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <span className={cn(
                        "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                        isToday
                          ? "bg-primary-600 text-white"
                          : "text-slate-700"
                      )}>
                        {date.getDate()}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1">
                      {dayEvents.map((event, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "text-[10px] px-1.5 py-1 rounded border truncate font-medium",
                            getBadgeColor(event.category).replace('text-', 'border-transparent text-')
                          )}
                          title={event.title}
                        >
                          {event.time ? '• ' : ''}{event.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Side Panel: Selected Date Details */}
          <div className="space-y-6">
            <Card className="h-full border-slate-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary-500" />
                  {selectedDate ? (
                     <>Events for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                  ) : (
                    "Select a date"
                  )}
                </h3>

                {selectedEvents.length > 0 ? (
                  <div className="space-y-4">
                    {selectedEvents.map(event => (
                      <div key={event.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary-100 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                           <Badge variant={getBadgeVariant(event.category) as any} className="text-[10px]">
                             {event.category.replace('_', ' ')}
                           </Badge>
                        </div>
                        <h4 className="font-bold text-slate-900">{event.title}</h4>
                        <div className="text-sm text-slate-500 mt-2 space-y-1">
                          {event.time && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5" /> {event.time}
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5" /> {event.location}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-3 pt-3 border-t border-slate-200/60">
                          {event.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                   <div className="text-center py-10">
                     <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                       <CalendarIcon className="w-6 h-6" />
                     </div>
                     <p className="text-slate-500 font-medium">No events for this date.</p>
                     <p className="text-xs text-slate-400 mt-1">Click on a date to view details.</p>
                   </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="space-y-6">
           {upcomingEvents.length > 0 ? (
             upcomingEvents.map((event) => (
               <Card key={event.id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                 <div className={cn("h-2", getBadgeColor(event.category).replace('text-', 'bg-').split(' ')[0])}></div>

                 <div className="p-6 flex-1 flex flex-col justify-center">
                   <div className="flex items-start justify-between mb-2">
                     <div>
                       <p className="text-sm font-semibold text-primary-600 mb-1">
                         {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                       </p>
                       <h3 className="text-xl font-bold text-slate-900">{event.title}</h3>
                     </div>
                     <Badge variant={getBadgeVariant(event.category) as any}>{event.category.replace('_', ' ')}</Badge>
                   </div>

                   <p className="text-slate-600 mb-4">{event.description}</p>

                   <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-auto">
                      {event.time && (
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                          <Clock className="w-4 h-4" /> {event.time}
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                          <MapPin className="w-4 h-4" /> {event.location}
                        </div>
                      )}
                   </div>
                 </div>
               </Card>
             ))
           ) : (
             <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
               <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                 <CalendarIcon className="w-6 h-6" />
               </div>
               <p className="text-slate-500 font-medium">No upcoming events.</p>
               <p className="text-xs text-slate-400 mt-1">Events created by the committee will appear here.</p>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
