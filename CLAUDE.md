# CLAUDE.md — Ilmia One

## Project Identity

**Ilmia One** is a community management web app for a small gated residential neighborhood in Malaysia (92 houses). It digitalizes fee billing & payment, visitor logging, and community engagement — replacing manual spreadsheets and paper-based guardhouse logs.

**Monthly maintenance fee:** RM70/month (no late fees).
**Language:** English-only UI.
**Users:** Residents, Treasurer (AJK), Guards, Super Admin.

> **Role clarification:** Treasurer and AJK (Committee) are the **same role**. In the codebase, use `TREASURER` as the role value. The Treasurer/AJK has financial oversight (invoices, payments, defaulters), event management (calendar CRUD), and resident approval authority. Do not create a separate AJK role.

---

## Tech Stack

| Layer         | Technology                                                 | Version          |
| ------------- | ---------------------------------------------------------- | ---------------- |
| Framework     | Next.js (App Router)                                       | 16.1.6           |
| Language      | TypeScript (strict mode)                                   | 5.8.2            |
| React         | React 19 (RSC default)                                     | 19.2.4           |
| Styling       | Tailwind CSS v4 + CSS variables                            | 4.1.18           |
| UI Components | Shadcn UI (27+ components installed)                       | latest           |
| Icons         | Lucide React                                               | 0.563.0          |
| Forms         | react-hook-form + Zod + @hookform/resolvers                | 7.71 / 4.3 / 5.2 |
| State         | Zustand + React Context                                    | 5.0.11           |
| Charts        | Recharts                                                   | 3.7.0            |
| Dates         | date-fns + react-day-picker                                | 4.1.0 / 9.13.1   |
| QR            | react-qr-code (generate) + @yudiel/react-qr-scanner (scan) | 2.0.18 / 2.5.1   |
| Toasts        | Sonner                                                     | 2.0.7            |
| Database      | Supabase (PostgreSQL + Auth + Storage + RLS)               | —                |
| Payment       | HerePay (FPX & Card)                                       | —                |
| Analytics     | @vercel/analytics                                          | 1.6.1            |
| Deployment    | Vercel                                                     | —                |

---

## Available MCPs

- Context7 - Use this MCP when searching for the latest docs on anything during code implementation and architecture

- Supasebase

---

## Hosting Server

- Vercel - after pushing changes to GitHub, vercel will take the latest commit and rebuild

---

## Directory Structure

```
app/
├── (auth)/login/page.tsx           # Login/Register (split-screen)
├── (dashboard)/layout.tsx          # Protected layout: sidebar + header
│   ├── resident/                   # 7 pages: dashboard, billing, visitors, household, pets, calendar, activity
│   ├── treasurer/                  # 4 pages: overview, reports, defaulters, calendar
│   ├── guard/                      # 3 pages: dashboard, scanner, logs
│   └── admin/page.tsx              # System configuration (6 tabs)
├── layout.tsx                      # Root layout with AuthProvider
├── page.tsx                        # Home/landing page
└── globals.css                     # Tailwind v4 with theme variables

components/
├── layout/sidebar.tsx              # Role-based navigation sidebar
├── layout/header.tsx               # Top header with notifications & profile
└── ui/                             # Shadcn UI primitives (button, card, badge, dialog, etc.)

lib/
├── auth.tsx                        # AuthProvider context + useAuth hook (mock — to be replaced)
├── types.ts                        # All TypeScript interfaces and types
├── constants.ts                    # Navigation config, API endpoints, color maps, mock credentials
├── utils.ts                        # cn() helper (clsx + tailwind-merge)
└── supabase/
    ├── client.ts                   # Browser Supabase client (createBrowserClient)
    ├── server.ts                   # Server Supabase client (createServerClient + cookies)
    └── proxy.ts                    # Middleware session refresh + RBAC route guard

hooks/
└── index.ts                        # Custom hooks (useAuth re-export)

middleware.ts                       # Calls lib/supabase/proxy.ts updateSession()
```

---

## Coding Conventions

These are inferred from the existing codebase. Follow them strictly.

### TypeScript & React

- All page components use `'use client'` directive (client components by default for interactive pages)
- Default export for page components: `export default function PageName()`
- Type definitions go in `lib/types.ts` — never inline type exports in page files
- Use `interface` for object shapes, `type` for unions/aliases
- Prefix enum-like types with uppercase: `'PAID' | 'PENDING' | 'OVERDUE'`
- Use `useState` with explicit generic: `useState<ScanState>('IDLE')`
- Import types with `import type` when possible

### Styling & UI

- **Primary color:** Indigo (`indigo-600`, `primary-500/600`)
- **Neutral palette:** Slate (`slate-50` through `slate-900`)
- **Status colors:** Emerald=success/active, Amber=warning/pending, Red=error/overdue, Blue=info
- Use Shadcn UI components (`Card`, `Button`, `Badge`, `Dialog`, etc.) — never build raw equivalents
- Use `cn()` from `lib/utils` for conditional class merging
- Consistent spacing: `space-y-6` or `space-y-8` for page sections, `gap-4` or `gap-6` for grids
- Page headers: `text-3xl font-bold text-slate-900` for title, `text-slate-500 mt-1` for subtitle
- Card pattern: `border-slate-200 shadow-sm` base styling
- Form inputs: `h-11 rounded-lg border border-slate-300 bg-white` with focus ring `focus:ring-4 focus:ring-primary-500/10`
- Filter tabs: `bg-slate-100 p-1 rounded-lg` container with `bg-white shadow-sm` active state
- Responsive breakpoints: Mobile-first, use `md:` and `lg:` prefixes
- Animations: `animate-in fade-in`, `transition-all`, `hover:shadow-md`

### File Patterns

- Each route page is self-contained in its `page.tsx`
- Mock data is defined at the top of page files (to be replaced with Supabase queries)
- Helper functions (getStatusBadge, getTypeIcon, etc.) live inside the page component file
- Shared constants/colors go in `lib/constants.ts`

### Naming

- Files: kebab-case (`scanner/page.tsx`)
- Components: PascalCase (`GuardDashboard`)
- Functions: camelCase (`handleManualSubmit`)
- Constants: UPPER_SNAKE_CASE (`MOCK_CREDENTIALS`)
- Types/Interfaces: PascalCase (`VisitorPass`, `EntryLog`)
- Database columns: snake_case (Supabase convention)

---

## Supabase Configuration

### Setup

- Use `@supabase/ssr` (not `@supabase/auth-helpers-nextjs`) — already installed
- Browser client: `lib/supabase/client.ts` — `createBrowserClient()` ✅ done
- Server client: `lib/supabase/server.ts` — `createServerClient()` with cookie store ✅ done
- Session proxy: `lib/supabase/proxy.ts` — `updateSession()` called from `middleware.ts` ✅ done
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - Note: uses **publishable key** (`sb_publishable_...`), not the legacy anon JWT key
- Use Supabase Auth for authentication — replace the current mock auth in `lib/auth.tsx`
- Use Supabase Storage for file uploads (pet photos, visitor ID images)
- Use Supabase Realtime for guard dashboard live updates (optional)

### Authentication

- Replace mock auth with Supabase Auth (email/password)
- Store user role and profile data in a `profiles` table linked to `auth.users`
- Use Supabase Auth helpers for Next.js middleware (`@supabase/ssr`)
- Registration flow: sign up → email verification → Treasurer/AJK approval (status: 'PENDING_APPROVAL')
- Guard accounts are created by Super Admin (not self-registration)
- **Password reset:** Use Supabase Auth's built-in `resetPasswordForEmail()` → user receives email with reset link → redirected to `/auth/reset-password` page → calls `updateUser({ password })`. Add a "Forgot password?" link on the login page.
- **Account recovery:** No separate flow needed — password reset covers this. No phone-based recovery in v1.

### Row Level Security (RLS)

- **Enable RLS on ALL tables** — no exceptions
- Residents can only read/write their own data (filter by `auth.uid()`)
- Guards can INSERT visitor logs and READ visitor logs (last 90 days only)
- Treasurer/AJK can READ all invoices, payments, and house data
- Super Admin bypasses RLS via service role key (server-side only)
- Visitor pre-registration: residents create, guards read — cross-role access via house_id

### Table Naming

- Use snake_case for all table and column names
- Prefix junction tables with both entity names: `house_members`
- Use `id` (UUID, auto-generated) as primary key for all tables
- Use `created_at` and `updated_at` timestamps on all tables
- Use soft deletes (`deleted_at`) where data retention matters

### Storage Buckets

- `pet-photos` — public read, authenticated write
- `visitor-ids` — private, guard-only access
- `receipts` — private, resident + treasurer access

---

## Data Model (Supabase Tables)

Based on PRD Section 7. All tables have `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `created_at TIMESTAMPTZ DEFAULT now()`, `updated_at TIMESTAMPTZ DEFAULT now()`.

### Core Tables

```
profiles
  - id (UUID, references auth.users.id)
  - full_name (TEXT, NOT NULL)
  - email (TEXT, NOT NULL)
  - role (TEXT: 'RESIDENT' | 'TREASURER' | 'GUARD' | 'ADMIN')
  - house_id (UUID, references houses.id, nullable for guards/admin)
  - ic_number (TEXT, masked — store last 4 only in display contexts)
  - resident_type (TEXT: 'OWNER' | 'TENANT', nullable)
  - avatar_url (TEXT, nullable)
  - status (TEXT: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED')
  - rejection_reason (TEXT, nullable)

houses
  - id (UUID)
  - house_number (TEXT, UNIQUE, NOT NULL) — simple numeric: "1", "2", ..., "92"
  - street (TEXT, nullable)
  - occupancy_status (TEXT: 'OCCUPIED' | 'VACANT' | 'UNDER_RENOVATION')
  - NOTE: One profile maps to one house. No multi-house ownership in v1.
         Ownership/tenant changes are handled by Admin reassigning the house_id
         on the profile and updating occupancy_status. Previous resident's profile
         is deactivated (status: 'INACTIVE'), not deleted.

house_members
  - id (UUID)
  - house_id (UUID, references houses.id)
  - name (TEXT, NOT NULL)
  - relationship (TEXT: 'SPOUSE' | 'CHILD' | 'RELATIVE' | 'TENANT')
  - phone_number (TEXT, nullable)

invoices
  - id (UUID)
  - house_id (UUID, references houses.id)
  - amount (NUMERIC, NOT NULL) — RM70 default
  - month (TEXT, format: 'YYYY-MM')
  - status (TEXT: 'PAID' | 'PENDING' | 'OVERDUE')
  - due_date (DATE)
  - breakdown (JSONB: { maintenance, sinking_fund, water })

payment_transactions
  - id (UUID)
  - invoice_id (UUID, references invoices.id)
  - amount (NUMERIC)
  - method (TEXT: 'FPX' | 'CARD')
  - gateway_ref_id (TEXT) — HerePay reference for auto-reconciliation
  - status (TEXT: 'SUCCESS' | 'FAILED' | 'PENDING')
  - paid_at (TIMESTAMPTZ)

visitor_pre_registrations
  - id (UUID)
  - resident_id (UUID, references profiles.id)
  - house_id (UUID, references houses.id)
  - visitor_name (TEXT, NOT NULL)
  - visitor_type (TEXT: 'VISITOR' | 'CONTRACTOR' | 'E_HAILING' | 'COURIER' | 'OTHERS')
  - visit_reason (TEXT, NOT NULL)
  - phone_number (TEXT, nullable)
  - vehicle_number (TEXT, nullable)
  - expected_date (DATE)
  - qr_code (TEXT, UNIQUE) — generated UUID or short code
  - status (TEXT: 'ACTIVE' | 'USED' | 'EXPIRED')
  - expires_at (TIMESTAMPTZ)

visitor_logs
  - id (UUID)
  - pre_registration_id (UUID, nullable, references visitor_pre_registrations.id)
  - visitor_name (TEXT, NOT NULL)
  - visitor_type (TEXT: 'VISITOR' | 'CONTRACTOR' | 'E_HAILING' | 'COURIER' | 'OTHERS')
  - visit_reason (TEXT)
  - house_number (TEXT)
  - ic_number (TEXT, nullable — last 4 digits only)
  - vehicle_number (TEXT, nullable)
  - phone_number (TEXT, nullable)
  - check_in_time (TIMESTAMPTZ, NOT NULL)
  - check_out_time (TIMESTAMPTZ, nullable)
  - status (TEXT: 'INSIDE' | 'EXITED')
  - guard_id (UUID, references profiles.id)
  - entry_method (TEXT: 'QR_SCAN' | 'WALK_IN' | 'MANUAL' | 'SELF_SERVICE')

events
  - id (UUID)
  - title (TEXT, NOT NULL)
  - category (TEXT: 'COMMUNITY_EVENT' | 'MAINTENANCE' | 'MEETING' | 'NOTICE' | 'HOLIDAY')
  - event_date (DATE)
  - event_time (TIME, nullable)
  - location (TEXT, nullable)
  - description (TEXT, nullable)
  - created_by (UUID, references profiles.id)

pets
  - id (UUID)
  - owner_id (UUID, references profiles.id)
  - house_id (UUID, references houses.id)
  - name (TEXT, NOT NULL)
  - type (TEXT, default 'CAT') — PRD focuses on cat registry
  - breed (TEXT, nullable)
  - photo_url (TEXT, nullable)
  - vaccination_status (BOOLEAN, default false)

audit_logs
  - id (UUID)
  - user_id (UUID, references profiles.id)
  - action (TEXT, NOT NULL)
  - entity_type (TEXT) — e.g., 'visitor_log', 'invoice', 'profile'
  - entity_id (UUID, nullable)
  - metadata (JSONB, nullable)
  - ip_address (TEXT, nullable)

notifications
  - id (UUID)
  - user_id (UUID, references profiles.id)
  - title (TEXT, NOT NULL)
  - message (TEXT, NOT NULL)
  - type (TEXT: 'REGISTRATION_PENDING' | 'REGISTRATION_APPROVED' | 'REGISTRATION_REJECTED' |
           'VISITOR_ARRIVED' | 'PAYMENT_RECEIVED' | 'INVOICE_GENERATED' | 'OVERDUE_REMINDER')
  - read (BOOLEAN, default false)
  - NOTE: no updated_at — notifications are immutable once created
```

### Data Retention

- `visitor_logs`: Auto-purge records older than 90 days (use Supabase scheduled function or cron)
- `audit_logs`: Retain indefinitely
- `payment_transactions`: Retain indefinitely

---

## TypeScript Types — PRD Alignment (`lib/types.ts`)

The current `lib/types.ts` has several mismatches with the PRD data model. Below are the **correct** type definitions to use. When implementing, update `lib/types.ts` to match these exactly.

### Types that must change

```typescript
// ❌ WRONG (current): 'VISITOR' | 'CONTRACTOR' | 'DELIVERY'
// ✅ CORRECT (PRD): 5 types, not 3 — 'DELIVERY' does not exist in PRD
export type VisitorType =
  | "VISITOR"
  | "CONTRACTOR"
  | "E_HAILING"
  | "COURIER"
  | "OTHERS";

// ❌ WRONG (current): 'OWNER' | 'TENANT' | 'FAMILY_MEMBER'
// ✅ CORRECT (PRD): 2 types only — FAMILY_MEMBER is not a residency type
export type ResidencyType = "OWNER" | "TENANT";

// ❌ WRONG (current): relationship is untyped string
// ✅ CORRECT (PRD): constrained dropdown values
export type Relationship = "SPOUSE" | "CHILD" | "RELATIVE" | "TENANT";
```

### VisitorPass (pre-registration by resident)

```typescript
// Aligns with `visitor_pre_registrations` table
export interface VisitorPass {
  id: string;
  residentId: string;
  houseId: string;
  visitorName: string;
  visitorType: VisitorType; // was `type` — rename for clarity
  visitReason: string; // REQUIRED per PRD (was `purpose?` optional)
  expectedDate: string; // was `date`
  phoneNumber?: string;
  vehicleNumber?: string;
  qrCode: string; // was `qrCodeUrl` — stores the code value, not a URL
  status: "ACTIVE" | "USED" | "EXPIRED";
  expiresAt: string; // NEW — missing from current type
  createdAt: string;
}
```

### EntryLog (visitor log by guard)

```typescript
// Aligns with `visitor_logs` table
export interface EntryLog {
  id: string;
  preRegistrationId?: string; // NEW — links to VisitorPass if QR scan
  visitorName: string;
  visitorType: VisitorType; // was `type`
  visitReason: string; // NEW — required per PRD
  houseNumber: string;
  icNumber?: string; // last 4 digits only
  vehicleNumber?: string;
  phoneNumber?: string; // NEW — missing from current type
  checkInTime: string;
  checkOutTime?: string;
  status: "INSIDE" | "EXITED";
  guardId: string; // was `guardName` — use ID, resolve name via join
  entryMethod: "QR_SCAN" | "WALK_IN" | "MANUAL" | "SELF_SERVICE"; // SELF_SERVICE = static QR at guardhouse
}
```

### FamilyMember (household members)

```typescript
export interface FamilyMember {
  id: string;
  houseId: string; // NEW — link to house
  name: string;
  relationship: Relationship; // was untyped `string`
  phoneNumber?: string;
  // NOTE: icNumber REMOVED — PRD says "No house member NRIC or DOB collected in v1"
}
```

### User (profile)

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  houseNumber?: string;
  houseId?: string; // NEW — UUID reference to houses table
  icNumber?: string; // last 4 digits only
  residentType?: ResidencyType; // NEW — Owner or Tenant (per PRD)
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "INACTIVE"; // NEW
}
```

### RegisterData

```typescript
export interface RegisterData {
  fullName: string;
  houseNumber: string;
  icNumber: string;
  email: string;
  password: string;
  residentType: ResidencyType; // NEW — required per PRD
}
```

### Invoice

```typescript
export interface Invoice {
  id: string;
  houseId: string; // NEW — UUID reference
  month: string; // format: 'YYYY-MM'
  amount: number;
  status: "PAID" | "PENDING" | "OVERDUE";
  dueDate: string;
  breakdown: InvoiceBreakdown; // was only on DetailedInvoice, now always present
}

export interface InvoiceBreakdown {
  maintenance: number;
  sinkingFund: number;
  water?: number;
  // NOTE: lateInterest REMOVED — PRD says "No late fees"
}
```

### SystemConfig

```typescript
export interface SystemConfig {
  siteName: string;
  monthlyMaintenanceFee: number;
  sinkingFundRate: number;
  gracePeriodDays: number;
  waterChargePerUnit: number;
  // NOTE: latePaymentInterestRate REMOVED — PRD says "No late fees"
}
```

### House

```typescript
export interface House {
  id: string; // NEW — UUID, not using houseNumber as ID
  houseNumber: string;
  street?: string; // NEW — per PRD
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  occupancyStatus: "OCCUPIED" | "VACANT" | "UNDER_RENOVATION"; // was `residencyStatus`
  registrationDate: string;
}
```

### Types that remain unchanged

- `UserRole` — correct as-is
- `LoginCredentials` — correct as-is
- `EventCategory` — correct as-is
- `CalendarEvent` — correct as-is
- `ActivityType` — correct as-is
- `FinancialStat` — correct as-is
- `Defaulter` — correct as-is
- `Transaction` — correct as-is
- `GuardStats` — correct as-is
- `GuardAccount` — correct as-is

### Migration note

- `Activity.metadata` type should be `Record<string, unknown>` not `Record<string, any>` — avoid `any`
- `DetailedInvoice` can be removed — `Invoice` now always includes `breakdown`
- `Household` interface should update `residencyType` to use the corrected `ResidencyType` (2 values, not 3)

---

## RBAC (Role-Based Access Control)

| Role                | Route Access   | Data Access                               | Can Approve       |
| ------------------- | -------------- | ----------------------------------------- | ----------------- |
| ADMIN (Super Admin) | All routes     | All data                                  | Yes — full system |
| TREASURER (AJK)     | `/treasurer/*` | All houses, invoices, payments            | Approve residents |
| RESIDENT            | `/resident/*`  | Own invoices, household, pets, events     | No                |
| GUARD               | `/guard/*`     | Visitor logs (90 days), scan verification | Verify visitors   |

**Middleware:** `middleware.ts` enforces route-level RBAC. Supabase RLS enforces data-level RBAC.

---

## Implementation Phases

### Foundation (Complete ✅)

The following infrastructure has been set up and is ready to use:

- **Supabase project** provisioned (`pajhxtwckwtjoutgqkwc`)
- **Database schema** — all 10 tables created with RLS enabled: `houses`, `profiles`, `house_members`, `invoices`, `payment_transactions`, `visitor_pre_registrations`, `visitor_logs`, `events`, `pets`, `audit_logs`, `notifications`
- **RLS policies** applied on all tables — role-based access enforced at the DB level
- **DB helper functions**: `auth_user_role()` (SECURITY DEFINER, fixed search_path), `update_updated_at_column()` trigger
- **Supabase clients**: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server)
- **Session proxy + RBAC middleware**: `lib/supabase/proxy.ts` — handles session refresh, auth redirect, and role-based route protection via `getClaims()`

---

### Phase 1: Guard & Visitor Module (CURRENT PRIORITY)

Both walk-in and pre-registered visitor flows are to be implemented simultaneously.

#### Guard Walk-In Visitor Logging

When the guard is present at the guardhouse, they register visitors manually:

1. Guard opens guard dashboard → clicks "Register Walk-In" action card
2. Guard fills visitor form directly on their device:
   - Visitor name (required)
   - IC number (optional, last 4 digits only)
   - Visitor type (required, dropdown: Visitor, Contractor, E-hailing, Courier, Others)
   - Reason for visit (required, text)
   - House number visiting (required, dropdown from house list)
   - Vehicle number (optional)
   - Phone number (optional)
3. All mandatory fields validated with Zod before submission
4. Entry saved to `visitor_logs` table with `entry_method: 'WALK_IN'`
5. Guard dashboard shows live stats (visitors inside, total entries today, deliveries, overstayed)

#### Static QR Self-Service Visitor Logging

A printed static QR code is posted at the guardhouse entrance. This handles the case when **the guard is on patrol or temporarily away from the post**. The visitor scans the QR and self-registers without needing a guard present.

**Flow:**
1. Admin generates the static QR from the Admin panel (one-time setup). The QR encodes a fixed public URL: `/visitor/self-register`
2. The QR is printed and displayed at the gate entrance
3. Visitor scans the QR with their phone → lands on a **public, unauthenticated** self-registration page
4. Visitor fills in their own details:
   - Visitor name (required)
   - Phone number (required — for accountability since no guard is present)
   - Visitor type (required, dropdown)
   - House number visiting (required, dropdown)
   - Reason for visit (required)
   - Vehicle number (optional)
   - IC number (optional, last 4 digits only)
5. On submit → entry saved to `visitor_logs` with `entry_method: 'SELF_SERVICE'`
6. Guard reviews self-registered entries on their dashboard when they return

**Design notes:**
- The static QR itself never expires and never changes — only the URL it points to matters
- The `/visitor/self-register` page is fully public (no login required)
- Phone number is required (not optional) in this flow for accountability
- Guard can flag or remove suspicious self-service entries
- In-app notification sent to guard's device when a self-service entry is created (Supabase Realtime)

#### Resident Visitor Pre-Registration

1. Resident opens Visitor Pass page → fills pre-registration form:
   - Visitor name (required)
   - Visitor type (required, dropdown: Visitor, Contractor, E-hailing, Courier, Others)
   - Reason for visit (required, text)
   - Expected arrival date (required)
   - Phone number (optional)
   - Vehicle number (optional)
2. On submit → system generates a unique QR code and stores it in `visitor_pre_registrations`
3. Resident sees a pass card with the QR image and visitor details
4. Resident shares the **QR image + visit details** directly to the visitor (via WhatsApp share, download image, or copy details). There is **no public-facing page** for the visitor — the visitor simply shows the QR image to the guard at the gate.
5. QR expires at end of expected date (23:59) by default

#### Guard QR Scan Verification

1. Guard opens scanner → scans QR code from pre-registered visitor
2. System verifies: QR exists, not expired, not already used
3. If valid → show visitor details → guard confirms → entry logged to `visitor_logs` with `entry_method: 'QR_SCAN'`, pre-registration status updated to 'USED'
4. If invalid/expired → show error with reason → guard denies entry
5. Manual code entry fallback if camera fails

#### Guard Entry Logs

1. Guard views all visitor logs (filtered to last 90 days)
2. Filter by: status (Inside/Exited/All), visitor type, date range
3. Search by name, house number, or vehicle plate
4. Check-out action: guard marks visitor as exited → updates `check_out_time` and status
5. Export to CSV (stretch goal)

#### Edge Cases to Handle

- Expired QR: reject and prompt re-registration
- Duplicate entries: warn guard if same visitor name + house checked in within last hour
- Invalid IC: guard manually corrects or skips
- Camera permission denied: fall back to manual code entry
- Offline mode: not required for v1
- Self-service abuse: guard can delete or flag suspicious `SELF_SERVICE` entries; all self-service entries are visually distinct in the logs (tagged "Self-Service") so the guard can review them on return

#### Key Files to Modify

- `app/(dashboard)/guard/page.tsx` — connect to live Supabase data
- `app/(dashboard)/guard/scanner/page.tsx` — real QR scanning + Supabase verification
- `app/(dashboard)/guard/logs/page.tsx` — Supabase queries with filters
- `app/(dashboard)/resident/visitors/page.tsx` — pre-registration with Supabase + real QR generation
- `lib/types.ts` — update/align types with Supabase schema
- ✅ `lib/auth.tsx` — Supabase Auth (done)

#### New Files to Create

- ✅ `lib/supabase/client.ts` — browser Supabase client (done)
- ✅ `lib/supabase/server.ts` — server Supabase client (done)
- `app/api/guard/scan/route.ts` — API route for QR verification
- `app/api/visitors/pre-register/route.ts` — API route for pre-registration
- `app/visitor/self-register/page.tsx` — **public** (unauthenticated) self-service form linked from the static guardhouse QR

---

### Phase 2: Authentication & User Registration ✅ COMPLETED

#### Requirements

1. Replace mock auth in `lib/auth.tsx` with Supabase Auth (email/password)
2. Registration flow: sign up → email verification → status set to 'PENDING_APPROVAL'
3. Treasurer/Admin receives in-app notification of new registration
4. Treasurer approves/rejects with reason → resident notified via email
5. Rejected residents can edit and resubmit
6. Guard accounts created by Super Admin only (no self-registration)
7. ✅ Middleware validates Supabase session via `getClaims()` (done in `lib/supabase/proxy.ts`)
8. Password reset: "Forgot password?" link on login → Supabase `resetPasswordForEmail()` → reset page at `/auth/reset-password`
9. ✅ Authenticated root `/` redirects to role-based dashboard (done in proxy.ts)
10. Remove all `console.log` statements from auth flow before production

#### Key Files

- `lib/auth.tsx` — rewrite with Supabase Auth (currently still mock)
- `app/(auth)/login/page.tsx` — connect to Supabase Auth, add forgot password link
- `app/(auth)/reset-password/page.tsx` — new, password reset form
- ✅ `middleware.ts` + `lib/supabase/proxy.ts` — session-based middleware (done)
- `lib/constants.ts` — remove `MOCK_CREDENTIALS`

---

### Phase 3: Billing & Payment (Fee Collection)

#### Requirements

1. Auto-generate RM70 monthly invoices via Supabase pg_cron on the **1st of each month at 00:01 MYT**
   - Only generate for houses with `occupancy_status: 'OCCUPIED'`
   - Skip vacant and under-renovation houses
   - If a resident moves in mid-month, first invoice is generated for the following full month (no prorating in v1)
   - Duplicate prevention: check if invoice for that `house_id` + `month` already exists before inserting
2. Resident dashboard shows current + past invoices with status
3. "Pay" button → redirect to HerePay payment gateway (FPX or Card)
4. HerePay webhook callback → auto-mark invoice as PAID using `gateway_ref_id`
5. Auto-email receipt on successful payment (via Resend)
6. Invoice breakdown: maintenance fee + sinking fund + water (if applicable)

#### HerePay Integration

- REST API for payment initiation
- Webhook endpoint: `app/api/payments/webhook/route.ts`
- Validate webhook signatures
- Sandbox testing before go-live
- FPX fees ~RM1/txn — payer funds it

#### Key Files

- `app/(dashboard)/resident/billing/page.tsx` — connect to Supabase + HerePay
- `app/api/payments/initiate/route.ts` — new
- `app/api/payments/webhook/route.ts` — new
- Supabase function for monthly invoice generation (cron)

---

### Phase 4: Treasurer Dashboard & Reconciliation

#### Requirements

1. Real-time analytics: paid/unpaid counts, collection rate, total funds
2. Filter by arrears amount, house number, month
3. Auto-reconcile payments using HerePay reference IDs
4. Defaulter list with severity levels (based on months overdue)
5. Export reports as CSV and PDF
6. Calendar management: create/edit/delete community events

#### Key Files

- `app/(dashboard)/treasurer/page.tsx` — live Supabase queries
- `app/(dashboard)/treasurer/reports/page.tsx` — Recharts with real data
- `app/(dashboard)/treasurer/defaulters/page.tsx` — Supabase query with severity calculation
- `app/(dashboard)/treasurer/calendar/page.tsx` — CRUD events

---

### Phase 5: Resident Profile & Household

#### Requirements

1. Extended profile: resident type (Owner/Tenant), house member count
2. Household members: dynamic form (add/remove rows) with name + relationship dropdown (Spouse, Child, Relative, Tenant)
3. Validation: at least 1 household member if resident type is 'Tenant'
4. Auto-save or explicit "Save Changes" button
5. Mobile: stack fields vertically, accordion for household members
6. House member data visible only to resident and AJK

#### Key Files

- `app/(dashboard)/resident/household/page.tsx` — Supabase CRUD
- `lib/types.ts` — align FamilyMember with relationship dropdown

---

### Phase 6: Pet Registry

#### Requirements

1. Resident uploads cat photo + name
2. Community-visible list of registered pets
3. Photo upload to Supabase Storage (`pet-photos` bucket)
4. Allowed formats: JPG, PNG (max 5MB)
5. Purpose: identify owned cats vs strays

#### Key Files

- `app/(dashboard)/resident/pets/page.tsx` — Supabase CRUD + Storage
- Supabase Storage bucket configuration

---

### Phase 7: Community Calendar

#### Requirements

1. Display events created by AJK
2. Events show title, date, time, location, description
3. Category-based color coding (already defined in `lib/constants.ts`)
4. AJK can create/edit/delete events
5. Residents can view only

#### Key Files

- `app/(dashboard)/resident/calendar/page.tsx` — read-only Supabase query
- `app/(dashboard)/treasurer/calendar/page.tsx` — CRUD operations

---

### Phase 8: Admin System Configuration

#### Requirements

1. House number mapping (1-92): manage house registry
2. Guard account management: create/deactivate guard accounts
3. User management: view all users, filter by role, approve/reject registrations
4. System settings: maintenance fee amount, sinking fund rate, grace period
5. Audit logs: all admin/AJK actions with timestamps
6. System health monitoring

#### Key Files

- `app/(dashboard)/admin/page.tsx` — connect all 6 tabs to Supabase

---

### Phase 9: Advanced Features (Future / Stretch Goals)

- **OCR for NRIC/Driving License:** Stretch goal only. Manual entry is the primary flow for guards. If implemented, use a client-side OCR library (e.g., Tesseract.js) to extract text from a photo of the IC — pre-fill the form fields, but always allow manual override. Do not store the IC image. No accuracy threshold required — treat OCR as a convenience shortcut, not a reliable input.
- Automated payment reminders (email via Resend, 7 days before due date + on overdue)
- Analytics dashboard enhancements
- Continuous UX improvements
- Data export automation (CSV/PDF for all modules)

---

## Notification Strategy

There is no WhatsApp API in v1. Notifications use two channels:

### In-App Notifications

- Store in a `notifications` table: `id`, `user_id`, `title`, `message`, `type`, `read`, `created_at`
- Display via the bell icon in the header (already in UI) with unread count badge
- Types: `REGISTRATION_PENDING` (to Treasurer), `REGISTRATION_APPROVED/REJECTED` (to Resident), `VISITOR_ARRIVED` (to Resident), `PAYMENT_RECEIVED` (to Resident), `INVOICE_GENERATED` (to Resident), `OVERDUE_REMINDER` (to Resident)
- Use Supabase Realtime subscription on the `notifications` table for live updates (no polling)

### Email Notifications (via Resend)

- **Auth emails:** Handled by Supabase Auth (verification, password reset)
- **Payment receipts:** Sent on successful payment via HerePay webhook handler
- **Registration decisions:** Sent when Treasurer approves/rejects a resident
- **Overdue reminders:** Sent via Supabase pg_cron (Phase 9 stretch goal)
- Email service: Use [Resend](https://resend.com) with `@react-email` templates. Environment variable: `RESEND_API_KEY`

### What Does NOT Get Notifications in v1

- Visitor pre-registration creation (resident already sees it in their dashboard)
- Guard shift changes
- Calendar event reminders

---

## Data Fetching & Error Handling

### Data Fetching Pattern

- **Server Components** for initial page data: fetch data in the page component using the server Supabase client (`lib/supabase/server.ts`). This keeps API keys hidden and improves performance.
- **Client Components** for interactive mutations: use `'use client'` components with the browser Supabase client (`lib/supabase/client.ts`) for form submissions, real-time subscriptions, and optimistic updates.
- **Custom hooks per entity** in a `hooks/` directory for reusable client-side data logic:
  - `hooks/use-visitor-logs.ts` — fetch, filter, create, check-out visitors
  - `hooks/use-pre-registrations.ts` — create, list, revoke pre-registrations
  - `hooks/use-notifications.ts` — fetch, mark-read, realtime subscription
  - Pattern: each hook wraps Supabase queries + returns `{ data, isLoading, error, mutate }`
- **No raw `useEffect` data fetching** — always use custom hooks or server components
- **Sonner toasts** for mutation feedback: `toast.success('Visitor checked in')`, `toast.error('Failed to save')`

### Error Handling

- Add `loading.tsx` and `error.tsx` files to every route group: `(auth)/`, `(dashboard)/`, and each role subfolder (`resident/`, `guard/`, `treasurer/`, `admin/`)
- `loading.tsx`: Use Shadcn `Skeleton` components matching the page layout
- `error.tsx`: Show a Card with error message + "Try Again" button that calls `reset()`
- Form validation errors: Display inline below the field using react-hook-form's `formState.errors`
- API/network errors: Catch in custom hooks, show via Sonner toast, never crash the page
- Never use empty `catch {}` blocks — always log or surface the error

---

## Security & Compliance

### Malaysian PDPA Compliance

- Explicit consent on visitor forms before data collection
- NRIC: only store and display last 4 digits
- Email: mask partially in UI where needed
- No full ID images stored unless privacy policy accepted
- House member data visible only to resident + AJK
- Visitor reason and type visible to Guard + AJK only

### Data Security

- TLS in transit (Vercel + Supabase enforce this)
- AES-256 at rest (Supabase default)
- RLS on all tables — no exceptions
- Service role key used only server-side, never exposed to client
- Audit trail for all admin/AJK actions

### Data Retention

- Visitor logs: auto-purge after 90 days
- Payment records: retain indefinitely
- Audit logs: retain indefinitely

---

## Testing Strategy

### UAT Scenarios (from PRD)

1. Resident signup → AJK approval → dashboard access
2. Resident pre-registers visitor → QR generated → guard scans → entry logged
3. Guard logs walk-in visitor → visible in logs → check-out
4. Failed payment and retry
5. Role-based access enforcement (each role sees only their routes/data)
6. Expired QR rejection at guard scanner

### Development Testing

- Use `npm run type-check` (tsc --noEmit) before commits
- Use `npm run lint` for ESLint checks
- Use `npm run build` to verify production builds
- Test responsive layouts at 375px (mobile), 768px (tablet), 1280px (desktop)

---

## Git Commit Rules

- **Commit after every minor or major code change** — don't batch multiple unrelated changes into one commit
- **No `Co-Authored-By` lines** — never append Co-Authored-By to commit messages
- **Commit message format:** Use conventional commits style
  - `feat: add walk-in visitor form for guard module`
  - `fix: resolve QR scanner camera permission error`
  - `refactor: extract visitor type helper to constants`
  - `chore: update Supabase types after schema change`
  - `style: align guard dashboard stat cards on mobile`
- **Prefix types:** `feat`, `fix`, `refactor`, `chore`, `style`, `docs`, `test`
- Keep the subject line under 72 characters
- Use imperative mood ("add", "fix", "update" — not "added", "fixes", "updated")
- Stage only the files relevant to the change — avoid `git add -A` or `git add .`
- Never commit `.env.local`, credentials, or API keys

---

## Common Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run type-check   # TypeScript type checking
```

---

## Do's and Don'ts

### Do

- Use Shadcn UI components from `components/ui/` — they're already installed and themed
- Use `cn()` from `lib/utils` for conditional Tailwind classes
- Define all shared types in `lib/types.ts`
- Define constants and color maps in `lib/constants.ts`
- Use Supabase RLS for data access control — never trust client-side role checks alone
- Keep page components in their route folder as `page.tsx`
- Use Sonner (`toast()`) for user-facing notifications
- Follow the existing indigo + slate color palette
- Use `date-fns` for all date formatting and manipulation
- Validate **all** forms with react-hook-form + Zod schemas (not raw `useState` + `onChange`)
- Use server components for data fetching, client components for interactivity
- Add `loading.tsx` and `error.tsx` to every route group
- Use custom hooks in `hooks/` for reusable Supabase queries
- Validate middleware auth server-side via `supabase.auth.getUser()` — never trust cookies alone
- Align `VisitorType` with PRD values: `'VISITOR' | 'CONTRACTOR' | 'E_HAILING' | 'COURIER' | 'OTHERS'`

### Don't

- Don't expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- Don't store full NRIC numbers — mask to last 4 digits
- Don't skip RLS on any table
- Don't create new UI primitives if a Shadcn component exists
- Don't use inline styles — always use Tailwind classes
- Don't add new npm packages without justification — the stack is comprehensive
- Don't use `any` type — define proper interfaces
- Don't hardcode mock data in production code — use Supabase queries
- Don't commit `.env.local` or any file containing API keys
- Don't leave `console.log` statements in production code — remove before committing
- Don't store the full user object in cookies — only the Supabase session token
- Don't use raw `useEffect` for data fetching — use custom hooks or server components
- Don't create pages without a corresponding `loading.tsx` in the route group
