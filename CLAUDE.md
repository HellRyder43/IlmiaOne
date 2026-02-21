# CLAUDE.md — Ilmia One

## Project Identity

**Ilmia One** is a community management web app for a small gated residential neighborhood in Malaysia (92 houses). It digitalizes fee billing & payment, visitor logging, and community engagement — replacing manual spreadsheets and paper-based guardhouse logs.

**Monthly maintenance fee:** RM70/month (no late fees).
**Language:** English-only UI.
**Users:** Residents, AJK Committee, Guards, AJK Leader (Super Admin).

> **Role values in DB:** `RESIDENT`, `GUARD`, `AJK_COMMITTEE`, `AJK_LEADER`. Custom roles can also be created by the AJK Leader and are stored in the `roles` table. `AJK_COMMITTEE` handles financial oversight (invoices, payments, defaulters), calendar management, and resident registration approvals. `AJK_LEADER` has full system access. Do **not** use `TREASURER` or `ADMIN` — those values no longer exist in the DB.

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
- Browser client: `lib/supabase/client.ts` (`createBrowserClient()`)
- Server client: `lib/supabase/server.ts` (`createServerClient()` with cookie store)
- Session proxy: `lib/supabase/proxy.ts` — `updateSession()` called from `middleware.ts`
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - Note: uses **publishable key** (`sb_publishable_...`), not the legacy anon JWT key
- Supabase Auth for authentication (email/password) — implemented in `lib/auth.tsx`
- Supabase Storage for file uploads (pet photos, visitor ID images)
- Supabase Realtime for guard dashboard live updates (optional)

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

Based on PRD Section 7. All tables have `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` and `created_at TIMESTAMPTZ DEFAULT now()`. Most tables also have `updated_at TIMESTAMPTZ DEFAULT now()`, **except** `audit_logs` and `notifications` which are immutable (no `updated_at`).

### Core Tables

```
profiles
  - id (UUID, references auth.users.id)
  - full_name (TEXT, NOT NULL)
  - email (TEXT, NOT NULL)
  - role (TEXT) — FK → roles.value; system values: 'RESIDENT' | 'GUARD' | 'AJK_COMMITTEE' | 'AJK_LEADER'
  - house_id (UUID, references houses.id, nullable for guards/admin)
  - ic_number (TEXT, masked — store last 4 only in display contexts)
  - resident_type (TEXT: 'OWNER' | 'TENANT', nullable)
  - avatar_url (TEXT, nullable)
  - status (TEXT: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'INACTIVE')
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
  - qr_code (TEXT, UNIQUE, DEFAULT gen_random_uuid()::text) — auto-generated on insert
  - status (TEXT: 'ACTIVE' | 'USED' | 'EXPIRED', DEFAULT 'ACTIVE')
  - expires_at (TIMESTAMPTZ)

visitor_logs
  - id (UUID)
  - pre_registration_id (UUID, nullable, references visitor_pre_registrations.id)
  - visitor_name (TEXT, NOT NULL)
  - visitor_type (TEXT: 'VISITOR' | 'CONTRACTOR' | 'E_HAILING' | 'COURIER' | 'OTHERS')
  - visit_reason (TEXT, nullable) — nullable in DB; required in walk-in form validation only
  - house_number (TEXT)
  - ic_number (TEXT, nullable — last 4 digits only)
  - vehicle_number (TEXT, nullable)
  - phone_number (TEXT, nullable)
  - check_in_time (TIMESTAMPTZ, DEFAULT now())
  - check_out_time (TIMESTAMPTZ, nullable)
  - status (TEXT: 'INSIDE' | 'EXITED', DEFAULT 'INSIDE')
  - guard_id (UUID, nullable, references profiles.id) — nullable for SELF_SERVICE entries
  - entry_method (TEXT: 'QR_SCAN' | 'WALK_IN' | 'SELF_SERVICE')

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
  - user_id (UUID, nullable, references profiles.id)
  - action (TEXT, NOT NULL)
  - entity_type (TEXT, nullable) — e.g., 'visitor_log', 'invoice', 'profile'
  - entity_id (UUID, nullable)
  - metadata (JSONB, nullable)
  - ip_address (TEXT, nullable)
  - NOTE: no updated_at — audit logs are immutable once created

notifications
  - id (UUID)
  - user_id (UUID, references profiles.id)
  - title (TEXT, NOT NULL)
  - message (TEXT, NOT NULL)
  - type (TEXT: 'REGISTRATION_PENDING' | 'REGISTRATION_APPROVED' | 'REGISTRATION_REJECTED' |
           'VISITOR_ARRIVED' | 'PAYMENT_RECEIVED' | 'INVOICE_GENERATED' | 'OVERDUE_REMINDER')
  - read (BOOLEAN, DEFAULT false)
  - NOTE: no updated_at — notifications are immutable once created
```

### Seeded & Existing Data

> Last verified: 2026-02-15 (project `qznhxahydseejcpgrxlb`, Singapore)

**houses:** 1 row — house 12, OCCUPIED. Houses 1–11, 13–92 not seeded (required before Phase 3).

**profiles:** 4 rows (all `status: APPROVED`, emails pre-confirmed):
- `resident@ilmiaone.com` / `resident123` → RESIDENT, OWNER, house 12 (UUID: `aaaaaaaa-0001-0001-0001-000000000001`)
- `treasurer@ilmiaone.com` / `treasurer123` → AJK_COMMITTEE (UUID: `aaaaaaaa-0002-0002-0002-000000000002`)
- `guard@ilmiaone.com` / `guard123` → GUARD (UUID: `aaaaaaaa-0003-0003-0003-000000000003`)
- `admin@ilmiaone.com` / `admin123` → AJK_LEADER (UUID: `aaaaaaaa-0004-0004-0004-000000000004`)

**All other tables** — 0 rows.

### Data Retention

- `visitor_logs`: Auto-purge records older than 90 days (use Supabase scheduled function or cron)
- `audit_logs`: Retain indefinitely
- `payment_transactions`: Retain indefinitely

---

## TypeScript Types (`lib/types.ts`)

All types are defined in `lib/types.ts`. Key rules to remember:

- `VisitorType`: 5 values — `'VISITOR' | 'CONTRACTOR' | 'E_HAILING' | 'COURIER' | 'OTHERS'` (no `DELIVERY`)
- `ResidencyType`: 2 values — `'OWNER' | 'TENANT'` (no `FAMILY_MEMBER`)
- `Relationship`: `'SPOUSE' | 'CHILD' | 'RELATIVE' | 'TENANT'`
- `Invoice` always includes `breakdown: InvoiceBreakdown` — no separate `DetailedInvoice`
- `InvoiceBreakdown` has no `lateInterest` — PRD has no late fees
- `User.status`: `'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'INACTIVE'`
- `Activity.metadata`: `Record<string, unknown>` (not `any`)

---

## RBAC (Role-Based Access Control)

| Role          | Route Access                      | Data Access                               | Can Approve       |
| ------------- | --------------------------------- | ----------------------------------------- | ----------------- |
| AJK_LEADER    | All routes                        | All data                                  | Yes — full system |
| AJK_COMMITTEE | `/treasurer/*` + `/guard/*`       | All houses, invoices, payments            | Approve residents |
| RESIDENT      | `/resident/*`                     | Own invoices, household, pets, events     | No                |
| GUARD         | `/guard/*`                        | Visitor logs (90 days), scan verification | Verify visitors   |

**Middleware:** `middleware.ts` enforces route-level RBAC. Supabase RLS enforces data-level RBAC.

---

## Implementation Phases

### Foundation (Complete ✅)

The following infrastructure has been set up and is ready to use:

- **Supabase project** provisioned (`qznhxahydseejcpgrxlb`, region: `ap-southeast-1` Singapore)
- **Database schema** — all 11 tables created via `apply_migration` with RLS enabled: `houses`, `profiles`, `house_members`, `invoices`, `payment_transactions`, `visitor_pre_registrations`, `visitor_logs`, `events`, `pets`, `audit_logs`, `notifications`
- **Migrations applied** (in order, tracked in Supabase migration history):
  1. `create_updated_at_trigger_function`
  2. `create_core_tables`
  3. `create_updated_at_triggers` — 9 tables (`audit_logs` and `notifications` excluded, no `updated_at`)
  4. `create_db_functions`
  5. `enable_rls_and_policies`
- **RLS policies** applied on all 11 tables — 20 policies covering role-based access per table
- **DB helper functions**:
  - `public.auth_user_role()` — SECURITY DEFINER, fixed search_path; returns current user's role from `profiles`; used inside RLS policies
  - `public.update_updated_at_column()` — trigger function, fires BEFORE UPDATE on 9 tables
- **JWT hook** — `public.custom_access_token_hook` injects `user_role` into every JWT on issuance; granted to `supabase_auth_admin`
  - **Must be enabled in Dashboard:** Authentication → Hooks → Custom Access Token → Postgres → `public.custom_access_token_hook`
  - **Fallback** (if hook not enabled): `lib/supabase/proxy.ts` reads `user.app_metadata?.user_role` — only works if `raw_app_meta_data` is manually set per user in `auth.users`
- **Seed data**: house 12 (OCCUPIED) + 4 test profiles with fixed UUIDs (see Seeded & Existing Data section)
- **Supabase clients**: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server)
- **Session proxy + RBAC middleware**: `lib/supabase/proxy.ts` — handles session refresh, auth redirect, and role-based route protection via `getClaims()`

---

### Phase 1: Guard & Visitor Module ✅ COMPLETED

Walk-in logging, QR scan verification, resident pre-registration, self-service kiosk (`/visitor/self-register`), and entry logs with check-out are fully implemented. See `app/(dashboard)/guard/` and `app/(dashboard)/resident/visitors/`.

---

### Phase 2: Authentication & User Registration ✅ COMPLETED

Supabase Auth (email/password), registration with PENDING_APPROVAL flow, AJK approval/rejection with Resend emails, rejection banner + resubmit, password reset at `/auth/reset-password`, dynamic roles, and real-time notification bell are fully implemented.

---

### Phase 3: Billing & Payment (Fee Collection) (CURRENT PRIORITY)

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

## Known Issues & Technical Debt

> Last audited: 2026-02-15. Items are grouped by priority.

### Critical — Must fix before Phase 3

**1. Only house 12 is seeded**
The `houses` table has 1 row (house 12). The guard walk-in dropdown and self-register form only show house 12. Pre-registrations are also limited to house 12 residents. pg_cron will only generate 1 invoice when Phase 3 billing runs. **All 92 houses must be inserted before Phase 3 goes live.**

**2. pg_cron invoice generation not set up**
Phase 3 requires invoices to auto-generate on the 1st of each month at 00:01 MYT. No Supabase Edge Function or pg_cron job exists yet. Must be created before the first billing cycle or invoices will not generate.

**3. No DB indexes on high-query columns**
As data grows, missing indexes will cause slow queries:
- `visitor_logs(check_in_time)` — every page load filters by last 90 days
- `visitor_logs(guard_id)` — used in RLS policies
- `invoices(house_id, month)` — duplicate prevention on cron insert
- `notifications(user_id, read)` — bell icon badge count

### Security Gaps — Fix soon

**4. INACTIVE profile status — ✅ RESOLVED**
`lib/supabase/proxy.ts` now checks `user_status` from JWT and redirects INACTIVE users to `/login?reason=inactive`.

**5. No rate limiting on the public self-register endpoint**
`POST /api/visitor/self-register` is unauthenticated with no rate limiting, CAPTCHA, or IP throttling. It can be trivially spammed to flood `visitor_logs` with fake entries.

### Missing Implementation (Phase 2 gap)

**6. Notifications are unimplemented**
The `notifications` table has 0 rows. No code inserts into it anywhere. Phase 2 requirement — "Treasurer receives in-app notification of new registration" — was not built. The header bell icon shows nothing. Must be implemented before user onboarding begins.

### Data Integrity Risks

**7. Duplicate walk-in check not implemented**
CLAUDE.md specifies: *"warn guard if same visitor name + house checked in within last hour."* The `/api/guard/walk-in` route has no such check. Guards can accidentally double-log the same visitor with no warning.

**8. Visitors stuck as INSIDE indefinitely**
There is no auto-checkout mechanism (e.g., midnight job or configurable max visit duration). The overstayed count accumulates forever. After weeks of real use, the "Currently Inside" filter will be polluted with entries that were never checked out.

**9. `houseId` null risk at pre-registration**
`usePreRegistrations` reads `houseId` from the resident's profile. If a resident's `house_id` is null (profile setup gap), the POST to `/api/visitors/pre-register` will fail with a DB not-null violation, surfacing as a generic 500 to the user. The API should validate and return a clear error.

**10. `visitor_logs` 90-day auto-purge not implemented**
Data retention policy requires auto-purge of logs older than 90 days. No pg_cron or Edge Function exists for this. The table will grow without bound.

### Minor / Technical Debt

**11. Expiry time hardcodes UTC+8 offset**
In `app/api/visitors/pre-register/route.ts`, expiry is calculated as `${expectedDate}T15:59:59Z` (23:59:59 MYT = UTC+8 hardcoded). Should use a timezone-aware calculation or DB-side `AT TIME ZONE 'Asia/Kuala_Lumpur'` to be explicit and safe.

**12. Overstayed threshold is hardcoded at 4 hours**
`useGuardStats` hardcodes 4 hours as the overstayed threshold. Should be a configurable value in `SystemConfig` rather than a magic number in client code.

**13. `hooks/index.ts` only exports `useAuth`**
`useVisitorLogs` and `usePreRegistrations` are imported by direct file path in components. All custom hooks should be re-exported from `hooks/index.ts` for consistency.

**14. Redundant `qr_code` DB default**
The `visitor_pre_registrations.qr_code` column has `DEFAULT gen_random_uuid()::text` but the API always passes an explicit UUID. The DB default is never used — remove it to avoid confusion, or rely on it and stop generating in the API.

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

- Use Supabase RLS for data access control — never trust client-side role checks alone
- Keep page components in their route folder as `page.tsx`
- Use Sonner (`toast()`) for user-facing notifications
- Use `date-fns` for all date formatting and manipulation
- Validate **all** forms with react-hook-form + Zod schemas (not raw `useState` + `onChange`)
- Use server components for data fetching, client components for interactivity
- Add `loading.tsx` and `error.tsx` to every route group
- Use custom hooks in `hooks/` for reusable Supabase queries
- Validate middleware auth server-side via `supabase.auth.getUser()` — never trust cookies alone

### Don't

- Don't expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- Don't store full NRIC numbers — mask to last 4 digits
- Don't skip RLS on any table
- Don't use inline styles — always use Tailwind classes
- Don't add new npm packages without justification — the stack is comprehensive
- Don't use `any` type — define proper interfaces
- Don't hardcode mock data in production code — use Supabase queries
- Don't commit `.env.local` or any file containing API keys
- Don't leave `console.log` statements in production code — remove before committing
- Don't store the full user object in cookies — only the Supabase session token
- Don't use raw `useEffect` for data fetching — use custom hooks or server components
- Don't create pages without a corresponding `loading.tsx` in the route group
