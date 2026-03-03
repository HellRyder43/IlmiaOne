'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  List,
  Info,
  Images,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EVENT_CATEGORY_COLORS } from '@/lib/constants';
import { useEvents } from '@/hooks/use-events';
import { useAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { CalendarEvent, EventCategory } from '@/lib/types';

// --- Calendar helpers ---
const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

const getFirstDayOfMonth = (year: number, month: number) =>
  new Date(year, month, 1).getDay();

const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth()    === d2.getMonth() &&
  d1.getDate()     === d2.getDate();

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CATEGORY_LABELS: Record<string, string> = {
  COMMUNITY_EVENT: 'Community Event',
  MAINTENANCE:     'Maintenance',
  MEETING:         'Meeting',
  NOTICE:          'Notice',
  HOLIDAY:         'Holiday',
};

const CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: 'COMMUNITY_EVENT', label: 'Community Event' },
  { value: 'MAINTENANCE',     label: 'Maintenance' },
  { value: 'MEETING',         label: 'Meeting' },
  { value: 'NOTICE',          label: 'Notice' },
  { value: 'HOLIDAY',         label: 'Holiday' },
];

// --- Image Carousel ---
function ImageCarousel({ urls }: { urls: string[] }) {
  const [index, setIndex] = useState(0);
  if (urls.length === 0) return null;

  const prev = () => setIndex(i => (i - 1 + urls.length) % urls.length);
  const next = () => setIndex(i => (i + 1) % urls.length);

  return (
    <div className="relative rounded-lg overflow-hidden mt-3 bg-slate-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={urls[index]}
        alt={`Event image ${index + 1}`}
        className="w-full h-40 object-cover"
      />
      {urls.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
            {index + 1} / {urls.length}
          </div>
        </>
      )}
    </div>
  );
}

// --- Form state ---
interface FormState {
  title: string
  category: EventCategory
  eventDate: string
  eventTime: string
  location: string
  description: string
  existingImageUrls: string[]
  newImageFiles: File[]
  newImagePreviews: string[]
}

const EMPTY_FORM: FormState = {
  title:              '',
  category:           'COMMUNITY_EVENT',
  eventDate:          new Date().toISOString().split('T')[0],
  eventTime:          '',
  location:           '',
  description:        '',
  existingImageUrls:  [],
  newImageFiles:      [],
  newImagePreviews:   [],
};

// --- Event detail card ---
function EventDetail({
  event,
  canManage,
  onEdit,
  onDelete,
}: {
  event: CalendarEvent
  canManage: boolean
  onEdit: (event: CalendarEvent) => void
  onDelete: (id: string) => void
}) {
  const colorClass = EVENT_CATEGORY_COLORS[event.category] ?? 'bg-slate-100 text-slate-800';
  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary-100 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', colorClass)}>
          {CATEGORY_LABELS[event.category] ?? event.category}
        </span>
        {canManage && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(event)}
              className="p-1 rounded text-slate-400 hover:text-primary-600 hover:bg-slate-200 transition-colors"
              title="Edit event"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(event.id)}
              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-200 transition-colors"
              title="Delete event"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      <h4 className="font-bold text-slate-900 mt-2">{event.title}</h4>
      <div className="text-sm text-slate-500 mt-2 space-y-1">
        {event.time && (
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" /> {event.time}
          </div>
        )}
        {event.location && (
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> {event.location}
          </div>
        )}
      </div>
      {event.description && (
        <p className="text-sm text-slate-600 mt-3 pt-3 border-t border-slate-200/60">
          {event.description}
        </p>
      )}
      {event.imageUrls && event.imageUrls.length > 0 && (
        <ImageCarousel urls={event.imageUrls} />
      )}
    </div>
  );
}

// --- Main page ---
export default function CommunityCalendarPage() {
  const today = new Date();
  const { hasPermission } = useAuth();
  const { events, isLoading, createEvent, updateEvent, deleteEvent } = useEvents();
  const canManage = hasPermission('manage_calendar');
  const supabase = createClient();

  const [view, setView]               = useState<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);

  // CRUD state (only used when canManage)
  const [isEditing, setIsEditing]   = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState<FormState>(EMPTY_FORM);
  const [isSaving, setIsSaving]     = useState(false);
  const fileInputRef                = useRef<HTMLInputElement>(null);

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days: (Date | null)[] = [];
  for (let i = 0; i < getFirstDayOfMonth(year, month); i++) days.push(null);
  for (let i = 1; i <= getDaysInMonth(year, month); i++) days.push(new Date(year, month, i));

  const selectedEvents = selectedDate
    ? events.filter(e => isSameDay(new Date(e.date), selectedDate))
    : [];

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  // --- CRUD functions ---
  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setIsEditing(true);
  }

  function openEdit(event: CalendarEvent) {
    setForm({
      title:             event.title,
      category:          event.category,
      eventDate:         event.date,
      eventTime:         event.time ?? '',
      location:          event.location ?? '',
      description:       event.description ?? '',
      existingImageUrls: event.imageUrls ?? [],
      newImageFiles:     [],
      newImagePreviews:  [],
    });
    setEditingId(event.id);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const total = form.existingImageUrls.length + form.newImageFiles.length + files.length;
    if (total > 5) {
      toast.error('Maximum 5 images per event');
      return;
    }

    const valid = files.filter(f => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
        toast.error(`${f.name}: only JPG, PNG, WebP allowed`);
        return false;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name}: file too large (max 5 MB)`);
        return false;
      }
      return true;
    });

    const previews = valid.map(f => URL.createObjectURL(f));
    setForm(prev => ({
      ...prev,
      newImageFiles:    [...prev.newImageFiles, ...valid],
      newImagePreviews: [...prev.newImagePreviews, ...previews],
    }));
    e.target.value = '';
  }

  function removeExistingImage(url: string) {
    setForm(prev => ({
      ...prev,
      existingImageUrls: prev.existingImageUrls.filter(u => u !== url),
    }));
  }

  function removeNewImage(idx: number) {
    setForm(prev => {
      URL.revokeObjectURL(prev.newImagePreviews[idx]);
      return {
        ...prev,
        newImageFiles:    prev.newImageFiles.filter((_, i) => i !== idx),
        newImagePreviews: prev.newImagePreviews.filter((_, i) => i !== idx),
      };
    });
  }

  async function uploadImages(eventId: string): Promise<string[]> {
    const uploaded: string[] = [];
    for (const file of form.newImageFiles) {
      const ext  = file.name.split('.').pop() ?? 'jpg';
      const path = `${eventId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from('event-images')
        .upload(path, file, { upsert: false });

      if (error) {
        toast.error(`Failed to upload image: ${file.name}`);
        continue;
      }
      const { data } = supabase.storage.from('event-images').getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }
    return uploaded;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.eventDate)    { toast.error('Date is required');  return; }

    setIsSaving(true);
    try {
      if (editingId) {
        const newUrls = await uploadImages(editingId);
        const allUrls = [...form.existingImageUrls, ...newUrls];
        await updateEvent(editingId, {
          title:       form.title,
          category:    form.category,
          eventDate:   form.eventDate,
          eventTime:   form.eventTime || undefined,
          location:    form.location || undefined,
          description: form.description || undefined,
          imageUrls:   allUrls,
        });
        toast.success('Event updated');
      } else {
        const created = await createEvent({
          title:       form.title,
          category:    form.category,
          eventDate:   form.eventDate,
          eventTime:   form.eventTime || undefined,
          location:    form.location || undefined,
          description: form.description || undefined,
          imageUrls:   [],
        });

        if (form.newImageFiles.length > 0) {
          const newUrls = await uploadImages(created.id);
          if (newUrls.length > 0) {
            await updateEvent(created.id, { imageUrls: newUrls });
          }
        }
        toast.success('Event created');
      }

      cancelEdit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this event?')) return;
    try {
      await deleteEvent(id);
      toast.success('Event deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete event');
    }
  }

  // --- Form view (managers only) ---
  if (isEditing && canManage) {
    const previewUrls = [...form.existingImageUrls, ...form.newImagePreviews];
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            {editingId ? 'Edit Event' : 'Create New Event'}
          </h2>
          <Button variant="ghost" size="icon" onClick={cancelEdit} disabled={isSaving}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSave} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Event Title</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm shadow-sm"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Community Potluck"
                />
              </div>

              {/* Category + Date */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Category</label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 shadow-sm"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as EventCategory }))}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Date</label>
                  <input
                    required
                    type="date"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm shadow-sm"
                    value={form.eventDate}
                    onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Time + Location */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Time <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm shadow-sm"
                    value={form.eventTime}
                    onChange={e => setForm(f => ({ ...f, eventTime: e.target.value }))}
                    placeholder="e.g. 10:00 AM – 2:00 PM"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Location <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm shadow-sm"
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. Community Hall"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Description <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm shadow-sm resize-none"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Event details..."
                />
              </div>

              {/* Images */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">
                    Images <span className="text-slate-400 font-normal">(optional, max 5)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={previewUrls.length >= 5}
                    className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 disabled:text-slate-400 disabled:cursor-not-allowed font-medium"
                  >
                    <Upload className="w-3.5 h-3.5" /> Add photos
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {form.existingImageUrls.map((url) => (
                      <div key={url} className="relative rounded-lg overflow-hidden group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-full h-24 object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(url)}
                          className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {form.newImagePreviews.map((url, idx) => (
                      <div key={url} className="relative rounded-lg overflow-hidden group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-full h-24 object-cover" />
                        <div className="absolute top-1 left-1 bg-primary-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-medium">
                          New
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNewImage(idx)}
                          className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={cancelEdit} disabled={isSaving}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="gap-2 bg-slate-900 text-white hover:bg-slate-800"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Event</>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Calendar / List view ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Community Calendar</h2>
          <p className="text-slate-500">Events, notices, and important dates.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {canManage && (
            <Button onClick={openCreate} className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
              <Plus className="w-4 h-4" /> Create Event
            </Button>
          )}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setView('calendar')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                view === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              <CalendarIcon className="w-4 h-4" /> Calendar
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              <List className="w-4 h-4" /> List View
            </button>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && view === 'calendar' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <Card className="lg:col-span-2 border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {MONTH_NAMES[month]} {year}
              </h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
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
                if (!date) return (
                  <div key={`empty-${index}`} className="h-32 bg-slate-50/30 border-b border-r border-slate-100" />
                );

                const dayEvents  = events.filter(e => isSameDay(new Date(e.date), date));
                const isToday    = isSameDay(date, new Date());
                const isSelected = selectedDate && isSameDay(date, selectedDate);

                return (
                  <div
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      'min-h-[8rem] p-2 border-b border-r border-slate-100 transition-colors cursor-pointer',
                      isSelected ? 'bg-primary-50/30' : 'hover:bg-slate-50',
                      isToday && 'bg-slate-50',
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <span className={cn(
                        'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                        isToday ? 'bg-primary-600 text-white' : 'text-slate-700',
                      )}>
                        {date.getDate()}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      {dayEvents.map((event) => {
                        const colorClass = EVENT_CATEGORY_COLORS[event.category] ?? 'bg-slate-100 text-slate-800';
                        return (
                          <div
                            key={event.id}
                            className={cn('text-[10px] px-1.5 py-1 rounded truncate font-medium', colorClass)}
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Side Panel */}
          <div className="space-y-6">
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary-500" />
                  {selectedDate ? (
                    <>Events for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                  ) : (
                    'Select a date'
                  )}
                </h3>

                {selectedEvents.length > 0 ? (
                  <div className="space-y-4">
                    {selectedEvents.map(event => (
                      <EventDetail
                        key={event.id}
                        event={event}
                        canManage={canManage}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                      />
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
      {!isLoading && view === 'list' && (
        <div className="space-y-6">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => {
              const colorClass = EVENT_CATEGORY_COLORS[event.category] ?? 'bg-slate-100 text-slate-800';
              return (
                <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className={cn('h-2', colorClass.split(' ')[0])} />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <div>
                        <p className="text-sm font-semibold text-primary-600 mb-1">
                          {new Date(event.date).toLocaleDateString('en-US', {
                            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                          })}
                        </p>
                        <h3 className="text-xl font-bold text-slate-900">{event.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap', colorClass)}>
                          {CATEGORY_LABELS[event.category] ?? event.category}
                        </span>
                        {canManage && (
                          <>
                            <button
                              onClick={() => openEdit(event)}
                              className="p-1.5 rounded text-slate-400 hover:text-primary-600 hover:bg-slate-100 transition-colors"
                              title="Edit event"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(event.id)}
                              className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors"
                              title="Delete event"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-slate-600 mb-4">{event.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-slate-500">
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
                      {event.imageUrls && event.imageUrls.length > 0 && (
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                          <Images className="w-4 h-4" /> {event.imageUrls.length} photo{event.imageUrls.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>

                    {event.imageUrls && event.imageUrls.length > 0 && (
                      <ImageCarousel urls={event.imageUrls} />
                    )}
                  </div>
                </Card>
              );
            })
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
