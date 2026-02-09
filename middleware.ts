// Middleware for route protection and authentication

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public routes that don't require authentication
const PUBLIC_ROUTES = ['/login']

// Define role-based route patterns
const ROLE_ROUTES = {
  RESIDENT: /^\/resident/,
  TREASURER: /^\/treasurer/,
  GUARD: /^\/guard/,
  ADMIN: /^\/admin/,
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get auth token from cookies or headers
  const token = request.cookies.get('ilmia_token')?.value
  const userStr = request.cookies.get('ilmia_user')?.value

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route)

  // If accessing login page while authenticated, redirect to dashboard
  if (isPublicRoute && token && userStr) {
    try {
      const user = JSON.parse(userStr)
      const dashboardMap = {
        RESIDENT: '/resident',
        TREASURER: '/treasurer',
        GUARD: '/guard',
        ADMIN: '/admin',
      }

      const dashboard = dashboardMap[user.role as keyof typeof dashboardMap] || '/resident'
      return NextResponse.redirect(new URL(dashboard, request.url))
    } catch (error) {
      // Invalid user data, continue to login
      const response = NextResponse.next()
      response.cookies.delete('ilmia_token')
      response.cookies.delete('ilmia_user')
      return response
    }
  }

  // If accessing protected route without authentication, redirect to login
  if (!isPublicRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If authenticated, check role-based access
  if (!isPublicRoute && token && userStr) {
    try {
      const user = JSON.parse(userStr)
      const userRole = user.role as keyof typeof ROLE_ROUTES

      // Admin has access to all routes
      if (userRole === 'ADMIN') {
        return NextResponse.next()
      }

      // Check if user has access to the requested route
      const allowedPattern = ROLE_ROUTES[userRole]
      if (!allowedPattern || !allowedPattern.test(pathname)) {
        // Redirect to their own dashboard if trying to access unauthorized route
        const dashboardMap = {
          RESIDENT: '/resident',
          TREASURER: '/treasurer',
          GUARD: '/guard',
          ADMIN: '/admin',
        }

        const dashboard = dashboardMap[userRole] || '/resident'
        return NextResponse.redirect(new URL(dashboard, request.url))
      }
    } catch (error) {
      // Invalid user data, redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('ilmia_token')
      response.cookies.delete('ilmia_user')
      return response
    }
  }

  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
}
