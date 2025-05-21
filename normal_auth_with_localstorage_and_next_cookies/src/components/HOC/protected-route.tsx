// components/ProtectedRoute.tsx
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, ReactNode, ComponentType, JSX } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * HOC for protecting routes that require authentication
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps): JSX.Element | null {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const router = useRouter();

  useEffect(() => {
    // If user is not authenticated and page has loaded
    if (!loading && !session) {
      // Redirect to login page with callback URL
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(router.asPath)}`);
    }
    
    // Check for refresh token errors
    if (session?.error === "RefreshAccessTokenError") {
      // Force sign out on token refresh error
      router.push(`/auth/signin?error=TokenExpired`);
    }
  }, [session, loading, router]);

  // Show loading state while checking session
  if (loading || !session) {
    return <div>Loading...</div>;
  }

  // If authenticated, render children
  return <>{children}</>;
}

/**
 * Alternative: HOC function that can be used to wrap pages
 */
export function withAuth<P extends object>(Component: ComponentType<P>): ComponentType<P> {
  return function AuthenticatedComponent(props: P): JSX.Element {
    return (
      <ProtectedRoute>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}