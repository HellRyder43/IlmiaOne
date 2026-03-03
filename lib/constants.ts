// Application constants and configuration

import {
  LayoutDashboard,
  Wallet,
  QrCode,
  Home,
  Dog,
  Calendar,
  Activity,
  FileText,
  Users,
  ShieldCheck,
  Settings,
  UserCheck,
  type LucideIcon,
} from 'lucide-react'
import type { AppPermission } from './types'

// Navigation menu item interface
export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

// Navigation items grouped by route prefix (used by sidebar with dynamic roles)
export const NAVIGATION_BY_ROUTE: Record<string, NavItem[]> = {
  resident: [
    { href: '/resident',           label: 'Dashboard',          icon: LayoutDashboard },
    { href: '/resident/billing',   label: 'Maintenance Fees',   icon: Wallet },
    { href: '/resident/visitors',  label: 'Visitor Pass',       icon: QrCode },
    { href: '/resident/household', label: 'My Household',       icon: Home },
    { href: '/resident/pets',      label: 'Pet Registry',       icon: Dog },
    { href: '/resident/calendar',  label: 'Community Calendar', icon: Calendar },
    { href: '/resident/activity',  label: 'Activity Log',       icon: Activity },
  ],
  treasurer: [
    { href: '/treasurer',             label: 'Overview',          icon: LayoutDashboard },
    { href: '/treasurer/reports',     label: 'Financial Reports', icon: Wallet },
    { href: '/treasurer/defaulters',  label: 'Defaulter List',    icon: Users },
  ],
  guard: [
    { href: '/guard',         label: 'Guard Dashboard', icon: ShieldCheck },
    { href: '/guard/scanner', label: 'Scan Entry',      icon: QrCode },
    { href: '/guard/logs',    label: 'Entry Logs',      icon: FileText },
  ],
  admin: [
    { href: '/admin',               label: 'System Config', icon: Settings },
    { href: '/admin/registrations', label: 'Approvals', icon: UserCheck },
  ],
}

// Section label shown in the sidebar for each route prefix
export const ROUTE_SECTION_LABELS: Record<string, string> = {
  resident:  'Resident',
  treasurer: 'Financials',
  guard:     'Security',
  admin:     'Administration',
}

// Route sections available for role permission assignment
export const ROUTE_SECTIONS: Array<{ key: string; label: string; description: string }> = [
  { key: 'resident',  label: 'Resident Portal',  description: 'Billing, visitors, household, pets, calendar' },
  { key: 'treasurer', label: 'Treasurer Portal', description: 'Financial overview, reports, defaulter list' },
  { key: 'guard',     label: 'Guard Portal',     description: 'Guard dashboard, QR scanner, entry logs' },
  { key: 'admin',     label: 'Admin Panel',      description: 'System configuration, user management, roles' },
]

// All action permissions with metadata for the role editor UI
export const APP_PERMISSIONS: Array<{
  key: AppPermission
  label: string
  description: string
  category: 'residents' | 'visitors' | 'financials' | 'system'
}> = [
  { key: 'approve_registrations', label: 'Approve Registrations',  description: 'Review and approve or reject pending resident applications', category: 'residents' },
  { key: 'manage_calendar',       label: 'Manage Calendar',        description: 'Create, edit and delete community events',                    category: 'residents' },
  { key: 'scan_qr',               label: 'Scan QR Pass',           description: 'Use the QR scanner to verify and admit pre-registered visitors', category: 'visitors' },
  { key: 'log_walk_in',           label: 'Log Walk-In Visitors',   description: 'Manually register walk-in visitors at the guardhouse',          category: 'visitors' },
  { key: 'view_all_invoices',     label: 'View All Invoices',      description: 'Access billing records for all houses',                          category: 'financials' },
  { key: 'view_all_payments',     label: 'View All Payments',      description: 'Access payment transaction history for all houses',              category: 'financials' },
  { key: 'export_reports',        label: 'Export Reports',         description: 'Download financial reports as CSV or PDF',                       category: 'financials' },
  { key: 'manage_houses',         label: 'Manage Houses',          description: 'Add, edit and update house records and occupancy status',         category: 'system' },
  { key: 'manage_users',          label: 'Manage Users',           description: 'View, activate and deactivate user accounts',                    category: 'system' },
  { key: 'manage_roles',          label: 'Manage Roles',           description: 'Create, edit and delete custom roles',                           category: 'system' },
  { key: 'assign_user_role',      label: 'Assign User Roles',      description: 'Change the role assigned to any user account',                   category: 'system' },
  { key: 'view_household_members', label: 'View Household Members', description: 'View household member details for any house in the registry',     category: 'residents' },
]

// Role display names (fallback for roles not yet fetched from DB)
export const ROLE_LABELS: Record<string, string> = {
  RESIDENT:      'Resident',
  GUARD:         'Security Guard',
  AJK_COMMITTEE: 'AJK Committee',
  AJK_LEADER:    'AJK Leader',
}

// Default dashboard per role (used for login redirect)
export const ROLE_DASHBOARD: Record<string, string> = {
  RESIDENT:      '/resident',
  GUARD:         '/guard',
  AJK_COMMITTEE: '/treasurer',
  AJK_LEADER:    '/admin',
}

// Public routes (no authentication required)
export const PUBLIC_ROUTES = ['/login']

// Event category colors for calendar
export const EVENT_CATEGORY_COLORS = {
  COMMUNITY_EVENT: 'bg-blue-100 text-blue-800',
  MAINTENANCE: 'bg-amber-100 text-amber-800',
  MEETING: 'bg-purple-100 text-purple-800',
  NOTICE: 'bg-red-100 text-red-800',
  HOLIDAY: 'bg-green-100 text-green-800',
} as const

// Invoice status colors
export const INVOICE_STATUS_COLORS = {
  PAID: 'bg-green-100 text-green-800',
  PENDING: 'bg-amber-100 text-amber-800',
  OVERDUE: 'bg-red-100 text-red-800',
} as const

// Visitor pass status colors
export const VISITOR_STATUS_COLORS = {
  ACTIVE: 'bg-blue-100 text-blue-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
  USED: 'bg-green-100 text-green-800',
} as const

// Defaulter severity colors
export const SEVERITY_COLORS = {
  LOW: 'bg-yellow-100 text-yellow-800',
  MEDIUM: 'bg-orange-100 text-orange-800',
  HIGH: 'bg-red-100 text-red-800',
  CRITICAL: 'bg-red-200 text-red-900 font-bold',
} as const

// Application metadata
export const APP_NAME = 'Ilmia One'
export const APP_DESCRIPTION = 'Comprehensive Community Management System'
export const APP_VERSION = '2.0.0'

// API endpoints (for future backend integration)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
  },
  RESIDENT: {
    DASHBOARD: '/api/resident/dashboard',
    INVOICES: '/api/resident/invoices',
    VISITORS: '/api/resident/visitors',
    HOUSEHOLD: '/api/resident/household',
    PETS: '/api/resident/pets',
    CALENDAR: '/api/calendar',
    ACTIVITY: '/api/resident/activity',
  },
  TREASURER: {
    OVERVIEW: '/api/treasurer/overview',
    REPORTS: '/api/treasurer/reports',
    DEFAULTERS: '/api/treasurer/defaulters',
    CALENDAR: '/api/calendar',
  },
  GUARD: {
    DASHBOARD: '/api/guard/dashboard',
    SCAN: '/api/guard/scan',
    LOGS: '/api/guard/logs',
  },
  ADMIN: {
    CONFIG: '/api/admin/config',
    HOUSES: '/api/admin/houses',
    GUARDS: '/api/admin/guards',
  },
} as const

// Date format constants
export const DATE_FORMAT = 'dd MMM yyyy'
export const TIME_FORMAT = 'HH:mm'
export const DATETIME_FORMAT = 'dd MMM yyyy, HH:mm'

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

// File upload limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

