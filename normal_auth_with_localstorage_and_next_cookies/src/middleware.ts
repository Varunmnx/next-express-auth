import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server' 
import { cookies } from 'next/headers'
import { CookieKeys } from './lib/constants'
import { validateJwtToken } from './lib/jwt-token'


// Public routes that don't require authentication
const publicRoutes = ['/home', '/login', '/signup']
const authRoutes = ['/login', '/signup']
const isAuthRoute = (pathname: string) => authRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))
const isPublicRoute = (pathname: string) => publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
   console.log("<====> pathname <===>",pathname)
   // Check for token in cookies
   const cookieStore = await cookies()
   const token = cookieStore.get(CookieKeys.AUTH_TOKEN)?.value
   const isTokenValid = await validateJwtToken(token as string)
   console.log("<====> isTokenValid <===>",isTokenValid)
   if(!isTokenValid){
    cookieStore.delete(CookieKeys.AUTH_TOKEN) 
   }
   if ((!isTokenValid && isPublicRoute(pathname))) {
    return NextResponse.next()
  }

  if(isTokenValid && isAuthRoute(pathname)) {
    const homeUrl = new URL('/aboutme', request.url) 
    return NextResponse.redirect(homeUrl)
  } 

  console.log("<====> cookie found <===>",token)
  if ((!token || !isTokenValid)) {
    // Redirect to login if no token is found
    if(isAuthRoute(pathname)) return NextResponse.next()
    const loginUrl = new URL('/login', request.url) 
    return NextResponse.redirect(loginUrl)
  }

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