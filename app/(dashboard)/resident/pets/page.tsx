'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Camera, Search, User, Home, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Pet } from '@/lib/types';

const myPets: Pet[] = [];
const communityPets: Pet[] = [];

export default function PetsPage() {
  const [activeTab, setActiveTab] = useState<'my_pets' | 'community'>('my_pets');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [newPet, setNewPet] = useState({
    name: '',
    type: 'Dog',
    breed: ''
  });

  const filteredCommunityPets = communityPets.filter(pet =>
    pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pet.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pet.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(false);
    setNewPet({ name: '', type: 'Dog', breed: '' });
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
                 "px-4 py-2 rounded-md text-sm font-medium transition-all",
                 activeTab === 'my_pets' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
               )}
             >
               My Pets
             </button>
             <button
               onClick={() => setActiveTab('community')}
               className={cn(
                 "px-4 py-2 rounded-md text-sm font-medium transition-all",
                 activeTab === 'community' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
               )}
             >
               Community Gallery
             </button>
          </div>
        )}
      </div>

      {/* Coming soon banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
        <span>Pet registration is not yet available. This feature is coming soon.</span>
      </div>

      {isRegistering ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
           <Card className="max-w-2xl mx-auto border-primary-100 bg-white shadow-lg relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-primary-500"></div>
             <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                   <div>
                     <h3 className="text-lg font-bold text-slate-900">Register New Pet</h3>
                     <p className="text-slate-500 text-sm">Add your furry friend to the community registry.</p>
                   </div>
                   <Button variant="ghost" size="icon" onClick={() => setIsRegistering(false)} className="text-slate-400 hover:text-red-500">
                     <X className="w-5 h-5" />
                   </Button>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-6">
                   <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Camera className="w-8 h-8 text-slate-400 group-hover:text-primary-500" />
                      </div>
                      <p className="text-sm font-medium text-slate-700">Upload Pet Photo</p>
                      <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</p>
                   </div>

                   <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-sm font-medium text-slate-700">Pet Name</label>
                         <input
                           required
                           type="text"
                           placeholder="e.g. Oyen"
                           className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm shadow-sm"
                           value={newPet.name}
                           onChange={e => setNewPet({...newPet, name: e.target.value})}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-sm font-medium text-slate-700">Pet Type</label>
                         <select
                           className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 shadow-sm"
                           value={newPet.type}
                           onChange={e => setNewPet({...newPet, type: e.target.value})}
                         >
                            <option value="Dog">Dog</option>
                            <option value="Cat">Cat</option>
                            <option value="Rabbit">Rabbit</option>
                            <option value="Bird">Bird</option>
                            <option value="Other">Other</option>
                         </select>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Breed</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Golden Retriever"
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm shadow-sm"
                        value={newPet.breed}
                        onChange={e => setNewPet({...newPet, breed: e.target.value})}
                      />
                   </div>

                   <div className="pt-2 flex justify-end gap-3">
                     <Button type="button" variant="ghost" onClick={() => setIsRegistering(false)}>Cancel</Button>
                     <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white px-8">Save Pet</Button>
                   </div>
                </form>
             </CardContent>
           </Card>
        </div>
      ) : activeTab === 'my_pets' ? (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button className="gap-2" disabled title="Pet registration not yet available">
              <Plus className="w-4 h-4" /> Register New Pet
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {myPets.map(pet => (
              <Card key={pet.id} className="overflow-hidden group hover:shadow-md transition-shadow">
                <div className="aspect-[4/3] relative bg-slate-100 overflow-hidden">
                  <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/90 backdrop-blur-sm">
                       <Camera className="w-4 h-4" />
                     </Button>
                  </div>
                </div>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        {pet.name}
                        {pet.type === 'Dog' && <span className="text-lg">🐕</span>}
                        {pet.type === 'Cat' && <span className="text-lg">🐈</span>}
                      </h3>
                      <p className="text-slate-500 font-medium">{pet.breed}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add New Placeholder */}
            <button
              disabled
              className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center aspect-[4/3] md:aspect-auto p-8 min-h-[300px] md:min-h-0 cursor-not-allowed opacity-60"
            >
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-slate-400" />
              </div>
              <span className="font-semibold text-slate-700 text-lg">Register New Pet</span>
              <span className="text-slate-400 text-sm mt-1">Coming soon</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
           {/* Search Bar */}
           <div className="relative max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input
               type="text"
               placeholder="Search by name, breed or type..."
               className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>

           {filteredCommunityPets.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredCommunityPets.map(pet => (
                   <Card key={pet.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="aspect-square relative bg-slate-100">
                        <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
                           <h3 className="text-white font-bold text-lg flex items-center gap-2">
                             {pet.name}
                             {pet.type === 'Dog' && <span className="text-sm">🐕</span>}
                             {pet.type === 'Cat' && <span className="text-sm">🐈</span>}
                           </h3>
                           <p className="text-white/90 text-sm">{pet.breed}</p>
                        </div>
                      </div>
                      <CardContent className="p-4 bg-slate-50/50">
                         <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-slate-700 font-medium">
                               <User className="w-3.5 h-3.5 text-slate-400" />
                               {pet.ownerName}
                            </div>
                            <div className="flex items-center gap-2 text-slate-500">
                               <Home className="w-3.5 h-3.5 text-slate-400" />
                               {pet.houseNumber}
                            </div>
                         </div>
                      </CardContent>
                   </Card>
                ))}
             </div>
           ) : (
             <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
               <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                 <Search className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-bold text-slate-900">No pets registered yet</h3>
               <p className="text-slate-500 mt-2">Community pets will appear here once registered.</p>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
