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
  
  console.log('Middleware running for path:', pathname)
  
  // Skip auth check for public routes that are not auth routes
  if (isPublicRoute(pathname) && !isAuthRoute(pathname)) {
    console.log('Public route, allowing access:', pathname)
    return NextResponse.next()
  }
  
  // Get the token using NextAuth's getToken
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })
  console.log('Token: [middleware.ts]:31', token)
  console.log('Token exists:', !!token)
  console.log('Token error:', token?.error)
  
  // Check if token exists and is valid
  const isAuthenticated = !!token && !token.error
  
  console.log('User authenticated:', isAuthenticated)
  
  // Handle auth routes - redirect authenticated users away from login/signup
  if (isAuthenticated && isAuthRoute(pathname)) {
    console.log('Authenticated user trying to access auth route, redirecting to /aboutme')
    const homeUrl = new URL('/aboutme', request.url)
    return NextResponse.redirect(homeUrl)
  }
  
  // Handle protected routes - redirect unauthenticated users to login
  if (!isAuthenticated && !isAuthRoute(pathname) && !isPublicRoute(pathname)) {
    console.log('Unauthenticated user trying to access protected route, redirecting to login')
    const loginUrl = new URL('/login', request.url)
    // Add the callback URL to redirect back after login
    console.log("cburl",encodeURI(request.url))
    loginUrl.searchParams.set('callbackUrl', encodeURIComponent(request.url))
    return NextResponse.redirect(loginUrl)
  }
  
  console.log('Allowing access to:', pathname)
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
     * - api routes (optional - remove from exclusion if you want to protect API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}