'use client';

import React, { useState } from 'react';
import { useAdminStats } from '@/hooks/use-admin-stats';
import { useAdminHouses } from '@/hooks/use-admin-houses';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Home,
  ShieldCheck,
  Users,
  FileText,
  Activity,
  Edit,
  Trash2,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const {
    totalHouses,
    activeResidents,
    activeGuards,
    monthlyEvents,
    recentActivity,
    isLoading: statsLoading,
  } = useAdminStats();

  const {
    houses,
    isLoading: housesLoading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
  } = useAdminHouses();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">System Configuration</h1>
        <p className="text-slate-500 mt-2">Manage all aspects of the Ilmia One community system.</p>
      </div>

      {/* Main Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto gap-2">
          <TabsTrigger value="overview" className="gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="houses" className="gap-2">
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Houses</span>
          </TabsTrigger>
          <TabsTrigger value="guards" className="gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Guards</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Audit Logs</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>House Registry</CardTitle>
                <CardDescription>Manage all houses in the community</CardDescription>
              </div>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add House
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search and Filter */}
                <div className="flex gap-4">
                  <Input
                    placeholder="Search by house number or owner..."
                    className="flex-1"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Houses</SelectItem>
                      <SelectItem value="OCCUPIED">Occupied</SelectItem>
                      <SelectItem value="VACANT">Vacant</SelectItem>
                      <SelectItem value="UNDER_RENOVATION">Under Renovation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* House List */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">House No.</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Owner Name</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Residents</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Status</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Payment</th>
                        <th className="text-right p-4 text-sm font-semibold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {housesLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i}>
                            <td className="p-4"><Skeleton className="h-4 w-10" /></td>
                            <td className="p-4"><Skeleton className="h-4 w-36" /></td>
                            <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                            <td className="p-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                            <td className="p-4"><Skeleton className="h-6 w-12 rounded-full" /></td>
                            <td className="p-4 flex justify-end gap-2">
                              <Skeleton className="h-8 w-8 rounded" />
                              <Skeleton className="h-8 w-8 rounded" />
                            </td>
                          </tr>
                        ))
                      ) : houses.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-slate-400 text-sm">
                            No houses found
                          </td>
                        </tr>
                      ) : (
                        houses.map(house => {
                          const statusLabel =
                            house.occupancy_status === 'OCCUPIED' ? 'Occupied' :
                            house.occupancy_status === 'VACANT' ? 'Vacant' :
                            'Under Renovation';
                          const statusVariant =
                            house.occupancy_status === 'OCCUPIED' ? 'default' :
                            house.occupancy_status === 'VACANT' ? 'secondary' : 'outline';
                          const residentsLabel =
                            house.totalCount > 0
                              ? `${house.totalCount} ${house.totalCount === 1 ? 'person' : 'people'}`
                              : '—';

                          return (
                            <tr key={house.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4">
                                <span className="font-mono font-bold text-slate-900">{house.house_number}</span>
                              </td>
                              <td className="p-4">
                                <span className="font-medium text-slate-900">{house.ownerName ?? '—'}</span>
                              </td>
                              <td className="p-4">
                                <span className="text-slate-600">{residentsLabel}</span>
                              </td>
                              <td className="p-4">
                                <Badge
                                  variant={statusVariant}
                                  className={house.occupancy_status === 'UNDER_RENOVATION' ? 'border-amber-300 text-amber-700 bg-amber-50' : ''}
                                >
                                  {statusLabel}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <Badge variant="outline">N/A</Badge>
                              </td>
                              <td className="p-4">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
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

        {/* Guards Tab */}
        <TabsContent value="guards" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Guard Management</CardTitle>
                <CardDescription>Manage security guard accounts and shifts</CardDescription>
              </div>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Guard
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Guard List */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Guard Name</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Badge ID</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Shift</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Status</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Last Active</th>
                        <th className="text-right p-4 text-sm font-semibold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { name: 'Azman Hashim', badge: 'G001', shift: 'Morning (7AM-3PM)', status: 'active', lastActive: 'Now' },
                        { name: 'Wong Wei Ming', badge: 'G002', shift: 'Afternoon (3PM-11PM)', status: 'active', lastActive: '5 mins ago' },
                        { name: 'Kumar Selvam', badge: 'G003', shift: 'Night (11PM-7AM)', status: 'off-duty', lastActive: '2 hours ago' },
                        { name: 'David Lim', badge: 'G004', shift: 'Morning (7AM-3PM)', status: 'off-duty', lastActive: '1 day ago' },
                      ].map((guard) => (
                        <tr key={guard.badge} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {guard.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="font-medium text-slate-900">{guard.name}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-mono font-bold text-slate-700">{guard.badge}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-slate-600 text-sm">{guard.shift}</span>
                          </td>
                          <td className="p-4">
                            <Badge variant={guard.status === 'active' ? 'default' : 'secondary'}>
                              {guard.status === 'active' ? (
                                <><div className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse"></div> On Duty</>
                              ) : (
                                'Off Duty'
                              )}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <span className="text-slate-500 text-sm">{guard.lastActive}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage all user accounts across the system</CardDescription>
              </div>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add User
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search and Filter */}
                <div className="flex gap-4">
                  <Input placeholder="Search by name or email..." className="flex-1" />
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="resident">Resident</SelectItem>
                      <SelectItem value="treasurer">Treasurer</SelectItem>
                      <SelectItem value="guard">Guard</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* User Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { name: 'Ahmad Ibrahim', email: 'ahmad@example.com', role: 'RESIDENT', house: '001', active: true },
                    { name: 'Sarah Chen', email: 'sarah@ilmiaone.com', role: 'TREASURER', house: '-', active: true },
                    { name: 'Azman Hashim', email: 'azman@ilmiaone.com', role: 'GUARD', house: '-', active: true },
                    { name: 'Admin User', email: 'admin@ilmiaone.com', role: 'ADMIN', house: '-', active: true },
                    { name: 'John Tan', email: 'john@example.com', role: 'RESIDENT', house: '003', active: false },
                    { name: 'Mary Lee', email: 'mary@example.com', role: 'RESIDENT', house: '004', active: true },
                  ].map((user, index) => (
                    <Card key={index} className="border-slate-200">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-slate-900">{user.name}</h4>
                                {user.active ? (
                                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                )}
                              </div>
                              <p className="text-sm text-slate-500 mb-2">{user.email}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {user.role}
                                </Badge>
                                {user.house !== '-' && (
                                  <Badge variant="secondary" className="text-xs">
                                    House {user.house}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
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
                {/* Filter */}
                <div className="flex gap-4">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[200px]">
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
                  <Select defaultValue="today">
                    <SelectTrigger className="w-[200px]">
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

                {/* Audit Log Timeline */}
                <div className="border border-slate-200 rounded-lg p-6">
                  <div className="space-y-6">
                    {[
                      {
                        time: '10:45 AM',
                        date: 'Today',
                        user: 'Admin User',
                        action: 'Updated house registry',
                        details: 'Modified House #015 - Changed owner details',
                        type: 'update'
                      },
                      {
                        time: '09:30 AM',
                        date: 'Today',
                        user: 'Sarah Chen',
                        action: 'Generated financial report',
                        details: 'Monthly report for January 2026',
                        type: 'create'
                      },
                      {
                        time: '08:15 AM',
                        date: 'Today',
                        user: 'Azman Hashim',
                        action: 'Logged in',
                        details: 'Guard login from Main Gate terminal',
                        type: 'login'
                      },
                      {
                        time: '11:20 PM',
                        date: 'Yesterday',
                        user: 'Admin User',
                        action: 'Deleted guard account',
                        details: 'Removed inactive guard G005',
                        type: 'delete'
                      },
                      {
                        time: '05:45 PM',
                        date: 'Yesterday',
                        user: 'Sarah Chen',
                        action: 'Updated payment status',
                        details: 'Marked 12 invoices as paid',
                        type: 'update'
                      },
                    ].map((log, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            log.type === 'create' ? 'bg-emerald-100 text-emerald-600' :
                            log.type === 'update' ? 'bg-indigo-100 text-indigo-600' :
                            log.type === 'delete' ? 'bg-red-100 text-red-600' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {log.type === 'create' ? <Plus className="w-5 h-5" /> :
                             log.type === 'update' ? <Edit className="w-5 h-5" /> :
                             log.type === 'delete' ? <Trash2 className="w-5 h-5" /> :
                             <CheckCircle2 className="w-5 h-5" />}
                          </div>
                          {index < 4 && <div className="w-0.5 h-12 bg-slate-200 my-2"></div>}
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
                          <p className="text-xs text-slate-500">by <span className="font-medium">{log.user}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
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
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
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
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
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
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input id="admin-email" type="email" defaultValue="admin@ilmiaone.com" />
                </div>
              </CardContent>
            </Card>

          </div>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Save Configuration</h3>
                  <p className="text-sm text-slate-500">Apply all changes to system settings</p>
                </div>
                <Button size="lg" className="gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Save All Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
