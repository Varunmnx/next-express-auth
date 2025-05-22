// lib/serverAuth.ts
import { GetServerSidePropsContext, GetServerSidePropsResult, NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next"; 
import { Session } from "next-auth";
import { authOptions } from "@/auth";

// Type for server-side authenticated context
export interface AuthenticatedContext extends GetServerSidePropsContext {
  session: Session;
}

// Type for API handler
type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

// Type for server-side verify session result
interface VerifySessionResult {
  authenticated: boolean;
  session: Session | null;
  error: string | null;
}

/**
 * Server-side authentication helper
 * Can be used in API routes and getServerSideProps
 */
export async function getServerAuthSession(
  req: NextApiRequest | GetServerSidePropsContext["req"],
  res: NextApiResponse | GetServerSidePropsContext["res"]
): Promise<Session | null> {
  return await getServerSession(req, res, authOptions);
}

/**
 * Verify if user is authenticated on the server side
 * Returns { authenticated: boolean, session: Object|null, error: string|null }
 */
export async function verifyServerSession(
  req: NextApiRequest | GetServerSidePropsContext["req"],
  res: NextApiResponse | GetServerSidePropsContext["res"]
): Promise<VerifySessionResult> {
  try {
    const session = await getServerAuthSession(req, res);

    if (!session) {
      return { authenticated: false, session: null, error: "Unauthorized" };
    }

    // Check for refresh token errors
    if (session.error === "RefreshAccessTokenError") {
      return { authenticated: false, session: null, error: "Token expired" };
    }

    // Check token expiration
    if (session?.expiresAt && Date.now() > session.expiresAt) {
      return { authenticated: false, session: null, error: "Token expired" };
    }

    return { authenticated: true, session, error: null };
  } catch (error) {
    console.error("Server auth error:", error);
    return { authenticated: false, session: null, error: "Authentication error" };
  }
}

/**
 * Helper for protected API routes
 */
export function withApiAuth(handler: ApiHandler): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const { authenticated, error } = await verifyServerSession(req, res);

    if (!authenticated) {
      return res.status(401).json({ error });
    }

    return await handler(req, res);
  };
}

/**
 * Helper for protected pages using getServerSideProps
 */
export function withServerSideAuth<
  P extends { [key: string]: any } = { [key: string]: any }
>(
  getServerSidePropsFunc?: (
    context: AuthenticatedContext
  ) => Promise<GetServerSidePropsResult<P>>
): (
  context: GetServerSidePropsContext
) => Promise<GetServerSidePropsResult<P & { session: Session }>> {
  return async (context: GetServerSidePropsContext) => {
    const { req, res } = context;
    const session = await getServerAuthSession(req, res);

    // If no session exists, redirect to login
    if (!session) {
      return {
        redirect: {
          destination: `/auth/signin?callbackUrl=${encodeURIComponent(context.resolvedUrl)}`,
          permanent: false,
        },
      };
    }

    // Check for refresh token errors
    if (session.error === "RefreshAccessTokenError") {
      return {
        redirect: {
          destination: `/auth/signin?error=TokenExpired`,
          permanent: false,
        },
      };
    }

    // If getServerSideProps function was provided, execute it
    if (getServerSidePropsFunc) {
      const result = await getServerSidePropsFunc({
        ...context,
        session,
      });

      // Handle redirect case
      if ('redirect' in result) {
        return result;
      }

      // Handle notFound case
      if ('notFound' in result) {
        return result;
      }

      // Return the result with the session
      return {
        props: {
          ...((result.props || {}) as P),
          session,
        },
      };
    }

    // Default props with session
    return {
      props: { session } as P & { session: Session },
    };
  };
}