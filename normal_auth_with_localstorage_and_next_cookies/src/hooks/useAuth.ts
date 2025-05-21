import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Session } from "next-auth";

interface AuthHookOptions {
  required?: boolean;
  redirectTo?: string;
  queryParams?: Record<string, string>;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResult {
  error?: string;
  success?: boolean;
}

interface AuthContextValue {
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
  session: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
  loading: boolean;
  login: (credentials: LoginCredentials, callbackUrl?: string) => Promise<LoginResult>;
  logout: (callbackUrl?: string) => Promise<void>;
  isTokenExpiringSoon: () => boolean;
}

/**
 * Custom authentication hook to handle JWT lifecycle
 */
export default function useAuth(options: AuthHookOptions = {}): AuthContextValue {
  const { required = false, redirectTo = "/auth/signin", queryParams = {} } = options;
  
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const router = useRouter();
  const [user, setUser] = useState<AuthContextValue["user"]>(null);
  
  // Handle session changes and errors
  useEffect(() => {
    if (!loading) {
      // If session exists but has a refresh error
      if (session?.error === "RefreshAccessTokenError") {
        // Force sign out on token refresh error
        console.log("Session refresh error - logging out");
        signOut({ callbackUrl: `/auth/signin?error=SessionExpired` });
        return;
      }

      // If session exists and is valid
      if (session?.user) {
        setUser(session.user);
      } else if (required) {
        // If session is required but doesn't exist
        // Create the redirect URL with any provided query parameters
        const queryString = new URLSearchParams({
          ...queryParams,
          callbackUrl: router.asPath,
        }).toString();
        
        const redirectUrl = `${redirectTo}?${queryString}`;
        router.push(redirectUrl);
      }
    }
  }, [session, loading, required, router, redirectTo, queryParams]);

  // Wrap the original signIn function to allow for custom params
  const login = async (credentials: LoginCredentials, callbackUrl?: string): Promise<LoginResult> => {
    try {
      const result = await signIn("credentials", {
        ...credentials,
        redirect: false,
      });

      if (result?.error) {
        return { error: result.error };
      }

      if (result?.ok && callbackUrl) {
        router.push(callbackUrl);
      }

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { error: "An unexpected error occurred" };
    }
  };

  // Custom logout with redirect
  const logout = async (callbackUrl = "/"): Promise<void> => {
    await signOut({ redirect: false });
    router.push(callbackUrl);
  };

  // Check if token is about to expire (within 5 minutes)
  const isTokenExpiringSoon = (): boolean => {
    if (!session?.accessToken) return false;
    
    try {
      // Assuming you have access to token expiry via your session
      const expiresAt = session.accessTokenExpires || 0;
      const fiveMinutes = 5 * 60 * 1000;
      
      return Date.now() > (expiresAt - fiveMinutes);
    } catch (error) {
      console.error("Error checking token expiration:", error);
      return false;
    }
  };

  return {
    user,
    session,
    status,
    loading,
    login,
    logout,
    isTokenExpiringSoon,
  };
}