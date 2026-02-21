import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Skip if env vars are not configured yet
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Do not run code between createServerClient and supabase.auth.getClaims().
  // A simple mistake could make it very hard to debug issues with users being
  // randomly logged out.

  // IMPORTANT: getClaims() validates the JWT signature. Always use this
  // instead of getSession() for server-side auth checks.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  const { pathname } = request.nextUrl

  // Define public routes that don't require authentication
  const isPublicRoute =
    pathname === "/login" ||
    pathname === "/signout" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/visitor") ||
    pathname.startsWith("/api/visitor") ||
    pathname === "/api/houses" ||
    pathname === "/api/auth/register-profile"

  const dashboardMap: Record<string, string> = {
    RESIDENT:      "/resident",
    GUARD:         "/guard",
    AJK_COMMITTEE: "/treasurer",
    AJK_LEADER:    "/admin",
  }

  // Redirect authenticated users away from root/login/auth pages to their dashboard
  // Do NOT redirect API routes — fetch() calls from authenticated pages need to reach them
  if ((isPublicRoute || pathname === "/") && user && !pathname.startsWith("/api/") && pathname !== "/auth/reset-password") {
    const role = (user.user_role ?? user.app_metadata?.user_role) as string | undefined
    const dashboard = (role && dashboardMap[role]) || "/resident"
    const url = request.nextUrl.clone()
    url.pathname = dashboard
    return NextResponse.redirect(url)
  }

  // If accessing protected route without authentication, redirect to login
  if (!isPublicRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  // If authenticated, check role-based access
  if (!isPublicRoute && user) {
    const role = (user.user_role ?? user.app_metadata?.user_role) as string | undefined

    // Block INACTIVE users from accessing protected routes
    const userStatus = user.user_status as string | undefined
    if (userStatus === "INACTIVE") {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("reason", "inactive")
      return NextResponse.redirect(url)
    }

    // Read allowed route prefixes from JWT (injected by custom_access_token_hook)
    const userRoutes = Array.isArray(user.user_routes)
      ? (user.user_routes as string[])
      : []

    const isAllowed = userRoutes.some((r) => pathname.startsWith(`/${r}`))

    if (!isAllowed && !pathname.startsWith('/api/')) {
      const dashboard = (role && dashboardMap[role]) || "/resident"
      const url = request.nextUrl.clone()
      url.pathname = dashboard
      return NextResponse.redirect(url)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next(), make sure to:
  // 1. Pass the request in it: const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies: myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Then return myNewResponse
  return supabaseResponse
}
