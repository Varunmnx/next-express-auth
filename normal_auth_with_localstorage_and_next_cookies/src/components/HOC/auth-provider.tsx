"use client"
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, ReactNode, JSX } from "react";
import { Session } from "next-auth";

interface AuthProviderProps {
  children: ReactNode;
  session: Session | null;
}

/**
 * Global authentication provider
 * Wraps the application with session management
 */
export function AuthProvider({ children, session }: AuthProviderProps): JSX.Element {
  return (
    <SessionProvider session={session} refetchInterval={5 * 60}>
      <AuthTokenHandler>{children}</AuthTokenHandler>
    </SessionProvider>
  );
}

interface AuthTokenHandlerProps {
  children: ReactNode;
}

/**
 * Component to handle token refresh and session monitoring
 */
function AuthTokenHandler({ children }: AuthTokenHandlerProps): JSX.Element {
  const router = useRouter();
  const { data: session, status } = useSession();
  const publicPaths = [
    '/auth/signin',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/reset-password',
  ];

  // Check if current path is public (doesn't require authentication)
  const isPublicPath = (): boolean => {
    return publicPaths.some(path => router.pathname.startsWith(path));
  };

  // Handle session errors
  useEffect(() => {
    if (status === 'authenticated' && session?.error === 'RefreshAccessTokenError' && !isPublicPath()) {
      // Redirect to login page if token refresh failed
      console.log("Token refresh error, redirecting to login");
      router.push(`/auth/signin?error=SessionExpired&callbackUrl=${encodeURIComponent(router.asPath)}`);
    }
  }, [session, router, status]);

  return <>{children}</>;
}

export default AuthProvider;