'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  User,
  Home,
  Users,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Key,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FamilyMember, Relationship } from '@/lib/types';

export default function HouseholdPage() {
  const [residentType, setResidentType] = useState<'OWNER' | 'TENANT'>('OWNER');
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // New Member Form State
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRel, setNewMemberRel] = useState<Relationship>('SPOUSE');

  const addMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const newMember: FamilyMember = {
        id: Math.random().toString(36).substr(2, 9),
        houseId: '',
        name: newMemberName,
        relationship: newMemberRel,
    };
    setMembers([...members, newMember]);
    setNewMemberName('');
    setNewMemberRel('SPOUSE');
  };

  const removeMember = (id: string) => {
    if (id === '1') return; // Prevent removing self
    setMembers(members.filter(m => m.id !== id));
  };

  const handleSave = () => {
      setIsSaving(true);
      setTimeout(() => {
          setIsSaving(false);
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
      }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">My Household</h2>
          <p className="text-slate-500 mt-1">Manage your residency status and register family members.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
                "min-w-[140px] transition-all text-white",
                showSuccess ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-900 hover:bg-slate-800"
            )}
           >
             {isSaving ? (
                 <>Saving...</>
             ) : showSuccess ? (
                 <><CheckCircle2 className="w-4 h-4 mr-2" /> Saved!</>
             ) : (
                 <><Save className="w-4 h-4 mr-2" /> Save Changes</>
             )}
           </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Residency Status */}
        <div className="md:col-span-1 space-y-6">
           <Card className="border-slate-200 shadow-sm overflow-hidden">
             <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Home className="w-5 h-5 text-slate-500" /> Residency Type
                </CardTitle>
             </CardHeader>
             <CardContent className="p-6">
                <div className="grid grid-cols-1 gap-4">
                   <button
                     onClick={() => setResidentType('OWNER')}
                     className={cn(
                       "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200",
                       residentType === 'OWNER'
                         ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                         : "border-slate-200 hover:border-slate-300 bg-white text-slate-600"
                     )}
                   >
                     {residentType === 'OWNER' && (
                         <div className="absolute top-2 right-2 text-indigo-600">
                             <CheckCircle2 className="w-5 h-5" />
                         </div>
                     )}
                     <ShieldCheck className={cn("w-8 h-8 mb-2", residentType === 'OWNER' ? "text-indigo-600" : "text-slate-400")} />
                     <span className="font-bold">Owner</span>
                     <span className="text-xs mt-1 text-center opacity-80">I own this house</span>
                   </button>

                   <button
                     onClick={() => setResidentType('TENANT')}
                     className={cn(
                       "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200",
                       residentType === 'TENANT'
                         ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                         : "border-slate-200 hover:border-slate-300 bg-white text-slate-600"
                     )}
                   >
                     {residentType === 'TENANT' && (
                         <div className="absolute top-2 right-2 text-indigo-600">
                             <CheckCircle2 className="w-5 h-5" />
                         </div>
                     )}
                     <Key className={cn("w-8 h-8 mb-2", residentType === 'TENANT' ? "text-indigo-600" : "text-slate-400")} />
                     <span className="font-bold">Tenant</span>
                     <span className="text-xs mt-1 text-center opacity-80">I am renting this house</span>
                   </button>
                </div>

                <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-500">
                   <p className="flex gap-2">
                      <span className="font-bold text-slate-700">House No:</span> 12
                   </p>
                   <p className="flex gap-2 mt-2">
                      <span className="font-bold text-slate-700">Street:</span> Jalan Merbhau
                   </p>
                   <p className="mt-4 text-xs text-slate-400 italic">
                      To update property details, please contact management office.
                   </p>
                </div>
             </CardContent>
           </Card>
        </div>

        {/* Right Column: Family Members */}
        <div className="md:col-span-2 space-y-6">
           <Card className="border-slate-200 shadow-sm h-full flex flex-col">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-slate-500" /> Household Members
                </CardTitle>
                <div className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600">
                    {members.length} Registered
                </div>
              </CardHeader>
              <CardContent className="p-6 flex-1 flex flex-col">
                 {/* List of Members */}
                 <div className="space-y-3 mb-8">
                    {members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors group">
                           <div className="flex items-center gap-4">
                              <div className={cn(
                                  "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold",
                                  false ? "bg-primary-500" : "bg-slate-400"
                              )}>
                                  {member.name.charAt(0)}
                              </div>
                              <div>
                                  <p className="font-bold text-slate-900">{member.name} {false && <span className="text-xs font-normal text-slate-400">(You)</span>}</p>
                                  <p className="text-xs text-slate-500">{member.relationship}</p>
                              </div>
                           </div>

                           {true && (
                               <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeMember(member.id)}
                                className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                               >
                                   <Trash2 className="w-4 h-4" />
                               </Button>
                           )}
                        </div>
                    ))}
                 </div>

                 {/* Add New Member Form */}
                 <div className="mt-auto pt-6 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900 mb-4">Add New Member</h4>
                    <form onSubmit={addMember} className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                            <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Full Name"
                              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm shadow-sm"
                              value={newMemberName}
                              onChange={(e) => setNewMemberName(e.target.value)}
                            />
                        </div>
                        <div className="w-full sm:w-40 relative">
                            <select
                              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 appearance-none shadow-sm"
                              value={newMemberRel}
                              onChange={(e) => setNewMemberRel(e.target.value as Relationship)}
                            >
                                <option value="SPOUSE">Spouse</option>
                                <option value="CHILD">Child</option>
                                <option value="RELATIVE">Relative</option>
                                <option value="TENANT">Tenant</option>
                            </select>
                            <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                        <Button type="submit" className="bg-slate-900 text-white hover:bg-slate-800">
                            <Plus className="w-4 h-4 mr-2" /> Add
                        </Button>
                    </form>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
