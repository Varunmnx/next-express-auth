import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getTokensAction } from './actions/auth/get-tokens-action' 
import { validateJwtToken } from './lib/jwt-token'
import { refreshTokenGenerationAction } from './actions/auth/refresh-token-generation-action'
import { logoutServerAction } from './actions/auth/logout-server-action'

// Public routes that don't require authentication
const publicRoutes = ['/home', '/login', '/signup']
const authRoutes = ['/login', '/signup']

const isAuthRoute = (pathname: string) => 
  authRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))

const isPublicRoute = (pathname: string) => 
  publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  console.log("<====> pathname <===>", pathname)

  // Check for token in cookies
  const tokens = await getTokensAction()
  let token = tokens?.accessToken
  const refreshToken = tokens?.refreshToken
  
  // Skip auth check for public routes
  if (isPublicRoute(pathname) && !isAuthRoute(pathname)) {
    return NextResponse.next()
  }

  // Check if token is valid
  let isTokenValid = token ? await validateJwtToken(token) : false
  console.log(
    "<====> token <===>",
    token,
    "<====> isTokenValid <===>",
    isTokenValid
  )
  // If token is invalid but we have a refresh token, try to refresh
  if (!isTokenValid && refreshToken) {
    try {
      const refreshResult = await refreshTokenGenerationAction()
      
      if (refreshResult.success) {
        // Token was refreshed successfully
        token = refreshResult.access_token
        isTokenValid = true
        
        // Create a new response to continue
        const response = NextResponse.next()
        
        // We don't need to set cookies here as the action already does that
        return response
      } else {
        // Refresh failed, clear cookies
        logoutServerAction()
      }
    } catch (error) {
      console.error("Error refreshing token:", error)
      // Clear cookies on error
      logoutServerAction()
    }
  } else if (!isTokenValid) {
    // Token is invalid and we don't have a refresh token
    logoutServerAction()
  }

  // Handle auth routes - redirect to dashboard if already authenticated
  if (isTokenValid && isAuthRoute(pathname)) {
    const homeUrl = new URL('/aboutme', request.url)
    return NextResponse.redirect(homeUrl)
  }

  // Handle protected routes - redirect to login if not authenticated
  if (!isTokenValid && !isAuthRoute(pathname)) {
    const loginUrl = new URL('/login', request.url)
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