// pages/api/auth/[...nextauth].ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Define types for JWT and Session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
    };
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    error?: string;
  }

  interface User {
    id: string;
    email: string;
    name: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user: {
      id: string;
      email: string;
      name: string;
    };
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    error?: string;
  }
}

interface RefreshedTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

/**
 * NextAuth configuration with complete JWT lifecycle management
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        try {
          // Call your authentication API
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await response.json();

          // If authentication was successful
          if (response.ok && data.accessToken) {
            // Return user object with tokens
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              // Store the tokens to be available in the JWT
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              accessTokenExpires: data.expiresAt || Date.now() + 15 * 60 * 1000, // 15 minutes from now if not provided
            };
          }
          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],

  // Configure JWT
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET,
  },

  // Callbacks for custom handling
  callbacks: {
    // Executed when JWT is created (on sign in) or updated
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user && account) {
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpires: user.accessTokenExpires,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Access token has expired, try to refresh it
      return await refreshAccessToken(token);
    },

    // Executed whenever session is checked
    async session({ session, token }) {
      // Send properties to the client
      session.user = token.user;
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.accessTokenExpires = token.accessTokenExpires;
      session.error = token.error;

      return session;
    },

    // Control which URLs can redirect after sign in/out
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },

  // Custom pages
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },

  // Enable debug messages in the console
  debug: process.env.NODE_ENV === "development",
};

/**
 * Refreshes the access token using the refresh token
 */
async function refreshAccessToken(token: any): Promise<any> {
  try {
    // Call your refresh token API endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refreshToken: token.refreshToken,
      }),
    });

    const refreshedTokens: RefreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.accessToken,
      refreshToken: refreshedTokens.refreshToken ?? token.refreshToken, // Fall back to old refresh token
      accessTokenExpires: Date.now() + (refreshedTokens.expiresIn || 15 * 60) * 1000,
    };
  } catch (error) {
    console.error("Error refreshing token:", error);

    // The error property will be used client-side to handle the refresh token error
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export default NextAuth(authOptions);