// Type definitions for Ilmia One application

export type UserRole = 'RESIDENT' | 'TREASURER' | 'GUARD' | 'ADMIN'

export type ResidencyType = 'OWNER' | 'TENANT'

export type Relationship = 'SPOUSE' | 'CHILD' | 'RELATIVE' | 'TENANT'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
  houseNumber?: string
  houseId?: string
  icNumber?: string
  residentType?: ResidencyType
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'INACTIVE'
}

// Authentication types
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  fullName: string
  houseNumber: string
  icNumber: string
  email: string
  password: string
  residentType: ResidencyType
}

// Invoice types
export interface InvoiceBreakdown {
  maintenance: number
  sinkingFund: number
  water?: number
}

export interface Invoice {
  id: string
  houseId: string
  month: string // format: 'YYYY-MM'
  amount: number
  status: 'PAID' | 'PENDING' | 'OVERDUE'
  dueDate: string
  breakdown: InvoiceBreakdown
}

// Visitor Pass types (pre-registration by resident)
export type VisitorType = 'VISITOR' | 'CONTRACTOR' | 'E_HAILING' | 'COURIER' | 'OTHERS'
export type VisitorStatus = 'ACTIVE' | 'EXPIRED' | 'USED'

export interface VisitorPass {
  id: string
  residentId: string
  houseId: string
  visitorName: string
  visitorType: VisitorType
  visitReason: string
  expectedDate: string
  phoneNumber?: string
  vehicleNumber?: string
  qrCode: string
  status: VisitorStatus
  expiresAt: string
  createdAt: string
}

// Pet Registry types
export interface Pet {
  id: string
  name: string
  type: string
  breed: string
  photoUrl: string
  age?: number
  ownerName?: string
  houseNumber?: string
  vaccinationStatus?: boolean
  registrationDate?: string
}

// Household types
export interface FamilyMember {
  id: string
  houseId: string
  name: string
  relationship: Relationship
  phoneNumber?: string
}

export interface Household {
  houseNumber: string
  residencyType: ResidencyType
  moveInDate: string
  members: FamilyMember[]
}

// Community Calendar types
export type EventCategory =
  | 'COMMUNITY_EVENT'
  | 'MAINTENANCE'
  | 'MEETING'
  | 'NOTICE'
  | 'HOLIDAY'

export interface CalendarEvent {
  id: string
  title: string
  category: EventCategory
  date: string
  time?: string
  location?: string
  description?: string
  createdBy?: string
}

// Activity Log types
export type ActivityType =
  | 'PAYMENT'
  | 'VISITOR'
  | 'DOCUMENT'
  | 'MAINTENANCE'
  | 'SYSTEM'

export interface Activity {
  id: string
  type: ActivityType
  title: string
  description: string
  timestamp: string
  metadata?: Record<string, unknown>
}

// Financial types (for Treasurer)
export interface FinancialStat {
  month: string
  collected: number
  outstanding: number
  expenses?: number
}

export interface Defaulter {
  id: string
  houseNumber: string
  ownerName: string
  phoneNumber: string
  email: string
  arrears: number
  monthsOverdue: number
  lastPaymentDate?: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export interface Transaction {
  id: string
  date: string
  houseNumber: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  category: string
  paymentMethod?: string
}

// Guard types
export interface EntryLog {
  id: string
  preRegistrationId?: string
  visitorName: string
  visitorType: VisitorType
  visitReason: string
  houseNumber: string
  icNumber?: string
  vehicleNumber?: string
  phoneNumber?: string
  checkInTime: string
  checkOutTime?: string
  status: 'INSIDE' | 'EXITED'
  guardId: string
  entryMethod: 'QR_SCAN' | 'WALK_IN' | 'MANUAL' | 'SELF_SERVICE'
}

export interface GuardStats {
  visitorsInside: number
  deliveriesToday: number
  totalEntriesToday: number
  overstayedVisitors: number
}

// Admin types
export interface SystemConfig {
  siteName: string
  monthlyMaintenanceFee: number
  sinkingFundRate: number
  gracePeriodDays: number
  waterChargePerUnit: number
}

export interface House {
  id: string
  houseNumber: string
  street?: string
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  occupancyStatus: 'OCCUPIED' | 'VACANT' | 'UNDER_RENOVATION'
  registrationDate: string
}

export interface GuardAccount {
  id: string
  name: string
  employeeId: string
  phoneNumber: string
  email: string
  shiftTiming: string
  joinDate: string
  status: 'ACTIVE' | 'INACTIVE'
}
