'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  Edit2,
  Trash2,
  Save,
  X,
  MapPin,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock Data (Initial State)
const initialEvents = [
  {
    id: 1,
    title: "Annual General Meeting (AGM)",
    category: "Event",
    date: "2023-10-15",
    time: "10:00 AM - 1:00 PM",
    location: "Community Hall",
    description: "Join us to discuss the budget for 2024 and vote on new proposals."
  },
  {
    id: 2,
    title: "Playground Upgrades",
    category: "Maintenance",
    date: "2023-10-20",
    time: "8:00 AM - 4:00 PM",
    location: "Central Park",
    description: "New swings and slides are being installed at the central park."
  },
  {
    id: 3,
    title: "New Security Protocols",
    category: "Notice",
    date: "2023-10-22",
    time: "",
    location: "Guard House",
    description: "All delivery vehicles must now be registered via the app before entry."
  },
];

export default function CalendarManagement() {
  const [events, setEvents] = useState(initialEvents);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleEdit = (event: any) => {
    setCurrentEvent({ ...event });
    setIsEditing(true);
  };

  const handleCreate = () => {
    setCurrentEvent({
      id: Math.random(),
      title: '',
      category: 'Event',
      date: new Date().toISOString().split('T')[0],
      time: '',
      location: '',
      description: ''
    });
    setIsEditing(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      setEvents(events.filter(e => e.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentEvent.id && events.find(ev => ev.id === currentEvent.id)) {
      // Update
      setEvents(events.map(ev => ev.id === currentEvent.id ? currentEvent : ev));
    } else {
      // Create
      setEvents([...events, { ...currentEvent, id: Math.random() }]);
    }
    setIsEditing(false);
    setCurrentEvent(null);
  };

  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBadgeVariant = (category: string) => {
    switch (category) {
      case 'Event': return 'default';
      case 'Maintenance': return 'secondary';
      case 'Urgent': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isEditing) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            {events.find(e => e.id === currentEvent.id) ? 'Edit Event' : 'Create New Event'}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Event Title</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm shadow-sm"
                  value={currentEvent.title}
                  onChange={e => setCurrentEvent({...currentEvent, title: e.target.value})}
                  placeholder="e.g. Community Potluck"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-700">Category</label>
                   <select
                     className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 shadow-sm"
                     value={currentEvent.category}
                     onChange={e => setCurrentEvent({...currentEvent, category: e.target.value})}
                   >
                      <option value="Event">Event</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Notice">Notice</option>
                      <option value="Urgent">Urgent</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-700">Date</label>
                   <input
                     required
                     type="date"
                     className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm shadow-sm"
                     value={currentEvent.date}
                     onChange={e => setCurrentEvent({...currentEvent, date: e.target.value})}
                   />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-700">Time (Optional)</label>
                   <input
                     type="text"
                     className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm shadow-sm"
                     value={currentEvent.time}
                     onChange={e => setCurrentEvent({...currentEvent, time: e.target.value})}
                     placeholder="e.g. 10:00 AM - 2:00 PM"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-700">Location (Optional)</label>
                   <input
                     type="text"
                     className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm shadow-sm"
                     value={currentEvent.location}
                     onChange={e => setCurrentEvent({...currentEvent, location: e.target.value})}
                     placeholder="e.g. Community Hall"
                   />
                </div>
              </div>

              <div className="space-y-2">
                 <label className="text-sm font-medium text-slate-700">Description</label>
                 <textarea
                   rows={4}
                   className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm shadow-sm resize-none"
                   value={currentEvent.description}
                   onChange={e => setCurrentEvent({...currentEvent, description: e.target.value})}
                   placeholder="Event details..."
                 />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button type="submit" className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
                  <Save className="w-4 h-4" /> Save Event
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Calendar Management</h2>
          <p className="text-slate-500 mt-1">Add, update, or remove community notices and events.</p>
        </div>
        <Button onClick={handleCreate} className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
          <Plus className="w-4 h-4" /> Add Event
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div className="relative w-full max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input
               type="text"
               placeholder="Search events..."
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
                <th className="px-6 py-4">Event Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-slate-50/50">
                   <td className="px-6 py-4">
                     <p className="font-bold text-slate-900">{event.title}</p>
                     <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{event.description}</p>
                   </td>
                   <td className="px-6 py-4">
                      <Badge variant={getBadgeVariant(event.category) as any}>
                        {event.category}
                      </Badge>
                   </td>
                   <td className="px-6 py-4">
                     <div className="flex flex-col gap-1">
                       <span className="flex items-center gap-1.5 text-slate-700">
                         <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                         {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                       </span>
                       {event.time && (
                         <span className="flex items-center gap-1.5 text-xs text-slate-500">
                           <Clock className="w-3 h-3 text-slate-400" /> {event.time}
                         </span>
                       )}
                     </div>
                   </td>
                   <td className="px-6 py-4">
                      {event.location ? (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {event.location}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Not specified</span>
                      )}
                   </td>
                   <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                         <Button variant="ghost" size="icon" onClick={() => handleEdit(event)} className="h-8 w-8 text-slate-400 hover:text-primary-600">
                           <Edit2 className="w-4 h-4" />
                         </Button>
                         <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id)} className="h-8 w-8 text-slate-400 hover:text-red-600">
                           <Trash2 className="w-4 h-4" />
                         </Button>
                      </div>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredEvents.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CalendarIcon className="w-6 h-6 text-slate-400" />
              </div>
              <p>No events found.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
