'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Camera, Search, User, Home, MapPin, X, Syringe, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePets } from '@/hooks/use-pets';
import { useAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Pet } from '@/lib/types';

const PET_TYPES = ['Cat', 'Rabbit', 'Bird', 'Other'] as const;
const petSchema = z.object({
  name:              z.string().min(1, 'Pet name is required').max(50, 'Max 50 characters'),
  type:              z.enum(PET_TYPES),
  breed:             z.string().max(50, 'Max 50 characters').optional(),
  vaccinationStatus: z.boolean(),
});

type PetFormValues = z.infer<typeof petSchema>;

function petTypeEmoji(type: string) {
  switch (type) {
    case 'Cat':    return '🐈';
    case 'Rabbit': return '🐇';
    case 'Bird':   return '🐦';
    default:       return '🐾';
  }
}

function PetCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <CardContent className="pt-4 pb-5 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

export default function PetsPage() {
  const { user } = useAuth();
  const { myPets, communityPets, isLoading, createPet, deletePet } = usePets(user?.id ?? null);

  const [activeTab,       setActiveTab]       = useState<'my_pets' | 'community'>('my_pets');
  const [searchTerm,      setSearchTerm]      = useState('');
  const [isRegistering,   setIsRegistering]   = useState(false);
  const [isSubmitting,    setIsSubmitting]     = useState(false);
  const [photoFile,       setPhotoFile]       = useState<File | null>(null);
  const [photoPreview,    setPhotoPreview]    = useState<string | null>(null);
  const [photoError,      setPhotoError]      = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedPet,     setSelectedPet]     = useState<Pet | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PetFormValues>({
    resolver:     zodResolver(petSchema),
    defaultValues: { vaccinationStatus: false },
  });

  const filteredCommunityPets = communityPets.filter(pet =>
    pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pet.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pet.type.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setPhotoError('Only JPG and PNG files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('File size must be 5MB or less.');
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const closeForm = () => {
    setIsRegistering(false);
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoError(null);
    reset();
  };

  const onSubmit = async (values: PetFormValues) => {
    setIsSubmitting(true);
    try {
      let photoUrl = '';

      if (photoFile && user?.id) {
        const supabase = createClient();
        const ext      = photoFile.name.split('.').pop() ?? 'jpg';
        const path     = `${user.id}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('pet-photos')
          .upload(path, photoFile, { upsert: false });

        if (uploadError) {
          throw new Error('Failed to upload photo. Please try again.');
        }

        const { data: urlData } = supabase.storage.from('pet-photos').getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }

      await createPet({
        name:              values.name,
        type:              values.type,
        breed:             values.breed,
        vaccinationStatus: values.vaccinationStatus,
        photoUrl:          photoUrl || undefined,
      });

      toast.success(`${values.name} has been registered!`);
      closeForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to register pet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async (pet: Pet) => {
    try {
      await deletePet(pet.id);
      toast.success(`${pet.name} has been removed.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove pet');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Pet Registry</h2>
          <p className="text-slate-500">Manage your pets and meet the furry community.</p>
        </div>
        {!isRegistering && (
          <div className="flex bg-slate-100 p-1 rounded-lg self-start">
            <button
              onClick={() => setActiveTab('my_pets')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all',
                activeTab === 'my_pets' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              My Pets
            </button>
            <button
              onClick={() => setActiveTab('community')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all',
                activeTab === 'community' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              Community Gallery
            </button>
          </div>
        )}
      </div>

      {/* Registration Form */}
      {isRegistering ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Card className="max-w-2xl mx-auto border-primary-100 bg-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Register New Pet</h3>
                  <p className="text-slate-500 text-sm">Add your furry friend to the community registry.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={closeForm} className="text-slate-400 hover:text-red-500">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Photo Upload */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
                  >
                    {photoPreview ? (
                      <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photoPreview} alt="Pet preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Camera className="w-8 h-8 text-slate-400 group-hover:text-indigo-500" />
                      </div>
                    )}
                    <p className="text-sm font-medium text-slate-700 mt-3">
                      {photoPreview ? 'Change Photo' : 'Upload Pet Photo'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB (optional)</p>
                  </button>
                  {photoError && (
                    <p className="flex items-center gap-1.5 text-xs text-red-600 mt-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> {photoError}
                    </p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Pet Name</label>
                    <input
                      {...register('name')}
                      type="text"
                      placeholder="e.g. Oyen"
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm shadow-sm"
                    />
                    {errors.name && (
                      <p className="text-xs text-red-600">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Pet Type</label>
                    <select
                      {...register('type')}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm"
                    >
                      {PET_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    {errors.type && (
                      <p className="text-xs text-red-600">{errors.type.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Breed <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input
                    {...register('breed')}
                    type="text"
                    placeholder="e.g. Domestic Shorthair"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm shadow-sm"
                  />
                  {errors.breed && (
                    <p className="text-xs text-red-600">{errors.breed.message}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <input
                    {...register('vaccinationStatus')}
                    id="vaccinationStatus"
                    type="checkbox"
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                  <label htmlFor="vaccinationStatus" className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                    <Syringe className="w-4 h-4 text-emerald-500" />
                    Vaccination up to date
                  </label>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={closeForm} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !!photoError}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-8"
                  >
                    {isSubmitting ? 'Saving…' : 'Save Pet'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : activeTab === 'my_pets' ? (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button className="gap-2" onClick={() => setIsRegistering(true)}>
              <Plus className="w-4 h-4" /> Register New Pet
            </Button>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => <PetCardSkeleton key={i} />)}
            </div>
          ) : myPets.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {myPets.map(pet => (
                <Card key={pet.id} className="overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="aspect-[4/3] relative bg-slate-100 overflow-hidden">
                    {pet.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={pet.photoUrl}
                        alt={pet.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">
                        {petTypeEmoji(pet.type)}
                      </div>
                    )}
                    {/* Delete button — appears on hover */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {confirmDeleteId === pet.id ? (
                        <div className="flex gap-1.5">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={() => handleDeleteConfirm(pet)}
                          >
                            Confirm
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs px-2 bg-white/90 backdrop-blur-sm"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 bg-white/90 backdrop-blur-sm"
                          onClick={() => setConfirmDeleteId(pet.id)}
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <CardContent className="pt-4 pb-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          {pet.name}
                          <span>{petTypeEmoji(pet.type)}</span>
                        </h3>
                        <p className="text-slate-500 text-sm">{pet.breed}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs shrink-0',
                          pet.vaccinationStatus
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-slate-50 text-slate-500',
                        )}
                      >
                        <Syringe className="w-3 h-3 mr-1" />
                        {pet.vaccinationStatus ? 'Vaccinated' : 'Not vaccinated'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add more */}
              <button
                onClick={() => setIsRegistering(true)}
                className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 min-h-[200px] hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors group"
              >
                <div className="w-16 h-16 rounded-full bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center mb-4 transition-colors">
                  <Plus className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </div>
                <span className="font-semibold text-slate-700 text-base">Register Another Pet</span>
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              <button
                onClick={() => setIsRegistering(true)}
                className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center aspect-[4/3] md:aspect-auto p-8 min-h-[260px] hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors group"
              >
                <div className="w-16 h-16 rounded-full bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center mb-4 transition-colors">
                  <Plus className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </div>
                <span className="font-semibold text-slate-700 text-lg">Register New Pet</span>
                <span className="text-slate-400 text-sm mt-1">Add your first furry friend</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, breed or type…"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <PetCardSkeleton key={i} />)}
            </div>
          ) : filteredCommunityPets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredCommunityPets.map(pet => (
                <Card key={pet.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedPet(pet)}>
                  <div className="aspect-square relative bg-slate-100">
                    {pet.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        {petTypeEmoji(pet.type)}
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
                      <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        {pet.name}
                        <span className="text-sm">{petTypeEmoji(pet.type)}</span>
                      </h3>
                      <p className="text-white/90 text-sm">{pet.breed}</p>
                    </div>
                  </div>
                  <CardContent className="p-4 bg-slate-50/50">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {pet.ownerName ?? '—'}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Home className="w-3.5 h-3.5 text-slate-400" />
                        {pet.houseNumber
                          ? [pet.street, `No. ${pet.houseNumber}`].filter(Boolean).join(', ')
                          : '—'}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs w-full justify-center',
                        pet.vaccinationStatus
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-50 text-slate-500',
                      )}
                    >
                      <Syringe className="w-3 h-3 mr-1" />
                      {pet.vaccinationStatus ? 'Vaccinated' : 'Not vaccinated'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {searchTerm ? 'No pets found' : 'No pets registered yet'}
              </h3>
              <p className="text-slate-500 mt-2">
                {searchTerm
                  ? `No pets match "${searchTerm}". Try a different search.`
                  : 'Community pets will appear here once registered.'}
              </p>
            </div>
          )}

          {/* Pet Detail Dialog */}
          <Dialog open={!!selectedPet} onOpenChange={open => { if (!open) setSelectedPet(null); }}>
            <DialogContent className="max-w-sm">
              {selectedPet && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                      {selectedPet.name}
                      <span>{petTypeEmoji(selectedPet.type)}</span>
                    </DialogTitle>
                  </DialogHeader>

                  <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-100 mt-2">
                    {selectedPet.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedPet.photoUrl}
                        alt={selectedPet.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-7xl">
                        {petTypeEmoji(selectedPet.type)}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 mt-1">
                    {selectedPet.breed && (
                      <p className="text-sm text-slate-600">
                        <span className="font-medium text-slate-800">Breed:</span> {selectedPet.breed}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{selectedPet.ownerName ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Home className="w-4 h-4 text-slate-400 shrink-0" />
                      {selectedPet.houseNumber
                        ? [selectedPet.street, `No. ${selectedPet.houseNumber}`].filter(Boolean).join(', ')
                        : '—'}
                    </div>
                    {selectedPet.street && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        {selectedPet.street}
                      </div>
                    )}
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs w-full justify-center mt-1',
                        selectedPet.vaccinationStatus
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-50 text-slate-500',
                      )}
                    >
                      <Syringe className="w-3 h-3 mr-1" />
                      {selectedPet.vaccinationStatus ? 'Vaccination up to date' : 'Not vaccinated'}
                    </Badge>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
