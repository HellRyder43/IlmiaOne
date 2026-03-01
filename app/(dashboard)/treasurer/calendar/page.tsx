'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  Edit2,
  Trash2,
  Save,
  X,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Upload,
  Images,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EVENT_CATEGORY_COLORS } from '@/lib/constants';
import { useEvents } from '@/hooks/use-events';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { CalendarEvent, EventCategory } from '@/lib/types';

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

  return (
    <div className="relative rounded-lg overflow-hidden bg-slate-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={urls[index]}
        alt={`Event image ${index + 1}`}
        className="w-full h-48 object-cover"
      />
      {urls.length > 1 && (
        <>
          <button
            onClick={() => setIndex(i => (i - 1 + urls.length) % urls.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIndex(i => (i + 1) % urls.length)}
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

export default function CalendarManagement() {
  const { events, isLoading, createEvent, updateEvent, deleteEvent } = useEvents();

  const [isEditing, setIsEditing]       = useState(false);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [form, setForm]                 = useState<FormState>(EMPTY_FORM);
  const [isSaving, setIsSaving]         = useState(false);
  const [searchTerm, setSearchTerm]     = useState('');
  const fileInputRef                    = useRef<HTMLInputElement>(null);
  const supabase                        = createClient();

  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.description ?? '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
    // Reset input so same file can be re-selected
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
        // Upload new images first (need event id for path)
        const newUrls  = await uploadImages(editingId);
        const allUrls  = [...form.existingImageUrls, ...newUrls];

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
        // Create first, then upload with the new id
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

  // --- Form view ---
  if (isEditing) {
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

  // --- List view ---
  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Calendar Management</h2>
          <p className="text-slate-500 mt-1">Add, update, or remove community notices and events.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
          <Plus className="w-4 h-4" /> Add Event
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search events…"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm shadow-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Event Details</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Date &amp; Time</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredEvents.map((event) => {
                  const colorClass = EVENT_CATEGORY_COLORS[event.category] ?? 'bg-slate-100 text-slate-800';
                  const catLabel   = CATEGORIES.find(c => c.value === event.category)?.label ?? event.category;
                  return (
                    <tr key={event.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{event.title}</p>
                        {event.description && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{event.description}</p>
                        )}
                        {event.imageUrls && event.imageUrls.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                            <Images className="w-3 h-3" /> {event.imageUrls.length} image{event.imageUrls.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', colorClass)}>
                          {catLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1.5 text-slate-700">
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(event.date).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}
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
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => openEdit(event)}
                            className="h-8 w-8 text-slate-400 hover:text-primary-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => handleDelete(event.id)}
                            className="h-8 w-8 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
        )}
      </Card>

      {/* Expanded image preview rows (shown below table for events with images) */}
      {!isLoading && filteredEvents.some(e => (e.imageUrls ?? []).length > 0) && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Event Images</h3>
          {filteredEvents
            .filter(e => (e.imageUrls ?? []).length > 0)
            .map(event => (
              <Card key={`images-${event.id}`} className="border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{event.title}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => openEdit(event)}
                    className="text-xs text-slate-500 hover:text-primary-600 gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </Button>
                </div>
                <div className="p-4">
                  <ImageCarousel urls={event.imageUrls ?? []} />
                </div>
              </Card>
            ))
          }
        </div>
      )}
    </div>
  );
}
