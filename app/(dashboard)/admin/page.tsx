'use client';

import React, { useState, useCallback } from 'react';
import { useAdminStats } from '@/hooks/use-admin-stats';
import { useAdminHouses, type HouseWithDetails } from '@/hooks/use-admin-houses';
import { useAdminUsers } from '@/hooks/use-admin-users';
import { useAdminAuditLogs } from '@/hooks/use-admin-audit-logs';
import { useAdminRoles } from '@/hooks/use-admin-roles';
import { useAuth } from '@/lib/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { getInitials } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Settings,
  Home,
  ShieldCheck,
  Users,
  FileText,
  Activity,
  Edit,
  Eye,
  Trash2,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield,
  Lock,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { APP_PERMISSIONS, ROUTE_SECTIONS, ROLE_LABELS } from '@/lib/constants';
import type { Role, RolePermissions, AppPermission } from '@/lib/types';

// ─── Color palette for roles ────────────────────────────────────────────────
const ROLE_BADGE_COLORS: Record<string, string> = {
  slate:   'bg-slate-100 text-slate-700 border-slate-300',
  indigo:  'bg-indigo-100 text-indigo-700 border-indigo-300',
  violet:  'bg-violet-100 text-violet-700 border-violet-300',
  rose:    'bg-rose-100 text-rose-700 border-rose-300',
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  amber:   'bg-amber-100 text-amber-700 border-amber-300',
  blue:    'bg-blue-100 text-blue-700 border-blue-300',
};

const ROLE_DOT_COLORS: Record<string, string> = {
  slate:   'bg-slate-500',
  indigo:  'bg-indigo-500',
  violet:  'bg-violet-500',
  rose:    'bg-rose-500',
  emerald: 'bg-emerald-500',
  amber:   'bg-amber-500',
  blue:    'bg-blue-500',
};

const COLOR_OPTIONS = [
  { value: 'slate',   label: 'Slate' },
  { value: 'indigo',  label: 'Indigo' },
  { value: 'violet',  label: 'Violet' },
  { value: 'rose',    label: 'Rose' },
  { value: 'emerald', label: 'Emerald' },
  { value: 'amber',   label: 'Amber' },
  { value: 'blue',    label: 'Blue' },
];

// Permission categories for the editor
const PERMISSION_CATEGORIES = ['residents', 'visitors', 'financials', 'system'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  residents:  'Residents',
  visitors:   'Visitors',
  financials: 'Financials',
  system:     'System',
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  SPOUSE: 'Spouse',
  CHILD: 'Child',
  RELATIVE: 'Relative',
  TENANT: 'Tenant',
};

// ─── Permission Editor Component ────────────────────────────────────────────
interface PermissionEditorProps {
  permissions: RolePermissions;
  onChange: (perms: RolePermissions) => void;
  isSystem?: boolean;
}

function PermissionEditor({ permissions, onChange, isSystem }: PermissionEditorProps) {
  const toggleRoute = (route: string) => {
    const routes = permissions.routes.includes(route)
      ? permissions.routes.filter(r => r !== route)
      : [...permissions.routes, route];
    onChange({ ...permissions, routes });
  };

  const toggleAction = (action: AppPermission) => {
    const actions = permissions.actions.includes(action)
      ? permissions.actions.filter(a => a !== action)
      : [...permissions.actions, action];
    onChange({ ...permissions, actions });
  };

  return (
    <div className="space-y-6">
      {/* Route Access */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Route Access</h4>
        <div className="space-y-3">
          {ROUTE_SECTIONS.map(section => {
            const isActive = permissions.routes.includes(section.key);
            return (
              <div key={section.key} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-900">{section.label}</p>
                  <p className="text-xs text-slate-500">{section.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn(
                    'text-xs font-semibold w-6 text-right',
                    isActive ? 'text-emerald-600' : 'text-slate-400',
                  )}>
                    {isActive ? 'On' : 'Off'}
                  </span>
                  <Switch
                    checked={isActive}
                    onCheckedChange={() => toggleRoute(section.key)}
                    className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-300"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Permissions grouped by category */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Action Permissions</h4>
        <div className="space-y-5">
          {PERMISSION_CATEGORIES.map(cat => {
            const items = APP_PERMISSIONS.filter(p => p.category === cat);
            if (!items.length) return null;
            return (
              <div key={cat}>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  {CATEGORY_LABELS[cat]}
                </p>
                <div className="space-y-2">
                  {items.map(perm => {
                    const isActive = permissions.actions.includes(perm.key);
                    return (
                      <div key={perm.key} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{perm.label}</p>
                          <p className="text-xs text-slate-500">{perm.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn(
                            'text-xs font-semibold w-6 text-right',
                            isActive ? 'text-emerald-600' : 'text-slate-400',
                          )}>
                            {isActive ? 'On' : 'Off'}
                          </span>
                          <Switch
                            checked={isActive}
                            onCheckedChange={() => toggleAction(perm.key)}
                            className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-300"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isSystem && (
        <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
          System role permissions can be edited — changes apply to all users with this role on their next login.
        </p>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { user, hasPermission } = useAuth();
  const canManageRoles = hasPermission('manage_roles');
  const canAssignRole  = hasPermission('assign_user_role');
  const canViewHouseholdMembers = hasPermission('view_household_members');

  // ── View household members dialog state
  const [viewHouseMembers, setViewHouseMembers] = useState<HouseWithDetails | null>(null);

  // ── Existing hooks
  const {
    totalHouses, activeResidents, activeGuards, monthlyEvents,
    recentActivity, isLoading: statsLoading,
  } = useAdminStats();

  const {
    houses, isLoading: housesLoading, error: housesError,
    search, setSearch, statusFilter, setStatusFilter,
    residencyFilter, setResidencyFilter,
  } = useAdminHouses();

  const {
    users, isLoading: usersLoading, error: usersError,
    search: userSearch, setSearch: setUserSearch,
    roleFilter, setRoleFilter,
    refetch: refetchUsers,
  } = useAdminUsers();

  const {
    logs, isLoading: auditLoading,
    actionFilter, setActionFilter,
    timeFilter, setTimeFilter,
  } = useAdminAuditLogs();

  // ── Roles hook
  const {
    roles, isLoading: rolesLoading, error: rolesError,
    updateRole, createRole, deleteRole,
  } = useAdminRoles();

  // ── Role editor state
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editorDraft, setEditorDraft] = useState<{ displayName: string; description: string; color: string; permissions: RolePermissions } | null>(null);
  const [editorSaving, setEditorSaving] = useState(false);

  const openEditor = (role: Role) => {
    setSelectedRole(role);
    setEditorDraft({
      displayName:  role.displayName,
      description:  role.description ?? '',
      color:        role.color,
      permissions:  { routes: [...role.permissions.routes], actions: [...role.permissions.actions] },
    });
  };

  const handleEditorSave = async () => {
    if (!selectedRole || !editorDraft) return;
    setEditorSaving(true);
    try {
      await updateRole(selectedRole.id, {
        ...(!selectedRole.isSystem && { displayName: editorDraft.displayName }),
        description:  editorDraft.description,
        color:        editorDraft.color,
        permissions:  editorDraft.permissions,
      });
      toast.success('Role updated. Users will see changes on next login.');
      setSelectedRole(null);
      setEditorDraft(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setEditorSaving(false);
    }
  };

  // ── New role dialog state
  const [showNewRole, setShowNewRole] = useState(false);
  const [newRole, setNewRole] = useState({
    displayName: '',
    value: '',
    description: '',
    color: 'slate',
    permissions: { routes: [], actions: [] } as RolePermissions,
  });
  const [creatingRole, setCreatingRole] = useState(false);

  const autoKey = (name: string) =>
    name.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

  const handleCreateRole = async () => {
    if (!newRole.displayName.trim() || !newRole.value.trim()) {
      toast.error('Display name and role key are required');
      return;
    }
    setCreatingRole(true);
    try {
      await createRole({
        value:       newRole.value,
        displayName: newRole.displayName.trim(),
        description: newRole.description.trim() || undefined,
        color:       newRole.color,
        permissions: newRole.permissions,
      });
      toast.success(`Role "${newRole.displayName}" created successfully`);
      setShowNewRole(false);
      setNewRole({ displayName: '', value: '', description: '', color: 'slate', permissions: { routes: [], actions: [] } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create role');
    } finally {
      setCreatingRole(false);
    }
  };

  // ── Delete role
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);
  const handleDeleteRole = async (role: Role) => {
    if (!confirm(`Delete role "${role.displayName}"? This cannot be undone.`)) return;
    setDeletingRoleId(role.id);
    try {
      await deleteRole(role.id);
      toast.success(`Role "${role.displayName}" deleted`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete role');
    } finally {
      setDeletingRoleId(null);
    }
  };

  // ── Staff invite
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', fullName: '', role: '' });
  const [inviting, setInviting] = useState(false);

  const handleInviteStaff = async () => {
    setInviting(true);
    try {
      const res = await fetch('/api/admin/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });
      const body = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          toast.error('An account with this email already exists');
        } else {
          toast.error(body.error ?? 'Failed to send invite');
        }
        return;
      }
      toast.success(`Invite sent to ${inviteForm.email}`);
      if (body.warning) toast.warning(body.warning);
      setShowInviteDialog(false);
      setInviteForm({ email: '', fullName: '', role: '' });
      await refetchUsers();
    } catch {
      toast.error('Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  // ── User role change
  const [roleChangePending, setRoleChangePending] = useState<{ userId: string; newRole: string } | null>(null);
  const [changingRoleFor, setChangingRoleFor] = useState<string | null>(null);

  const confirmRoleChange = async () => {
    if (!roleChangePending) return;
    setChangingRoleFor(roleChangePending.userId);
    try {
      const res = await fetch(`/api/admin/users/${roleChangePending.userId}/role`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ role: roleChangePending.newRole }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed to change role');
      }
      toast.success('User role updated. They will see changes on next login.');
      setRoleChangePending(null);
      await refetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change role');
    } finally {
      setChangingRoleFor(null);
    }
  };

  const getRoleDisplayName = useCallback((roleValue: string) => {
    const found = roles.find(r => r.value === roleValue);
    return found?.displayName ?? ROLE_LABELS[roleValue] ?? roleValue;
  }, [roles]);

  const getRoleColor = useCallback((roleValue: string) => {
    const found = roles.find(r => r.value === roleValue);
    return found?.color ?? 'slate';
  }, [roles]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">System Configuration</h1>
        <p className="text-slate-500 mt-2">Manage all aspects of the Ilmia One community system.</p>
      </div>

      {/* Main Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className="flex w-max min-w-full h-auto gap-1 lg:grid lg:grid-cols-6 lg:w-full">
            <TabsTrigger value="overview" className="flex-none gap-2 whitespace-nowrap">
              <Settings className="w-4 h-4 shrink-0" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="houses" className="flex-none gap-2 whitespace-nowrap">
              <Home className="w-4 h-4 shrink-0" />
              Houses
            </TabsTrigger>
<TabsTrigger value="users" className="flex-none gap-2 whitespace-nowrap">
              <Users className="w-4 h-4 shrink-0" />
              Users
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex-none gap-2 whitespace-nowrap">
              <Shield className="w-4 h-4 shrink-0" />
              Roles
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex-none gap-2 whitespace-nowrap">
              <FileText className="w-4 h-4 shrink-0" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-none gap-2 whitespace-nowrap">
              <Activity className="w-4 h-4 shrink-0" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Community Overview</CardTitle>
                <CardDescription>Quick statistics of the community</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <Home className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="font-medium text-slate-700">Total Houses</span>
                  </div>
                  <span className="text-2xl font-bold text-slate-900">{statsLoading ? '—' : totalHouses}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <Users className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="font-medium text-slate-700">Active Residents</span>
                  </div>
                  <span className="text-2xl font-bold text-slate-900">{statsLoading ? '—' : activeResidents}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="font-medium text-slate-700">Active Guards</span>
                  </div>
                  <span className="text-2xl font-bold text-slate-900">{statsLoading ? '—' : activeGuards}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <Activity className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="font-medium text-slate-700">Monthly Events</span>
                  </div>
                  <span className="text-2xl font-bold text-slate-900">{statsLoading ? '—' : monthlyEvents}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent System Activity</CardTitle>
                <CardDescription>Latest administrative actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!statsLoading && recentActivity.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">No recent activity</p>
                  ) : (
                    recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors">
                        <div className={`p-2 rounded-full mt-0.5 ${
                          activity.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                          activity.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                          'bg-indigo-50 text-indigo-600'
                        }`}>
                          {activity.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                           activity.type === 'warning' ? <AlertCircle className="w-4 h-4" /> :
                           <Activity className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 text-sm">{activity.action}</p>
                          {activity.detail && <p className="text-xs text-slate-500 mt-0.5">{activity.detail}</p>}
                          <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Houses Tab */}
        <TabsContent value="houses" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>House Registry</CardTitle>
                <CardDescription>Manage all houses in the community</CardDescription>
              </div>
              <Button className="gap-2 self-start sm:self-auto">
                <Plus className="w-4 h-4" />
                Add House
              </Button>
            </CardHeader>
            <CardContent>
              {housesError && (
                <div className="text-sm text-red-600 flex items-center gap-2 p-3 bg-red-50 rounded-lg mb-4 border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0" />{housesError}
                </div>
              )}
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <Input
                    placeholder="Search by house number or owner..."
                    className="flex-1"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Houses</SelectItem>
                      <SelectItem value="OCCUPIED">Occupied</SelectItem>
                      <SelectItem value="VACANT">Vacant</SelectItem>
                      <SelectItem value="UNDER_RENOVATION">Under Renovation</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={residencyFilter} onValueChange={setResidencyFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Residency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Residency</SelectItem>
                      <SelectItem value="OWNER">Owner</SelectItem>
                      <SelectItem value="TENANT">Tenant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">House No.</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Owner Name</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Residency</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Residents</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Status</th>
                        <th className="text-right p-4 text-sm font-semibold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {housesLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i}>
                            <td className="p-4"><Skeleton className="h-4 w-10" /></td>
                            <td className="p-4"><Skeleton className="h-4 w-36" /></td>
                            <td className="p-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                            <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                            <td className="p-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                            <td className="p-4 flex justify-end gap-2">
                              <Skeleton className="h-8 w-8 rounded" />
                              <Skeleton className="h-8 w-8 rounded" />
                            </td>
                          </tr>
                        ))
                      ) : houses.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-slate-400 text-sm">No houses found</td>
                        </tr>
                      ) : (
                        houses.map(house => {
                          const statusLabel =
                            house.occupancy_status === 'OCCUPIED' ? 'Occupied' :
                            house.occupancy_status === 'VACANT' ? 'Vacant' : 'Under Renovation';
                          const statusVariant =
                            house.occupancy_status === 'OCCUPIED' ? 'default' :
                            house.occupancy_status === 'VACANT' ? 'secondary' : 'outline';
                          const residentsLabel = house.totalCount > 0
                            ? `${house.totalCount} ${house.totalCount === 1 ? 'person' : 'people'}` : '—';
                          return (
                            <tr key={house.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4">
                                <span className="font-mono font-bold text-slate-900">{house.house_number}</span>
                                {house.street && (
                                  <p className="text-xs text-slate-400 mt-0.5">{house.street}</p>
                                )}
                              </td>
                              <td className="p-4"><span className="font-medium text-slate-900">{house.ownerName ?? '—'}</span></td>
                              <td className="p-4">
                                {house.residentType === 'OWNER' ? (
                                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 border">Owner</Badge>
                                ) : house.residentType === 'TENANT' ? (
                                  <Badge className="bg-amber-50 text-amber-700 border-amber-200 border">Tenant</Badge>
                                ) : (
                                  <span className="text-slate-400 text-sm">—</span>
                                )}
                              </td>
                              <td className="p-4"><span className="text-slate-600">{residentsLabel}</span></td>
                              <td className="p-4">
                                <Badge variant={statusVariant} className={house.occupancy_status === 'UNDER_RENOVATION' ? 'border-amber-300 text-amber-700 bg-amber-50' : ''}>
                                  {statusLabel}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <div className="flex justify-end gap-2">
                                  {canViewHouseholdMembers && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setViewHouseMembers(house)}>
                                            <Eye className="w-4 h-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>View members</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span><Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled><Edit className="w-4 h-4" /></Button></span>
                                      </TooltipTrigger>
                                      <TooltipContent>House editing not yet available</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span><Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" disabled><Trash2 className="w-4 h-4" /></Button></span>
                                      </TooltipTrigger>
                                      <TooltipContent>House deletion not yet available</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage all user accounts across the system</CardDescription>
              </div>
              <Button className="gap-2 self-start sm:self-auto" onClick={() => setShowInviteDialog(true)}>
                <UserPlus className="w-4 h-4" />
                Invite User
              </Button>
            </CardHeader>
            <CardContent>
              {usersError && (
                <div className="text-sm text-red-600 flex items-center gap-2 p-3 bg-red-50 rounded-lg mb-4 border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0" />{usersError}
                </div>
              )}
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <Input
                    placeholder="Search by name or email..."
                    className="flex-1"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                  />
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {rolesLoading ? (
                        <SelectItem value="__loading__" disabled>Loading…</SelectItem>
                      ) : (
                        roles.map(r => (
                          <SelectItem key={r.value} value={r.value}>{r.displayName}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status legend */}
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    Active
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                    Inactive
                  </span>
                </div>

                {usersLoading ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <Card key={i} className="border-slate-200">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Skeleton className="w-12 h-12 rounded-full" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-48" />
                              <Skeleton className="h-5 w-20" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm">No users found</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {users.map(u => {
                      const isCurrentUser = u.id === user?.id;
                      const roleColor = getRoleColor(u.role);
                      const roleDisplay = getRoleDisplayName(u.role);
                      return (
                        <Card key={u.id} className="border-slate-200">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4 flex-1 min-w-0">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                                  {getInitials(u.fullName)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-slate-900 truncate">{u.fullName}</h4>
                                    <div className={cn('w-2 h-2 rounded-full shrink-0', u.active ? 'bg-emerald-500' : 'bg-slate-300')} />
                                  </div>
                                  <p className="text-sm text-slate-500 mb-2 truncate">{u.email}</p>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border', ROLE_BADGE_COLORS[roleColor] ?? ROLE_BADGE_COLORS.slate)}>
                                      <span className={cn('w-1.5 h-1.5 rounded-full', ROLE_DOT_COLORS[roleColor] ?? ROLE_DOT_COLORS.slate)} />
                                      {roleDisplay}
                                    </span>
                                    {u.houseNumber && (
                                      <Badge variant="secondary" className="text-xs">House {u.houseNumber}</Badge>
                                    )}
                                  </div>

                                  {/* Role change — only shown when caller has assign_user_role */}
                                  {canAssignRole && !isCurrentUser && (
                                    <div className="mt-3">
                                      <Select
                                        value={u.role}
                                        onValueChange={newRoleVal => setRoleChangePending({ userId: u.id, newRole: newRoleVal })}
                                        disabled={changingRoleFor === u.id}
                                      >
                                        <SelectTrigger className="h-8 text-xs w-full">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {roles.map(r => (
                                            <SelectItem key={r.value} value={r.value} className="text-xs">
                                              {r.displayName}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1 shrink-0 ml-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span><Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled><Edit className="w-4 h-4" /></Button></span>
                                    </TooltipTrigger>
                                    <TooltipContent>User editing not yet available</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span><Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" disabled><Trash2 className="w-4 h-4" /></Button></span>
                                    </TooltipTrigger>
                                    <TooltipContent>User deletion not yet available</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          <div className={cn('grid gap-6', selectedRole ? 'lg:grid-cols-[340px_1fr]' : '')}>

            {/* Left panel: role list */}
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Role Management</CardTitle>
                  <CardDescription>Configure access permissions for each role</CardDescription>
                </div>
                {canManageRoles && (
                  <Button onClick={() => setShowNewRole(true)} className="gap-2 self-start sm:self-auto" size="sm">
                    <Plus className="w-4 h-4" />
                    New Role
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {rolesError && (
                  <div className="text-sm text-red-600 flex items-center gap-2 p-3 bg-red-50 rounded-lg mb-3 border border-red-100">
                    <AlertCircle className="w-4 h-4 shrink-0" />{rolesError}
                  </div>
                )}
                {rolesLoading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {roles.map(role => {
                      const badgeClass = ROLE_BADGE_COLORS[role.color] ?? ROLE_BADGE_COLORS.slate;
                      const dotClass   = ROLE_DOT_COLORS[role.color]   ?? ROLE_DOT_COLORS.slate;
                      const isSelected = selectedRole?.id === role.id;
                      return (
                        <div
                          key={role.id}
                          onClick={() => openEditor(role)}
                          className={cn(
                            'flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all',
                            isSelected
                              ? 'border-indigo-300 bg-indigo-50'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                          )}
                        >
                          <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', dotClass)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900 text-sm">{role.displayName}</p>
                              {role.isSystem && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-1.5 py-0.5">
                                  <Lock className="w-2.5 h-2.5" />
                                  System
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-mono">{role.value}</p>
                          </div>
                          <span className={cn('text-[10px] font-medium border rounded-full px-2 py-0.5', badgeClass)}>
                            {role.permissions.routes.length} route{role.permissions.routes.length !== 1 ? 's' : ''}
                          </span>
                          {canManageRoles && !role.isSystem && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 shrink-0"
                                    disabled={deletingRoleId === role.id}
                                    onClick={e => { e.stopPropagation(); handleDeleteRole(role); }}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete role</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right panel: permission editor */}
            {selectedRole && editorDraft && (
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {selectedRole.displayName}
                      {selectedRole.isSystem && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5">
                          <Lock className="w-3 h-3" />
                          System Role
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="font-mono text-xs mt-0.5">{selectedRole.value}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0"
                    onClick={() => { setSelectedRole(null); setEditorDraft(null); }}
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Display name */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-display-name" className="flex items-center gap-1.5">
                        Display Name
                        {selectedRole.isSystem && (
                          <Lock className="w-3 h-3 text-slate-400" />
                        )}
                      </Label>
                      <Input
                        id="edit-display-name"
                        value={editorDraft.displayName}
                        onChange={e => setEditorDraft(d => d ? { ...d, displayName: e.target.value } : d)}
                        disabled={selectedRole.isSystem}
                        className={selectedRole.isSystem ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}
                      />
                      {selectedRole.isSystem && (
                        <p className="text-xs text-slate-400">Fixed for system roles</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Color</Label>
                      <Select value={editorDraft.color} onValueChange={v => setEditorDraft(d => d ? { ...d, color: v } : d)}>
                        <SelectTrigger>
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <span className={cn('w-3 h-3 rounded-full', ROLE_DOT_COLORS[editorDraft.color] ?? '')} />
                              {COLOR_OPTIONS.find(c => c.value === editorDraft.color)?.label}
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {COLOR_OPTIONS.map(c => (
                            <SelectItem key={c.value} value={c.value}>
                              <div className="flex items-center gap-2">
                                <span className={cn('w-3 h-3 rounded-full', ROLE_DOT_COLORS[c.value] ?? '')} />
                                {c.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea
                      rows={2}
                      value={editorDraft.description}
                      onChange={e => setEditorDraft(d => d ? { ...d, description: e.target.value } : d)}
                      placeholder="Optional description of this role's purpose"
                    />
                  </div>

                  <PermissionEditor
                    permissions={editorDraft.permissions}
                    onChange={perms => setEditorDraft(d => d ? { ...d, permissions: perms } : d)}
                  />

                  <div className="flex gap-3 pt-2 border-t border-slate-100">
                    <Button
                      variant="outline"
                      onClick={() => { setSelectedRole(null); setEditorDraft(null); }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleEditorSave}
                      disabled={editorSaving || !editorDraft.displayName.trim()}
                      className="flex-1"
                    >
                      {editorSaving ? 'Saving…' : 'Save Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Placeholder when no role selected */}
            {!selectedRole && (
              <div className="hidden lg:flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm p-12">
                Select a role to view and edit its permissions
              </div>
            )}
          </div>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Audit Logs</CardTitle>
              <CardDescription>Track all administrative and system actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <Select value={actionFilter} onValueChange={v => setActionFilter(v as typeof actionFilter)}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Action Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="create">Create</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={timeFilter} onValueChange={v => setTimeFilter(v as typeof timeFilter)}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Time Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border border-slate-200 rounded-lg p-6">
                  {auditLoading ? (
                    <div className="space-y-6">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex gap-4">
                          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                          <div className="flex-1 space-y-2 pt-1">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-64" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                      <p className="text-sm">No audit logs found</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {logs.map((log, index) => (
                        <div key={log.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              log.logType === 'create' ? 'bg-emerald-100 text-emerald-600' :
                              log.logType === 'update' ? 'bg-indigo-100 text-indigo-600' :
                              log.logType === 'delete' ? 'bg-red-100 text-red-600' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {log.logType === 'create' ? <Plus className="w-5 h-5" /> :
                               log.logType === 'update' ? <Edit className="w-5 h-5" /> :
                               log.logType === 'delete' ? <Trash2 className="w-5 h-5" /> :
                               <CheckCircle2 className="w-5 h-5" />}
                            </div>
                            {index < logs.length - 1 && <div className="w-0.5 h-12 bg-slate-200 my-2" />}
                          </div>
                          <div className="flex-1 pb-6">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-semibold text-slate-900">{log.action}</h4>
                              <div className="text-right">
                                <p className="text-sm font-medium text-slate-900">{log.time}</p>
                                <p className="text-xs text-slate-400">{log.date}</p>
                              </div>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{log.details}</p>
                            <p className="text-xs text-slate-500">by <span className="font-medium">{log.userName}</span></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure system-wide preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="community-name">Community Name</Label>
                  <Input id="community-name" defaultValue="Ilmia One Community" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="malaysia">
                    <SelectTrigger id="timezone"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="malaysia">Malaysia (GMT+8)</SelectItem>
                      <SelectItem value="singapore">Singapore (GMT+8)</SelectItem>
                      <SelectItem value="thailand">Thailand (GMT+7)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select defaultValue="myr">
                    <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="myr">Malaysian Ringgit (RM)</SelectItem>
                      <SelectItem value="sgd">Singapore Dollar (S$)</SelectItem>
                      <SelectItem value="usd">US Dollar ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-slate-500">Disable public access for maintenance</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure system notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-slate-500">Send system alerts via email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Payment Reminders</Label>
                    <p className="text-sm text-slate-500">Auto-send payment due reminders</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Event Notifications</Label>
                    <p className="text-sm text-slate-500">Notify residents of new events</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Save Configuration</h3>
                  <p className="text-sm text-slate-500">Apply all changes to system settings</p>
                </div>
                <Button size="lg" className="gap-2 self-start sm:self-auto">
                  <CheckCircle2 className="w-5 h-5" />
                  Save All Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── New Role Dialog ─────────────────────────────────────── */}
      <Dialog open={showNewRole} onOpenChange={setShowNewRole}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Define a custom role with specific route access and action permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="new-display-name">Display Name <span className="text-red-500">*</span></Label>
                <Input
                  id="new-display-name"
                  placeholder="e.g. Security Supervisor"
                  value={newRole.displayName}
                  onChange={e => {
                    const name = e.target.value;
                    setNewRole(r => ({ ...r, displayName: name, value: autoKey(name) }));
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-role-key">
                  Role Key <span className="text-red-500">*</span>
                  <span className="text-slate-400 font-normal ml-1">(immutable after creation)</span>
                </Label>
                <Input
                  id="new-role-key"
                  placeholder="e.g. SECURITY_SUPERVISOR"
                  value={newRole.value}
                  onChange={e => setNewRole(r => ({ ...r, value: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') }))}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                rows={2}
                placeholder="Optional description of this role's purpose"
                value={newRole.description}
                onChange={e => setNewRole(r => ({ ...r, description: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Color</Label>
              <Select value={newRole.color} onValueChange={v => setNewRole(r => ({ ...r, color: v }))}>
                <SelectTrigger className="w-48">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <span className={cn('w-3 h-3 rounded-full', ROLE_DOT_COLORS[newRole.color] ?? '')} />
                      {COLOR_OPTIONS.find(c => c.value === newRole.color)?.label}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      <div className="flex items-center gap-2">
                        <span className={cn('w-3 h-3 rounded-full', ROLE_DOT_COLORS[c.value] ?? '')} />
                        {c.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <PermissionEditor
              permissions={newRole.permissions}
              onChange={perms => setNewRole(r => ({ ...r, permissions: perms }))}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowNewRole(false)}>Cancel</Button>
            <Button
              onClick={handleCreateRole}
              disabled={creatingRole || !newRole.displayName.trim() || !newRole.value.trim()}
            >
              {creatingRole ? 'Creating…' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Role Change Confirmation Dialog ─────────────────────── */}
      <Dialog open={!!roleChangePending} onOpenChange={() => setRoleChangePending(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change User Role?</DialogTitle>
            <DialogDescription>
              This user will be assigned the role{' '}
              <strong>{roleChangePending ? getRoleDisplayName(roleChangePending.newRole) : ''}</strong>.
              They will see the change on their next login.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRoleChangePending(null)}>Cancel</Button>
            <Button onClick={confirmRoleChange} disabled={!!changingRoleFor}>
              {changingRoleFor ? 'Updating…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Household Members Dialog ──────────────────────────── */}
      <Dialog open={!!viewHouseMembers} onOpenChange={() => setViewHouseMembers(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>House {viewHouseMembers?.house_number} — Members</DialogTitle>
            <DialogDescription>
              {viewHouseMembers?.totalCount
                ? `${viewHouseMembers.totalCount} ${viewHouseMembers.totalCount === 1 ? 'person' : 'people'} registered`
                : 'No residents registered'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Primary resident */}
            {viewHouseMembers?.primaryResident ? (
              <div className="p-4 rounded-lg border border-indigo-200 bg-indigo-50/50">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-slate-900">{viewHouseMembers.primaryResident.fullName}</h4>
                  {viewHouseMembers.primaryResident.residentType === 'OWNER' ? (
                    <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 border">Owner</Badge>
                  ) : viewHouseMembers.primaryResident.residentType === 'TENANT' ? (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 border">Tenant</Badge>
                  ) : null}
                </div>
                <p className="text-xs text-slate-500">Primary Resident</p>
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-center">
                <p className="text-sm text-slate-400">No primary resident assigned</p>
              </div>
            )}

            {/* Household members */}
            {viewHouseMembers?.members && viewHouseMembers.members.length > 0 ? (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Household Members</h4>
                <div className="space-y-2">
                  {viewHouseMembers.members.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{member.name}</p>
                        <p className="text-xs text-slate-500">{RELATIONSHIP_LABELS[member.relationship] ?? member.relationship}</p>
                      </div>
                      {member.phoneNumber && (
                        <span className="text-xs text-slate-500 font-mono">{member.phoneNumber}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : viewHouseMembers?.primaryResident ? (
              <p className="text-sm text-slate-400 text-center py-2">No additional household members</p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Invite User Dialog ────────────────────────────────────── */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Residents and staff should register through the sign-up page and await approval. Use this only for special cases — such as onboarding a guard or committee member directly. The invitee will receive an email to set their password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="invite-fullname">Full Name</Label>
              <Input
                id="invite-fullname"
                placeholder="e.g. Ahmad bin Ismail"
                value={inviteForm.fullName}
                onChange={e => setInviteForm(f => ({ ...f, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="e.g. ahmad@example.com"
                value={inviteForm.email}
                onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteForm.role} onValueChange={v => setInviteForm(f => ({ ...f, role: v }))}>
                <SelectTrigger id="invite-role">
                  <SelectValue placeholder="Select a role…" />
                </SelectTrigger>
                <SelectContent>
                  {rolesLoading ? (
                    <SelectItem value="__loading__" disabled>Loading…</SelectItem>
                  ) : (
                    roles
                      .filter(r => r.value !== 'RESIDENT')
                      .map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.displayName}</SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowInviteDialog(false); setInviteForm({ email: '', fullName: '', role: '' }); }}>
              Cancel
            </Button>
            <Button
              onClick={handleInviteStaff}
              disabled={inviting || !inviteForm.fullName.trim() || !inviteForm.email.trim() || !inviteForm.role}
            >
              {inviting ? 'Sending…' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
