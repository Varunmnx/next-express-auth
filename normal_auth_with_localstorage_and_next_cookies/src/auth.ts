import NextAuth, { type NextAuthOptions, type User as NextAuthUser } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { refreshTokenGenerationAction } from "./actions/auth/refresh-token-generation-action";
const REFRESH_TOKEN_EXPIRE_TIME = 24 * 60 * 60 * 1000 * 7; // 24 hours in milliseconds
const ACCESS_TOKEN_EXPIRE_TIME = 1000 * 30

// Define a type for the user object returned by your backend
// and for the user object you'll use within NextAuth callbacks
interface BackendUser { 
  username: string; 
  access_token?: string;
  refresh_token?: string; 
  // Add any other properties your backend returns for a user
}

// Extend NextAuth's User type if you have custom properties like accessToken, refreshToken, role
// These will be available on the `user` parameter in the `jwt` callback if returned from `authorize`
// and on `token` in `jwt` callback, and `session.user` in `session` callback if you pass them through.
interface ExtendedUser extends NextAuthUser {
  accessToken?: string;
  refreshToken?: string;
  role?: string;
  // id is already part of NextAuthUser, ensure it's a string
}


export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || "",
      clientSecret: process.env.GOOGLE_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "your_username" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<ExtendedUser | null> {
        // Validate credentials presence
        if (!credentials?.username || !credentials?.password) {
          console.error("Authorize: Missing username or password");
          return null;
        }
        if (!process.env.NEXT_PUBLIC_API_URL) {
            console.error("Authorize: NEXT_PUBLIC_API_URL is not set.");
            return null;
        }

        try {
          // Call your external backend API for authentication
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password
            }),
          });

          if (!response.ok) {
            const errorBody = await response.text(); // Get more details on error
            console.error(`Authorize: Authentication failed with status ${response.status}. Response: ${errorBody}`);
            // Optionally, you could throw an error that NextAuth can catch and display
            // throw new Error(`CredentialsSignin: ${errorBody || 'Authentication failed'}`);
            return null;
          }

          const backendUser = await response.json() as BackendUser;

          // Ensure the backendUser object has necessary properties
          if (backendUser) {
            // Map backendUser to the structure NextAuth expects for a User,
            // including any custom properties you want to flow to the JWT.
            return {
              id: "1", // Must be a string
              username: backendUser?.username,  
              accessToken: backendUser?.access_token,
              refreshToken: backendUser?.refresh_token 
            };
          }
          console.error("Authorize: Backend user data is invalid or missing id.");
          return null; // Authentication failed or user data is not as expected
        } catch (error) {
          console.error('Authorize: Exception during authentication:', error);
          // To show a generic error on the client, you might throw a specific type of error
          // or ensure your /login?error=true page handles this.
          return null; // Signifies authentication failure
        }
      }
    }),
  ],
  pages: {
    signIn: '/login', // Your custom login page
    error: '/login', // Redirect to login page on error, you can append query params like ?error=CredentialsSignin
  },
  callbacks: {
    async jwt({ token, user, account, profile, trigger,session }) {
      // The 'user' object here is what was returned from the 'authorize' function (for credentials)
      // or the profile from an OAuth provider.
      // The 'account' object has provider details and tokens from OAuth providers.
      if (trigger === "update" && session?.newAccessToken && session?.newRefreshToken) {
        // Note, that `session` can be any arbitrary object, remember to validate it!
        token.accessToken = session.newAccessToken;
        token.refreshToken = session.newRefreshToken;
        token.expiresAt = Date.now() + ACCESS_TOKEN_EXPIRE_TIME; // Set a new expiry time
        return token;
      }
      // Initial sign in
      if (account && user) {
        token.id = user.id; // user.id comes from authorize or OAuth profile
        token.name = user?.name as string;
        token.email = user?.email as string;


        // For credentials provider, 'user' will be the ExtendedUser from authorize
        if (account.provider === 'credentials') {
          token.accessToken = (user as ExtendedUser).accessToken;
          token.refreshToken = (user as ExtendedUser).refreshToken;
        }
        // For OAuth providers, you might get access_token from 'account'
        else if (account.access_token) {
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token; 
        }
        // Set an expiry for the access token if your backend provides it or if it's an OAuth token
        if (account.expires_at) {
            token.expiresAt = account.expires_at * 1000; // Convert to milliseconds
        } else if ((user as ExtendedUser).accessToken && account.provider === 'credentials') {
            // If your credentials backend provides an expiry, use it.
            // Otherwise, set a default or manage it based on your backend's token lifecycle.
            // For this example, assuming the token from credentials provider is managed by refresh logic below.
            token.expiresAt = Date.now() + ACCESS_TOKEN_EXPIRE_TIME// 20 sec
        }

        return token;
      }

      // If token has not expired, return it.
      // Check if expiresAt exists and is a number
      if (typeof token.expiresAt === 'number' && Date.now() < token.expiresAt) {
        return token;
      }

      // If the access token has expired (or is about to expire) and we have a refresh token, try to refresh it.
      // This part is primarily for tokens that have an expiry and a refresh mechanism.
      // If your credentials provider's tokens don't expire or are refreshed differently, adjust this.
      if (token.refreshToken) {
        console.log("Attempting to refresh token...");
        try {
          if (!process.env.NEXT_PUBLIC_API_URL) {
            console.error("JWT Callback: NEXT_PUBLIC_API_URL is not set for token refresh.");
            token.error = "RefreshConfigError";
            return token;
          }
          const refreshedTokens = await refreshTokenGenerationAction()

          if (refreshedTokens.success) { 
            console.log("Token refreshed successfully.");
            return {
              ...token,
              accessToken: refreshedTokens?.access_token,
              // Update refresh token only if the backend sends a new one
              refreshToken: refreshedTokens?.refresh_token || token.refreshToken,
              // Calculate new expiry time
              expiresAt: Date.now() + ACCESS_TOKEN_EXPIRE_TIME,
              error: undefined, // Clear any previous error
            };
          } else { 
            console.error(`JWT Callback: Token refresh failed with status ${refreshedTokens.error}.`);
            token.error = "RefreshAccessTokenError"; // Mark token as having a refresh error
            // Potentially clear accessToken and refreshToken if refresh fails definitively
            // delete token.accessToken;
            // delete token.refreshToken;
            // delete token.expiresAt;
            return token; // Return token with error, session callback can handle this
          }
        } catch (error) {
          console.error('JWT Callback: Exception during token refresh:', error);
          token.error = "RefreshAccessTokenError";
          return token;
        }
      }

      // If no refreshToken or refresh failed and token is expired, the session is invalid.
      // The 'error' field will propagate to the session.
      // If token.expiresAt is set and in the past, and no refresh was possible:
      if (typeof token.expiresAt === 'number' && Date.now() >= token.expiresAt) {
          console.log("Access token expired and no refresh possible or refresh failed.");
          // Mark the token as invalid by setting an error or removing sensitive parts
          token.error = "SessionExpired";
          delete token.accessToken; // Important: remove expired access token
      }

      return token; // Return the (potentially updated or error-marked) token
    },
    async session({ session, token }) {
      // 'token' is the object returned by the jwt callback.
      // Assign properties from the token to the session object.
      // This is what client-side `useSession` or server-side `getSession` will see.
      if (token.id) session.user.id = token.id as string;
      if (token.username) session.user.username = token.username as string;
      // Pass the accessToken to the session if you need it on the client-side
      // Be cautious about exposing accessTokens to the client unless necessary.
      if (token.accessToken) (session).accessToken = token.accessToken as string;


      // Handle errors from JWT callback (e.g., refresh failure)
      if (token.error) {
        (session).error = token.error as string;

      if(token.expiresAt)
        (session).expiresAt = token.expiresAt as number;
        // If session.error is "RefreshAccessTokenError" or "SessionExpired",
        // the client can use this to force a sign-out or show a message.
      }
      
      return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days for the session cookie itself
    // updateAge: 24 * 60 * 60, // How often to update the session database (not applicable for JWT strategy if not using database sessions)
  },
  secret: process.env.NEXTAUTH_SECRET, // Essential for JWT signing
  debug: process.env.NODE_ENV === 'development', // Enable debug messages in development
};

// The route handler for NextAuth.js
// This exports GET and POST handlers for /api/auth/*
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
