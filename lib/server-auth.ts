// Server-only utility for extracting caller claims from API routes.
// Import this in Route Handlers only — never in client components.

import { createClient } from '@/lib/supabase/server'
import type { AppPermission } from '@/lib/types'

export interface CallerClaims {
  userId:  string
  role:    string
  actions: AppPermission[]
}

/**
 * Extracts the authenticated caller's role and action permissions from the JWT.
 * Returns null if the request is unauthenticated.
 */
export async function getCallerClaims(): Promise<CallerClaims | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  let role: string | undefined
  let actions: AppPermission[] = []

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const payload = JSON.parse(atob(session.access_token.split('.')[1]))
      role    = payload.user_role    ?? user.app_metadata?.user_role
      actions = Array.isArray(payload.user_actions) ? payload.user_actions : []
    }
  } catch {
    role = user.app_metadata?.user_role
  }

  if (!role) return null
  return { userId: user.id, role, actions }
}

/**
 * Returns a 401/403 Response if the caller lacks the given action permission,
 * or null if the caller is authorized (allowing the route handler to continue).
 */
export function requireAction(
  claims: CallerClaims | null,
  action: AppPermission,
): Response | null {
  if (!claims) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!claims.actions.includes(action)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

/**
 * Returns a 401/403 Response if the caller's role is not in the allowed list.
 * Use requireAction() for permission-based checks; use this for strict role checks.
 */
export function requireRole(
  claims: CallerClaims | null,
  ...allowedRoles: string[]
): Response | null {
  if (!claims) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!allowedRoles.includes(claims.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}
