"use client";

import { logoutServerAction } from "@/actions/auth/logout-server-action";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface Props {
  children: React.ReactNode;
}

// Component to monitor session status
function SessionMonitor({ children }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Reset redirect flag when status changes to authenticated
    if (status === "authenticated") {
      hasRedirected.current = false;
    }

    // If status is unauthenticated and we haven't already redirected
    if (status === "unauthenticated" && !hasRedirected.current && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const publicRoutes = ['/home', '/login', '/signup'];
      
      // Check if current path is a public route
      const isPublicRoute = publicRoutes.some(route => 
        currentPath === route || currentPath.startsWith(`${route}/`)
      );
      
      // Don't redirect if already on a public route
      if (!isPublicRoute) {
        console.log("Session invalid, redirecting to login");
        hasRedirected.current = true;
        
        // Sign out to clear any remaining session data
        (async ()=>{
              // Promise.allSettled([await logoutServerAction()])
              signOut({ 
                callbackUrl: `/login`,
                redirect:true
              });
              // window.location.reload();
      })()
      }
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return <>{children}</>;
}

// Main session provider wrapper
export function SessionProvider({ children }: Props) {
  return (
    <NextAuthSessionProvider 
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true} // Refetch when window gains focus
    >
      <SessionMonitor>
        {children}
      </SessionMonitor>
    </NextAuthSessionProvider>
  );
}