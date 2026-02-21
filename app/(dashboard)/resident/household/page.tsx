'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  User,
  Home,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  Key,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Pencil,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuth } from '@/hooks'
import { useHousehold } from '@/hooks/use-household'
import type { ResidencyType, Relationship } from '@/lib/types'

const addMemberSchema = z.object({
  name:         z.string().min(1, 'Name is required').max(100),
  relationship: z.enum(['SPOUSE', 'CHILD', 'RELATIVE', 'TENANT']),
  phoneNumber:  z.string().max(20).optional().or(z.literal('')),
})
type AddMemberForm = z.infer<typeof addMemberSchema>

const RELATIONSHIP_LABELS: Record<Relationship, string> = {
  SPOUSE:   'Spouse',
  CHILD:    'Child',
  RELATIVE: 'Relative',
  TENANT:   'Tenant',
}

export default function HouseholdPage() {
  const { user } = useAuth()
  const { data, isLoading, updateResidentType, updateHouseNumber, addMember, removeMember } = useHousehold(
    user?.id ?? null,
  )

  const [isSavingType,    setIsSavingType]    = useState(false)
  const [deletingId,      setDeletingId]      = useState<string | null>(null)
  const [isEditingHouse,  setIsEditingHouse]  = useState(false)
  const [selectedHouseNo, setSelectedHouseNo] = useState('')
  const [isSavingHouse,   setIsSavingHouse]   = useState(false)
  const [allHouses, setAllHouses]             = useState<{ id: string; house_number: string }[]>([])

  const form = useForm<AddMemberForm>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { name: '', relationship: 'SPOUSE', phoneNumber: '' },
  })

  // Fetch all houses for the house-number dropdown (only when entering edit mode)
  useEffect(() => {
    if (!isEditingHouse || allHouses.length > 0) return
    fetch('/api/houses')
      .then(r => r.json())
      .then((houses: { id: string; house_number: string }[]) => setAllHouses(houses))
      .catch(() => {})
  }, [isEditingHouse, allHouses.length])

  const openHouseEdit = () => {
    setSelectedHouseNo(data?.houseNumber ?? '')
    setIsEditingHouse(true)
  }

  const handleSaveHouseNumber = async () => {
    if (!selectedHouseNo || selectedHouseNo === data?.houseNumber) {
      setIsEditingHouse(false)
      return
    }
    setIsSavingHouse(true)
    try {
      await updateHouseNumber(selectedHouseNo)
      toast.success(`House updated to No. ${selectedHouseNo}.`)
      setIsEditingHouse(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update house number.')
    } finally {
      setIsSavingHouse(false)
    }
  }

  // Sort co-residents: current user first
  const sortedCoResidents = data
    ? [...data.coResidents].sort((a, b) => (a.isCurrentUser ? -1 : b.isCurrentUser ? 1 : 0))
    : []

  const handleResidentTypeToggle = async (type: ResidencyType) => {
    if (isSavingType || data?.residentType === type) return
    setIsSavingType(true)
    try {
      await updateResidentType(type)
      toast.success(`Residency type updated to ${type === 'OWNER' ? 'Owner' : 'Tenant'}.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update residency type.')
    } finally {
      setIsSavingType(false)
    }
  }

  const handleAddMember = async (values: AddMemberForm) => {
    try {
      await addMember({
        name:         values.name,
        relationship: values.relationship,
        phoneNumber:  values.phoneNumber || undefined,
      })
      toast.success(`${values.name} added to your household.`)
      form.reset()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add member.')
    }
  }

  const handleDeleteMember = async (id: string, name: string) => {
    setDeletingId(id)
    try {
      await removeMember(id)
      toast.success(`${name} removed from your household.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">My Household</h2>
        <p className="text-slate-500 mt-1">Manage your residency status and register household members.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Residency Type */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Home className="w-5 h-5 text-slate-500" /> Residency Type
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </>
              ) : !data?.houseId ? (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>No house assigned to your profile. Please contact AJK.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => handleResidentTypeToggle('OWNER')}
                    disabled={isSavingType}
                    className={cn(
                      'relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed',
                      data?.residentType === 'OWNER'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600',
                    )}
                  >
                    {data?.residentType === 'OWNER' && (
                      <div className="absolute top-2 right-2 text-indigo-600">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                    <ShieldCheck
                      className={cn(
                        'w-8 h-8 mb-2',
                        data?.residentType === 'OWNER' ? 'text-indigo-600' : 'text-slate-400',
                      )}
                    />
                    <span className="font-bold">Owner</span>
                    <span className="text-xs mt-1 text-center opacity-80">I own this house</span>
                  </button>

                  <button
                    onClick={() => handleResidentTypeToggle('TENANT')}
                    disabled={isSavingType}
                    className={cn(
                      'relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed',
                      data?.residentType === 'TENANT'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600',
                    )}
                  >
                    {data?.residentType === 'TENANT' && (
                      <div className="absolute top-2 right-2 text-indigo-600">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                    <Key
                      className={cn(
                        'w-8 h-8 mb-2',
                        data?.residentType === 'TENANT' ? 'text-indigo-600' : 'text-slate-400',
                      )}
                    />
                    <span className="font-bold">Tenant</span>
                    <span className="text-xs mt-1 text-center opacity-80">I am renting this house</span>
                  </button>
                </div>
              )}

              <div className="mt-2 p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                {isEditingHouse ? (
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Select House No.
                    </label>
                    <Select
                      value={selectedHouseNo}
                      onValueChange={setSelectedHouseNo}
                      disabled={isSavingHouse}
                    >
                      <SelectTrigger className="h-9 border-slate-300 bg-white text-sm">
                        <SelectValue placeholder="Choose house…" />
                      </SelectTrigger>
                      <SelectContent>
                        {allHouses.length === 0 ? (
                          <SelectItem value="loading" disabled>Loading…</SelectItem>
                        ) : (
                          allHouses.map(h => (
                            <SelectItem key={h.id} value={h.house_number}>
                              House {h.house_number}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveHouseNumber}
                        disabled={isSavingHouse || !selectedHouseNo}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs"
                      >
                        {isSavingHouse ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        )}
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingHouse(false)}
                        disabled={isSavingHouse}
                        className="h-8 text-xs text-slate-500"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="flex gap-2 text-slate-500">
                        <span className="font-bold text-slate-700">House No:</span>
                        {data?.houseNumber ?? '—'}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={openHouseEdit}
                        className="h-6 w-6 text-slate-400 hover:text-indigo-600"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </div>
                    {data?.street && (
                      <p className="flex gap-2 mt-2 text-slate-500">
                        <span className="font-bold text-slate-700">Street:</span>
                        {data.street}
                      </p>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Registered Residents + Additional Members */}
        <div className="md:col-span-2 space-y-6">
          {/* Registered Residents */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-500" /> Registered Residents
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Residents at your address with an Ilmia One account.
              </p>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="space-y-3">
                  {[0, 1].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sortedCoResidents.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  Only you are registered at this address.
                </p>
              ) : (
                <div className="space-y-3">
                  {sortedCoResidents.map(cr => (
                    <div
                      key={cr.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white"
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                        {getInitials(cr.fullName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900 truncate">{cr.fullName}</p>
                          {cr.isCurrentUser && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium border border-indigo-100">
                              You
                            </span>
                          )}
                          {cr.residentType && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {cr.residentType.toLowerCase()}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 truncate">{cr.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Members */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-slate-500" /> Additional Members
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  For household members who don&apos;t have an Ilmia One account.
                </p>
              </div>
              {!isLoading && (
                <div className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 shrink-0">
                  {data?.members.length ?? 0} registered
                </div>
              )}
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Member list */}
              {isLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="w-8 h-8 rounded" />
                    </div>
                  ))}
                </div>
              ) : (data?.members.length ?? 0) === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  No additional members registered. Add members below.
                </p>
              ) : (
                <div className="space-y-3">
                  {data!.members.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{member.name}</p>
                          <p className="text-xs text-slate-500">
                            {RELATIONSHIP_LABELS[member.relationship]}
                            {member.phoneNumber && (
                              <span className="text-slate-400"> · {member.phoneNumber}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteMember(member.id, member.name)}
                        disabled={deletingId === member.id}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        {deletingId === member.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add member form — always visible */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-900 mb-3">Add New Member</h4>
                <form onSubmit={form.handleSubmit(handleAddMember)} className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                          {...form.register('name')}
                          type="text"
                          placeholder="Full Name"
                          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm shadow-sm"
                        />
                      </div>
                      {form.formState.errors.name && (
                        <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="w-full sm:w-44 space-y-1">
                      <Select
                        value={form.watch('relationship')}
                        onValueChange={val => form.setValue('relationship', val as Relationship)}
                      >
                        <SelectTrigger className="h-[42px] border-slate-300 text-sm">
                          <SelectValue placeholder="Relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SPOUSE">Spouse</SelectItem>
                          <SelectItem value="CHILD">Child</SelectItem>
                          <SelectItem value="RELATIVE">Relative</SelectItem>
                          <SelectItem value="TENANT">Tenant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1 space-y-1">
                      <input
                        {...form.register('phoneNumber')}
                        type="text"
                        placeholder="Phone (optional)"
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm shadow-sm"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="bg-slate-900 text-white hover:bg-slate-800 w-full sm:w-auto"
                  >
                    {form.formState.isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Add Member
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
