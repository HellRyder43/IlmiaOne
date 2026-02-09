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
  Edit,
  ShieldCheck,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { UserRole } from './types'

// Navigation menu item interface
export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

// Role-based navigation configuration
export const NAVIGATION_CONFIG: Record<UserRole, NavItem[]> = {
  RESIDENT: [
    { href: '/resident', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/resident/billing', label: 'Maintenance Fees', icon: Wallet },
    { href: '/resident/visitors', label: 'Visitor Pass', icon: QrCode },
    { href: '/resident/household', label: 'My Household', icon: Home },
    { href: '/resident/pets', label: 'Pet Registry', icon: Dog },
    { href: '/resident/calendar', label: 'Community Calendar', icon: Calendar },
    { href: '/resident/activity', label: 'Activity Log', icon: Activity },
  ],
  TREASURER: [
    { href: '/treasurer', label: 'Overview', icon: LayoutDashboard },
    { href: '/treasurer/reports', label: 'Financial Reports', icon: Wallet },
    { href: '/treasurer/defaulters', label: 'Defaulter List', icon: Users },
    { href: '/treasurer/calendar', label: 'Calendar Management', icon: Edit },
  ],
  GUARD: [
    { href: '/guard', label: 'Guard Dashboard', icon: ShieldCheck },
    { href: '/guard/scanner', label: 'Scan Entry', icon: QrCode },
    { href: '/guard/logs', label: 'Entry Logs', icon: FileText },
  ],
  ADMIN: [
    { href: '/admin', label: 'System Config', icon: Settings },
  ],
}

// Role display names
export const ROLE_LABELS: Record<UserRole, string> = {
  RESIDENT: 'Resident',
  TREASURER: 'Treasurer',
  GUARD: 'Security Guard',
  ADMIN: 'Administrator',
}

// Role-based dashboard routes
export const ROLE_DASHBOARD: Record<UserRole, string> = {
  RESIDENT: '/resident',
  TREASURER: '/treasurer',
  GUARD: '/guard',
  ADMIN: '/admin',
}

// Public routes (no authentication required)
export const PUBLIC_ROUTES = ['/login']

// Route patterns by role (for middleware protection)
export const ROLE_ROUTE_PATTERNS: Record<UserRole, RegExp[]> = {
  RESIDENT: [/^\/resident/],
  TREASURER: [/^\/treasurer/],
  GUARD: [/^\/guard/],
  ADMIN: [/^\/admin/],
}

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

// Mock user credentials for development (remove in production)
export const MOCK_CREDENTIALS = {
  resident: {
    email: 'resident@ilmiaone.com',
    password: 'resident123',
    role: 'RESIDENT' as UserRole,
  },
  treasurer: {
    email: 'treasurer@ilmiaone.com',
    password: 'treasurer123',
    role: 'TREASURER' as UserRole,
  },
  guard: {
    email: 'guard@ilmiaone.com',
    password: 'guard123',
    role: 'GUARD' as UserRole,
  },
  admin: {
    email: 'admin@ilmiaone.com',
    password: 'admin123',
    role: 'ADMIN' as UserRole,
  },
}
