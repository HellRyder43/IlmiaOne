// Type definitions for Ilmia One application

export type UserRole = 'RESIDENT' | 'TREASURER' | 'GUARD' | 'ADMIN'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
  houseNumber?: string
  icNumber?: string
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
}

// Invoice types
export interface Invoice {
  id: string
  month: string
  amount: number
  status: 'PAID' | 'PENDING' | 'OVERDUE'
  dueDate: string
}

export interface InvoiceBreakdown {
  maintenance: number
  sinkingFund: number
  water?: number
  lateInterest?: number
}

export interface DetailedInvoice extends Invoice {
  breakdown: InvoiceBreakdown
}

// Visitor Pass types
export type VisitorType = 'VISITOR' | 'CONTRACTOR' | 'DELIVERY'
export type VisitorStatus = 'ACTIVE' | 'EXPIRED' | 'USED'

export interface VisitorPass {
  id: string
  visitorName: string
  type: VisitorType
  date: string
  time?: string
  status: VisitorStatus
  qrCodeUrl: string
  phoneNumber?: string
  purpose?: string
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
export type ResidencyType = 'OWNER' | 'TENANT' | 'FAMILY_MEMBER'

export interface FamilyMember {
  id: string
  name: string
  relationship: string
  icNumber: string
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
  metadata?: Record<string, any>
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
  visitorName: string
  houseNumber: string
  type: VisitorType
  checkInTime: string
  checkOutTime?: string
  status: 'INSIDE' | 'EXITED'
  guardName?: string
  vehicleNumber?: string
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
  latePaymentInterestRate: number
  gracePeriodDays: number
  waterChargePerUnit: number
}

export interface House {
  houseNumber: string
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  residencyStatus: 'OCCUPIED' | 'VACANT' | 'UNDER_RENOVATION'
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
