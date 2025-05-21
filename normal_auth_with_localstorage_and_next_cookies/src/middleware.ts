import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Public routes that don't require authentication
const publicRoutes = ['/home', '/login', '/signup']
const authRoutes = ['/login', '/signup']

const isAuthRoute = (pathname: string) => 
  authRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))

const isPublicRoute = (pathname: string) => 
  publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip auth check for public routes
  if (isPublicRoute(pathname) && !isAuthRoute(pathname)) {
    return NextResponse.next()
  }

  // Get the token using NextAuth's getToken
  const token = await getToken({ 
    req: request, 
    secret: process.env.JWT_SECRET,
    secureCookie: process.env.NODE_ENV === 'production'
  })

  // Check if token exists and is valid
  const isAuthenticated = !!token && !token.error
  
  // Handle auth routes - redirect to dashboard if already authenticated
  if (isAuthenticated && isAuthRoute(pathname)) {
    const homeUrl = new URL('/aboutme', request.url)
    return NextResponse.redirect(homeUrl)
  }

  // Handle protected routes - redirect to login if not authenticated
  if (!isAuthenticated && !isAuthRoute(pathname)) {
    const loginUrl = new URL('/login', request.url)
    // Add the callback URL to redirect back after login
    loginUrl.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Pass to next middleware or page if everything is fine
  return NextResponse.next()
}

// Configure middleware to run on all paths except next.js system paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (if you don't want to protect them with this middleware)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}